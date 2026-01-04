import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 21600; // 6 hours ISR cache

/**
 * GET /api/arena/solana/discovery
 * 
 * SOLANA-ONLY token discovery
 * Sources: Raydium + Orca
 * Cache: 6 hours
 * Returns: ALL tokens (no filtering)
 */
export async function GET() {
    try {
        const tokens: any[] = [];

        // 1. Raydium
        try {
            const res = await fetch('https://api.raydium.io/v2/sdk/liquidity/mainnet.json', {
                next: { revalidate: 21600 }
            });

            if (res.ok) {
                const json = await res.json();
                const raydiumTokens = Object.values(json.official ?? {}).map((p: any) => ({
                    chain: 'solana',
                    chainType: 'SOLANA',
                    address: p.baseMint,
                    symbol: p.baseSymbol || 'UNKNOWN',
                    name: p.baseSymbol || 'Unknown Token',
                    decimals: p.baseDecimals ?? 9, // Kept from original as it's a critical field
                    logoURI: p.baseIcon,
                    liquidityUsd: parseFloat(p.lpUsd ?? '0'),
                    volume24hUsd: parseFloat(p.volume24h ?? '0'),
                    source: 'RAYDIUM',
                }));

                tokens.push(...raydiumTokens);
            }
        } catch (err) {
            console.error('[Solana/Raydium] Failed to fetch:', err);
        }

        // 2. Orca
        try {
            const res = await fetch('https://api.mainnet.orca.so/v1/whirlpool/list', {
                next: { revalidate: 21600 }
            });

            if (res.ok) {
                const json = await res.json();
                const orcaTokens = (json.whirlpools ?? []).map((p: any) => ({
                    chain: 'solana',
                    chainType: 'SOLANA',
                    address: p.tokenA.mint,
                    symbol: p.tokenA.symbol || 'UNKNOWN',
                    name: p.tokenA.name || 'Unknown Token',
                    decimals: p.tokenA?.decimals ?? 9, // Kept from original as it's a critical field
                    logoURI: undefined,
                    liquidityUsd: parseFloat(p.tvl ?? '0'),
                    volume24hUsd: parseFloat(p.volume.day ?? '0'),
                    source: 'ORCA',
                }));

                tokens.push(...orcaTokens);
            }
        } catch (err) {
            console.error('[Solana/Orca] Failed to fetch:', err);
        }

        // Deduplicate + sort
        const seen = new Set<string>();
        const deduped = tokens.filter(t => {
            if (!t.address || seen.has(t.address)) return false; // Added !t.address check for robustness
            seen.add(t.address);
            return true;
        });

        const sorted = deduped.sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0));

        console.log(`[Solana Discovery] Total: ${sorted.length} unique tokens`); // Kept original log

        return NextResponse.json({
            meta: {
                total: sorted.length,
                chains: ['solana'],
                timestamp: Date.now(),
                cached: true,
            },
            tokens: sorted,
        });
    } catch (error) {
        console.error('[SOLANA DISCOVERY ERROR]', error);
        // CRITICAL: Return 200 with empty tokens instead of 500
        // Discovery failures should NOT block UI rendering
        return NextResponse.json({
            meta: {
                total: 0,
                chains: ['solana'],
                timestamp: Date.now(),
                cached: false,
                error: 'Discovery failed',
            },
            tokens: [],
        }, { status: 200 });
    }
}
