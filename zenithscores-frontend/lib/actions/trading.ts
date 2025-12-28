'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
        let portfolio = await prisma.portfolio.findUnique({
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
            portfolio = await prisma.portfolio.create({
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
            await prisma.portfolioSnapshot.create({
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
        const portfolio = await prisma.portfolio.findUnique({
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
            await prisma.$transaction(async (tx) => {
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

                // Take Snapshot (Approximation using last transaction price for this asset + current balance)
                // Note: For a perfect equity curve we'd need live prices of ALL assets. 
                // Here we approximate equity = Cash + (Just Traded Asset * Price) + Rest of positions (mock or assume stable for this sec)
                // Better: Just snapshot Cash + (All Positions * Current Price - but we might not have all prices here).
                // Strategy: We record snapshot based on this transaction's implied equity impact.
                // Actually, easiest is: update snapshots in a separate routine or just logging it here.
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
            await prisma.$transaction(async (tx) => {
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
 * Requires fetching all positions to value them correctly.
 * This should ideally use real-time prices, but we will use the *last known execution price* 
 * or pass in current prices if available. 
 * Limitation: Without a live price oracle for ALL assets, equity charts only update perfectly when you trade that specific asset.
 */
async function captureSnapshot(portfolioId: string) {
    try {
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: { positions: true }
        });

        if (!portfolio) return;

        // In a real app, we would fetch live prices for all positions here.
        // For now, we value positions at their avgEntryPrice (cost basis) OR we accept that 
        // the chart only reflects realized gains + cost basis of holds until we have a price oracle.
        // BETTER: Use the `unrealized` PnL if passed, but since we don't have it, we'll try to estimate.

        // CRITICAL FIX: The user wants a chart that tracks progress. 
        // "Total Equity" = Balance + Sum(Position * Price).
        // Since we don't have all live prices in the backend, we will assume 
        // Position Value ~= Cost Basis (AvgEntry * Qty) for the backend snapshot 
        // UNLESS we eventually feed live prices.
        // Ideally the frontend sends the "Total Equity" to a snapshot endpoint.
        // BUT, we want backend trust.

        // Compromise: We snapshot (Balance + Cost Basis of Positions). 
        // This tracks Realized PnL perfectly. Unrealized PnL is invisible in this backend chart 
        // until realized, which is actually a "Conservative Accounting" view.

        const positionValue = portfolio.positions.reduce((acc, p) => acc + (p.quantity * p.avgEntryPrice), 0);
        const equity = portfolio.balance + positionValue; // + portfolio.totalRealizedPnL is already baked into balance

        await prisma.portfolioSnapshot.create({
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
    const portfolio = await prisma.portfolio.findUnique({ where: { userId } });
    if (portfolio) {
        await prisma.$transaction([
            prisma.trade.deleteMany({ where: { portfolioId: portfolio.id } }),
            prisma.position.deleteMany({ where: { portfolioId: portfolio.id } }),
            prisma.portfolioSnapshot.deleteMany({ where: { portfolioId: portfolio.id } }),
            prisma.portfolio.update({
                where: { id: portfolio.id },
                data: { balance: 50000, totalRealizedPnL: 0 }
            })
        ]);

        // Initial snapshot
        await prisma.portfolioSnapshot.create({
            data: { portfolioId: portfolio.id, totalEquity: 50000 }
        });

        revalidatePath('/trading');
        return { success: true };
    }
    return { success: false };
}
