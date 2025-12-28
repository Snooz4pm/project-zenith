'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { SUPPORTED_STOCKS, SUPPORTED_FOREX, SUPPORTED_CRYPTO } from '@/lib/market/symbols';
import { fetchCryptoPrice, CRYPTO_NAMES } from '@/lib/market/crypto-engine';
import { getStockQuote, getForexRates, MAJOR_FOREX_PAIRS, MINOR_FOREX_PAIRS, EXOTIC_FOREX_PAIRS } from '@/lib/finnhub';

// Bypass PrismaClient type mismatch for generated models
const db = prisma as any;

// ===========================================
// ASSET TYPES
// ===========================================

export interface TradeableAsset {
    symbol: string;
    name: string;
    current_price: number;
    price_change_24h: number;
    asset_type: 'CRYPTO' | 'STOCK' | 'FOREX';
    max_leverage: number;
}

// ===========================================
// GET ALL TRADEABLE ASSETS WITH LIVE PRICES
// ===========================================

/**
 * Fetches all supported assets with their current live prices.
 * This is used to populate the AssetPicker with real data.
 */
export async function getTradeableAssets(): Promise<TradeableAsset[]> {
    const assets: TradeableAsset[] = [];

    // 1. CRYPTO - Fetch from Coinbase/CoinGecko via crypto-engine
    const cryptoPromises = SUPPORTED_CRYPTO.map(async (symbol) => {
        try {
            const data = await fetchCryptoPrice(symbol);
            if (data && data.price > 0) {
                return {
                    symbol: data.symbol,
                    name: data.name || CRYPTO_NAMES[symbol] || symbol,
                    current_price: data.price,
                    price_change_24h: data.changePercent || 0,
                    asset_type: 'CRYPTO' as const,
                    max_leverage: 100,
                };
            }
        } catch (e) {
            console.warn(`[getTradeableAssets] Crypto ${symbol} failed`, e);
        }
        return null;
    });

    // 2. STOCKS - Fetch from Finnhub
    const stockPromises = SUPPORTED_STOCKS.map(async (symbol) => {
        try {
            const quote = await getStockQuote(symbol);
            if (quote && quote.c > 0) {
                return {
                    symbol,
                    name: symbol, // Finnhub doesn't provide names in quote endpoint
                    current_price: quote.c,
                    price_change_24h: quote.dp || 0,
                    asset_type: 'STOCK' as const,
                    max_leverage: 20,
                };
            }
        } catch (e) {
            console.warn(`[getTradeableAssets] Stock ${symbol} failed`, e);
        }
        return null;
    });

    // 3. FOREX - Fetch rates and convert
    const allForexPairs = { ...MAJOR_FOREX_PAIRS, ...MINOR_FOREX_PAIRS, ...EXOTIC_FOREX_PAIRS };
    const forexPromises = SUPPORTED_FOREX.map(async (pair) => {
        try {
            // Split pair like EUR/USD
            const [base, quote] = pair.split('/');
            const rates = await getForexRates(base);
            if (rates && rates.quote && rates.quote[quote]) {
                const pairInfo = allForexPairs[pair as keyof typeof allForexPairs];
                return {
                    symbol: pair,
                    name: pairInfo?.name || pair,
                    current_price: rates.quote[quote],
                    price_change_24h: 0, // Finnhub forex rates don't include change
                    asset_type: 'FOREX' as const,
                    max_leverage: 500,
                };
            }
        } catch (e) {
            console.warn(`[getTradeableAssets] Forex ${pair} failed`, e);
        }
        return null;
    });

    // Resolve all promises
    const [cryptoResults, stockResults, forexResults] = await Promise.all([
        Promise.all(cryptoPromises),
        Promise.all(stockPromises),
        Promise.all(forexPromises),
    ]);

    // Filter out nulls and add to assets
    cryptoResults.forEach(r => r && assets.push(r));
    stockResults.forEach(r => r && assets.push(r));
    forexResults.forEach(r => r && assets.push(r));

    return assets;
}

// ===========================================
// FETCH SINGLE ASSET LIVE PRICE (FOR TRADE VERIFICATION)
// ===========================================

