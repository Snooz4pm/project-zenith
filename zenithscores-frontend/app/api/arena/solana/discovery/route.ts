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
                name: p.baseName || p.baseSymbol || 'Unknown Token',
                decimals: p.baseDecimals ?? 9,
                logoURI: null,
                liquidityUsd: Number(p.liquidity ?? 0),
                volume24hUsd: Number(p.volume24h ?? 0),
                source: 'RAYDIUM'
            }));
            tokens.push(...raydiumTokens);
            console.log(`[Solana Discovery] Raydium: ${raydiumTokens.length}`);
        }
    } catch (err) {
        console.error('[Solana Discovery] Raydium failed:', err);
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
                address: p.tokenA?.mint || p.address,
                symbol: p.tokenA?.symbol || 'UNKNOWN',
                name: p.tokenA?.name || p.tokenA?.symbol || 'Unknown Token',
                decimals: p.tokenA?.decimals ?? 9,
                logoURI: p.tokenA?.logoURI ?? null,
                liquidityUsd: Number(p.tvl ?? 0),
                volume24hUsd: Number(p.volume?.day ?? 0),
                source: 'ORCA'
            }));
            tokens.push(...orcaTokens);
            console.log(`[Solana Discovery] Orca: ${orcaTokens.length}`);
        }
    } catch (err) {
        console.error('[Solana Discovery] Orca failed:', err);
    }

    // Dedupe by address
    const seen = new Set<string>();
    const unique = tokens.filter(t => {
        if (!t.address || seen.has(t.address)) return false;
        seen.add(t.address);
        return true;
    });

    // Sort by liquidity
    unique.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    console.log(`[Solana Discovery] Total: ${unique.length} unique tokens`);

    return NextResponse.json({
        success: true,
        tokens: unique,
        count: unique.length,
        engine: 'solana',
        cached: true
    });
}
