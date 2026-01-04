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
    console.log('[Solana Discovery] START');

    try {
        const tokens: any[] = [];

        // 1. Raydium
        console.log('[Solana Discovery] Fetching Raydium...');
        try {
            const res = await fetch('https://api.raydium.io/v2/sdk/liquidity/mainnet.json', {
                next: { revalidate: 21600 },
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            console.log('[Solana/Raydium] Response status:', res.status);

            if (res.ok) {
                const json = await res.json();
                console.log('[Solana/Raydium] Raw data keys:', Object.keys(json).join(', '));

                const raydiumTokens = Object.values(json.official ?? {}).map((p: any) => ({
                    chain: 'solana',
                    chainType: 'SOLANA',
                    chainId: '101', // Solana mainnet
                    address: p.baseMint,
                    symbol: p.baseSymbol || 'UNKNOWN',
                    name: p.baseSymbol || 'Unknown Token',
                    decimals: p.baseDecimals ?? 9,
                    logoURI: p.baseIcon,
                    liquidityUsd: parseFloat(p.lpUsd ?? '0') || 0,
                    volume24hUsd: parseFloat(p.volume24h ?? '0') || 0,
                    source: 'RAYDIUM',
                }));

                console.log('[Solana/Raydium] Processed tokens:', raydiumTokens.length);
                tokens.push(...raydiumTokens);
            }
        } catch (err) {
            console.error('[Solana/Raydium] Failed to fetch:', err);
            // Continue anyway - partial data is OK
        }

        // 2. Orca
        console.log('[Solana Discovery] Fetching Orca...');
        try {
            const res = await fetch('https://api.mainnet.orca.so/v1/whirlpool/list', {
                next: { revalidate: 21600 },
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            console.log('[Solana/Orca] Response status:', res.status);

            if (res.ok) {
                const json = await res.json();
                console.log('[Solana/Orca] Raw data keys:', Object.keys(json).join(', '));

                const orcaTokens = (json.whirlpools ?? []).map((p: any) => ({
                    chain: 'solana',
                    chainType: 'SOLANA',
                    chainId: '101', // Solana mainnet
                    address: p.tokenA?.mint || p.address,
                    symbol: p.tokenA?.symbol || 'UNKNOWN',
                    name: p.tokenA?.name || 'Unknown Token',
                    decimals: p.tokenA?.decimals ?? 9,
                    logoURI: p.tokenA?.logoURI ?? undefined,
                    liquidityUsd: parseFloat(p.tvl ?? '0') || 0,
                    volume24hUsd: parseFloat(p.volume?.day ?? '0') || 0,
                    source: 'ORCA',
                }));

                console.log('[Solana/Orca] Processed tokens:', orcaTokens.length);
                tokens.push(...orcaTokens);
            }
        } catch (err) {
            console.error('[Solana/Orca] Failed to fetch:', err);
            // Continue anyway - partial data is OK
        }

        console.log('[Solana Discovery] Total before dedup:', tokens.length);

        // Deduplicate + sort
        const seen = new Set<string>();
        const deduped = tokens.filter(t => {
            if (!t.address || seen.has(t.address)) return false;
            seen.add(t.address);
            return true;
        });

        const sorted = deduped.sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0));

        console.log('[Solana Discovery] Final count:', sorted.length);
        console.log('[Solana Discovery] SUCCESS');

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
                error: String(error),
            },
            tokens: [],
        }, { status: 200 });
    }
}