/**
 * Fetches the current live price for a specific asset.
 * Used to verify price before trade execution.
 */
export async function fetchLivePrice(symbol: string, assetType: 'CRYPTO' | 'STOCK' | 'FOREX'): Promise<{ price: number; timestamp: number } | null> {
    try {
        if (assetType === 'CRYPTO') {
            const data = await fetchCryptoPrice(symbol);
            if (data && data.price > 0) {
                return { price: data.price, timestamp: data.timestamp };
            }
        } else if (assetType === 'STOCK') {
            const quote = await getStockQuote(symbol);
            if (quote && quote.c > 0) {
                return { price: quote.c, timestamp: quote.t ? quote.t * 1000 : Date.now() };
            }
        } else if (assetType === 'FOREX') {
            const [base, quote] = symbol.split('/');
            const rates = await getForexRates(base);
            if (rates && rates.quote && rates.quote[quote]) {
                return { price: rates.quote[quote], timestamp: Date.now() };
            }
        }
    } catch (e) {
        console.error(`[fetchLivePrice] Failed for ${symbol}:`, e);
    }
    return null;
}

/**
 * Standardize decimal precision to avoid floating point anomalies.
 * 2 decimals for cash, 8 for crypto quantities.
 */
function roundCash(val: number) {
    return Math.round(val * 100) / 100;
}

/**
 * Creates or retrieves the user's permanent portfolio.
 */
export async function getPortfolio(userId: string) {
    try {
        let portfolio = await db.portfolio.findUnique({
            where: { userId },
            include: {
                positions: true,
                trades: {
                    orderBy: { timestamp: 'desc' },
                    take: 50,
                },
                snapshots: {
                    orderBy: { timestamp: 'asc' },
                    // Limit snapshots fetching if needed, for chart we might want all or last 30 days
                },
            },
        });

        if (!portfolio) {
            portfolio = await db.portfolio.create({
                data: {
                    userId,
                    balance: 50000, // Paper Trading Start
                },
                include: {
                    positions: true,
                    trades: true,
                    snapshots: true,
                },
            });

            // Create initial snapshot
            await db.portfolioSnapshot.create({
                data: {
                    portfolioId: portfolio.id,
                    totalEquity: 50000
                }
            });
        }

        return portfolio;
    } catch (error) {
        console.error('Failed to get portfolio:', error);
        return null;
    }
}

/**
 * EXECUTE TRADE - THE ACID TRANSACTION
 * 
 * Handles strictly:
 * 1. BUY: Cash -> Position
 * 2. SELL: Position -> Cash + Realized PnL
 * 
 * @param userId 
 * @param symbol 
 * @param side 'BUY' | 'SELL'
 * @param quantity Amount of asset
 * @param price Execution price
 */
