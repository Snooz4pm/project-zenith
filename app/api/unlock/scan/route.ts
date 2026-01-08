import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Self-contained connection logic
const API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const RPC_URL = API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

// Use 'processed' for faster scanning (vs 'confirmed')
const connection = new Connection(RPC_URL, 'processed');

// Simple in-memory cache to prevent rapid re-scans
const scanCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');
        if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });

        // Check cache first
        const cached = scanCache.get(address);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('[Unlock Scan] Returning cached result for', address);
            return NextResponse.json(cached.data);
        }

        const owner = new PublicKey(address);

        console.log('[Unlock Scan] Fetching token accounts for', address);
        const startTime = Date.now();

        // 1. Fetch token accounts with optimized encoding
        const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
            programId: TOKEN_PROGRAM_ID,
        }, 'processed'); // Use processed commitment for speed

        const reclaimable = [];
        const tokensWithBalance = [];

        // First pass: collect reclaimable and tokens with balance
        for (const acc of accounts.value) {
            const info = acc.account.data.parsed.info;
            const amount = info.tokenAmount.uiAmount;
            const lamports = acc.account.lamports;

            // Empty token account → reclaim rent
            if (amount === 0 && lamports > 0) {
                reclaimable.push({
                    pubkey: acc.pubkey.toBase58(),
                    mint: info.mint,
                    rentSol: lamports / 1e9,
                });
            }

            // Collect all tokens with balance for price lookup
            if (amount > 0) {
                tokensWithBalance.push({
                    pubkey: acc.pubkey.toBase58(),
                    mint: info.mint,
                    amount,
                    decimals: info.tokenAmount.decimals,
                    rawAmount: info.tokenAmount.amount, // raw amount before decimal adjustment
                });
            }
        }

        // Fetch prices from Jupiter for tokens with balance
        const dust = [];
        if (tokensWithBalance.length > 0) {
            try {
                const mints = tokensWithBalance.map(t => t.mint).join(',');
                const priceResponse = await fetch(`https://price.jup.ag/v4/price?ids=${mints}`);
                const priceData = await priceResponse.json();

                // Calculate USD values and identify dust
                for (const token of tokensWithBalance) {
                    const priceInfo = priceData.data?.[token.mint];
                    if (priceInfo?.price) {
                        const usdValue = token.amount * priceInfo.price;

                        // Dust threshold: < $0.01 USD
                        if (usdValue < 0.01 && usdValue > 0) {
                            dust.push({
                                pubkey: token.pubkey,
                                mint: token.mint,
                                amount: token.amount,
                                decimals: token.decimals,
                                rawAmount: token.rawAmount,
                                usdValue,
                                swappable: true,
                            });
                        }
                    } else {
                        // No price found - include if amount is very small
                        if (token.amount < 0.0001) {
                            dust.push({
                                pubkey: token.pubkey,
                                mint: token.mint,
                                amount: token.amount,
                                decimals: token.decimals,
                                rawAmount: token.rawAmount,
                                usdValue: 0,
                                swappable: false, // Can't swap if no price
                            });
                        }
                    }
                }
            } catch (priceErr) {
                console.warn('[Unlock Scan] Price fetch failed:', priceErr);
                // Fallback to amount-based dust detection
                for (const token of tokensWithBalance) {
                    if (token.amount < 0.0001) {
                        dust.push({
                            pubkey: token.pubkey,
                            mint: token.mint,
                            amount: token.amount,
                            decimals: token.decimals,
                            rawAmount: token.rawAmount,
                            usdValue: 0,
                            swappable: false,
                        });
                    }
                }
            }
        }

        const scanTime = Date.now() - startTime;
        const totalDustUsd = dust.reduce((sum, d) => sum + d.usdValue, 0);
        const swappableDust = dust.filter(d => d.swappable).length;
        console.log(`[Unlock Scan] Completed in ${scanTime}ms - Found ${reclaimable.length} reclaimable, ${dust.length} dust ($${totalDustUsd.toFixed(4)} USD, ${swappableDust} swappable)`);

        const result = {
            reclaimable,
            dust,
            totalSol: reclaimable.reduce((s, r) => s + r.rentSol, 0),
        };

        // Cache the result
        scanCache.set(address, { data: result, timestamp: Date.now() });

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('[Unlock Scan] Error:', err);
        return NextResponse.json({ error: 'Failed to scan wallet' }, { status: 500 });
    }
}
