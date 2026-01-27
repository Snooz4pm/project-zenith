export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

const API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const RPC_URL = API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

const connection = new Connection(RPC_URL, 'confirmed');

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Missing address' }, { status: 400 });
        }

        const pubkey = new PublicKey(address);

        // 1. Fetch SOL Balance & DAS Assets in parallel
        const [solBalance, dasResponse] = await Promise.all([
            connection.getBalance(pubkey),
            fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'portfolio-fetch',
                    method: 'getAssetsByOwner',
                    params: {
                        ownerAddress: address,
                        page: 1,
                        limit: 1000,
                        displayOptions: {
                            showFungible: true,
                            showNativeBalance: true,
                            showCollectionMetadata: false,
                            showUnverifiedCollections: false
                        },
                        sortBy: {
                            sortBy: 'recent_action',
                            sortDirection: 'desc'
                        }
                    }
                })
            }).then(res => res.json())
        ]);

        if (dasResponse.error) {
            throw new Error(dasResponse.error.message || 'DAS fetch failed');
        }

        const rawAssets = dasResponse.result?.items || [];

        // 2. Map Assets to Token List - Extract Helius DAS Prices
        console.log(`[Portfolio] Found ${rawAssets.length} raw assets`);

        const tokens = rawAssets
            .filter((asset: any) => {
                const isFungible = asset.interface === 'FungibleToken' || asset.interface === 'FungibleAsset';
                const hasBalance = asset.token_info?.balance && Number(asset.token_info.balance) > 0;
                return isFungible && hasBalance;
            })
            .map((asset: any) => {
                const info = asset.token_info;
                const metadata = asset.content?.metadata;
                const balanceRaw = Number(info.balance) || 0;
                const decimals = Number(info.decimals) || 0;

                // Extract Helius DAS price info if available
                const heliusPrice = info.price_info?.price_per_token || 0;
                const heliusTotalPrice = info.price_info?.total_price || 0;

                return {
                    mint: asset.id,
                    balance: balanceRaw / Math.pow(10, decimals),
                    decimals: decimals,
                    symbol: metadata?.symbol || info.symbol || '?',
                    name: metadata?.name || '',
                    logoURI: asset.content?.links?.image || asset.content?.files?.[0]?.uri || '',
                    heliusPrice: heliusPrice,         // Price from Helius DAS
                    heliusTotalPrice: heliusTotalPrice // Total value from Helius
                };
            });

        console.log(`[Portfolio] Filtered to ${tokens.length} fungible tokens`);

        // Add Native SOL as a token
        tokens.unshift({
            mint: SOL_MINT,
            balance: solBalance / 1e9,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
            logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            heliusPrice: 0,      // Will be fetched from Jupiter
            heliusTotalPrice: 0
        });

        // 3. Batched Price Fetching
        const mints = tokens.map(t => t.mint);
        const priceMap = new Map<string, { price: number; change24h: number }>();

        // Batch size 50 to avoid URL length issues
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < mints.length; i += BATCH_SIZE) {
            batches.push(mints.slice(i, i + BATCH_SIZE));
        }

        await Promise.all(batches.map(async (batch) => {
            try {
                const ids = batch.join(',');
                const res = await fetch(`${JUPITER_PRICE_API}?ids=${ids}&showExtraInfo=true`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        for (const [id, info] of Object.entries(data.data as any)) {
                            const price = Number(info.price) || 0;
                            let change24h = 0;
                            if (info.extraInfo?.quotedPrice?.buyPrice && info.extraInfo?.lastSwappedPrice?.lastJupiterBuyPrice) {
                                const lastPrice = Number(info.extraInfo.lastSwappedPrice.lastJupiterBuyPrice);
                                if (lastPrice > 0) change24h = ((price - lastPrice) / lastPrice) * 100;
                            }
                            priceMap.set(id, { price, change24h });
                        }
                    }
                }
            } catch (err) {
                console.error('[API Portfolio] Price batch error:', err);
            }
        }));

        console.log(`[Portfolio] Fetched prices for ${priceMap.size} tokens from Jupiter`);

        // Force SOL Fallback if Jupiter fails
        if (!priceMap.has(SOL_MINT) || priceMap.get(SOL_MINT)?.price === 0) {
            try {
                const solPriceRes = await fetch(`${JUPITER_PRICE_API}?ids=${SOL_MINT}`);
                if (solPriceRes.ok) {
                    const solData = await solPriceRes.json();
                    const p = Number(solData.data?.[SOL_MINT]?.price) || 0;
                    if (p > 0) priceMap.set(SOL_MINT, { price: p, change24h: 0 });
                }
            } catch (e) { }
        }

        // 4. Assemble Final Portfolio - Use Jupiter price, fallback to Helius DAS price
        const holdings = tokens.map(t => {
            const jupiterInfo = priceMap.get(t.mint);

            // Priority: Jupiter price > Helius DAS price > 0
            let priceUsd = jupiterInfo?.price || 0;
            if (priceUsd === 0 && t.heliusPrice > 0) {
                priceUsd = t.heliusPrice;
            }

            const priceChange24h = jupiterInfo?.change24h || 0;

            // Value: Use Helius total if Jupiter has no price, else calculate
            let valueUsd = t.balance * priceUsd;
            if (valueUsd === 0 && t.heliusTotalPrice > 0) {
                valueUsd = t.heliusTotalPrice;
            }

            // 7d Projection (conservative 0.7 momentum factor)
            const projection7d = valueUsd * (1 + (priceChange24h / 100) * 0.7);
            const projectionChange = valueUsd > 0 ? ((projection7d - valueUsd) / valueUsd) * 100 : 0;

            // Clean up internal fields
            const { heliusPrice, heliusTotalPrice, ...cleanToken } = t;

            return {
                ...cleanToken,
                priceUsd,
                valueUsd,
                priceChange24h,
                projection7d,
                projectionChange
            };
        });

        // Sort by value
        holdings.sort((a, b) => b.valueUsd - a.valueUsd);

        const totalValueUsd = holdings.reduce((sum, h) => sum + h.valueUsd, 0);
        const weightedChange = totalValueUsd > 0
            ? holdings.reduce((sum, h) => sum + (h.priceChange24h * h.valueUsd), 0) / totalValueUsd
            : 0;
        const totalProjection7d = holdings.reduce((sum, h) => sum + h.projection7d, 0);

        console.log(`[Portfolio] Final: ${holdings.length} holdings, total value: $${totalValueUsd.toFixed(2)}`);

        return NextResponse.json({
            holdings,
            totalValueUsd,
            totalChange24h: weightedChange,
            totalProjection7d,
            lastUpdated: Date.now()
        });

    } catch (error: any) {
        console.error('[API Portfolio] General error:', error);
        return NextResponse.json(
            { error: 'Failed to build portfolio', details: error.message },
            { status: 500 }
        );
    }
}