export async function executeTrade(
    userId: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number
) {
    if (quantity <= 0 || price <= 0) {
        return { success: false, error: 'Invalid quantity or price' };
    }

    try {
        // 1. Fetch Portfolio & Existing Position
        const portfolio = await db.portfolio.findUnique({
            where: { userId },
            include: { positions: { where: { symbol } } },
        });

        if (!portfolio) return { success: false, error: 'Portfolio not found' };

        const transactionTotal = quantity * price;
        const existingPosition = portfolio.positions[0];

        // ==========================================
        // BUY LOGIC
        // ==========================================
        if (side === 'BUY') {
            // Validation
            if (portfolio.balance < transactionTotal) {
                return { success: false, error: 'Insufficient funds' };
            }

            // Calculations
            const newBalance = roundCash(portfolio.balance - transactionTotal);

            let newAvgPrice = price;
            let newQuantity = quantity;

            if (existingPosition) {
                const totalCost = (existingPosition.avgEntryPrice * existingPosition.quantity) + transactionTotal;
                newQuantity = existingPosition.quantity + quantity;
                newAvgPrice = totalCost / newQuantity;
            }

            // DB Transaction
            await db.$transaction(async (tx: any) => {
                // Update Cash
                await tx.portfolio.update({
                    where: { id: portfolio.id },
                    data: { balance: newBalance },
                });

                // Upsert Position
                await tx.position.upsert({
                    where: { portfolioId_symbol: { portfolioId: portfolio.id, symbol } },
                    update: { quantity: newQuantity, avgEntryPrice: newAvgPrice },
                    create: {
                        portfolioId: portfolio.id,
                        symbol,
                        quantity,
                        avgEntryPrice: price,
                    },
                });

                // Log Trade (Immutable)
                await tx.trade.create({
                    data: {
                        portfolioId: portfolio.id,
                        symbol,
                        side: 'BUY',
                        quantity,
                        price,
                    },
                });

                // Take Snapshot handled separately mostly, but we can do it after tx
            });
        }

        // ==========================================
        // SELL LOGIC
        // ==========================================
        else if (side === 'SELL') {
            if (!existingPosition || existingPosition.quantity < quantity) {
                return { success: false, error: 'Insufficient position size' };
            }

            // 1. Calculate PnL
            const avgEntry = existingPosition.avgEntryPrice;
            const realizedPnL = (price - avgEntry) * quantity;

            // 2. Transform Logic: We receive full principal + profit back
            // Cash increases by the full sale value: quantity * price
            const transactionValue = quantity * price;
            const newBalance = roundCash(portfolio.balance + transactionValue);

            // 3. Update Position
            const remainingQty = existingPosition.quantity - quantity;

            // DB Transaction
            await db.$transaction(async (tx: any) => {
                // Update Portfolio (Cash & Lifetime PnL)
                await tx.portfolio.update({
                    where: { id: portfolio.id },
                    data: {
                        balance: newBalance,
                        totalRealizedPnL: roundCash(portfolio.totalRealizedPnL + realizedPnL)
                    },
                });

                // Update Position
                if (remainingQty <= 0.00000001) { // Floating point epsilon
                    await tx.position.delete({
                        where: { id: existingPosition.id },
                    });
                } else {
                    await tx.position.update({
                        where: { id: existingPosition.id },
                        data: { quantity: remainingQty }, // Avg Entry Price DOES NOT CHANGE on sell
                    });
                }

                // Log Trade
                await tx.trade.create({
                    data: {
                        portfolioId: portfolio.id,
                        symbol,
                        side: 'SELL',
                        quantity,
                        price,
                        realizedPnL: roundCash(realizedPnL),
                    },
                });
            });
        }

        // Post-Trade Snapshot Logic (Async, non-blocking if possible, but safe to await)
        // We calculate equity based on this one updated price
        await captureSnapshot(portfolio.id);

        revalidatePath('/trading');
        revalidatePath('/portfolio');
        return { success: true };

    } catch (error) {
        console.error('Trade Execution Failed:', error);
        return { success: false, error: 'Execution failed' };
    }
}

/**
 * Captures a portfolio equity snapshot.
 */
async function captureSnapshot(portfolioId: string) {
    try {
        const portfolio = await db.portfolio.findUnique({
            where: { id: portfolioId },
            include: { positions: true }
        });

        if (!portfolio) return;

        const positionValue = portfolio.positions.reduce((acc: number, p: any) => acc + (p.quantity * p.avgEntryPrice), 0);
        const equity = portfolio.balance + positionValue;

        await db.portfolioSnapshot.create({
            data: {
                portfolioId,
                totalEquity: equity
            }
        });

    } catch (e) {
        console.error("Snapshot failed", e);
    }
}

/**
 * Emergency Reset
 */
export async function resetAccount(userId: string) {
    const portfolio = await db.portfolio.findUnique({ where: { userId } });
    if (portfolio) {
        await db.$transaction([
            db.trade.deleteMany({ where: { portfolioId: portfolio.id } }),
            db.position.deleteMany({ where: { portfolioId: portfolio.id } }),
            db.portfolioSnapshot.deleteMany({ where: { portfolioId: portfolio.id } }),
            db.portfolio.update({
                where: { id: portfolio.id },
                data: { balance: 50000, totalRealizedPnL: 0 }
            })
        ]);

        // Initial snapshot
        await db.portfolioSnapshot.create({
            data: { portfolioId: portfolio.id, totalEquity: 50000 }
        });

        revalidatePath('/trading');
        return { success: true };
    }
    return { success: false };
}
