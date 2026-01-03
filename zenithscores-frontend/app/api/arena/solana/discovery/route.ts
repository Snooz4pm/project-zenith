export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const REGISTRY_URL = 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json';
const RAYDIUM_AMM = 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';
const RAYDIUM_CLMM = 'https://api.raydium.io/v2/sdk/clmm/mainnet.json';

/**
 * Solana Token Discovery
 * 
 * Authoritative sources:
 * - Solana Token Registry (Base list)
 * - Raydium Pools (Liquidity Truth)
 * 
 * This ensures Zenith "finds" tokens that are actually tradable.
 */
export async function GET() {
    try {
        const [registryRes, ammRes, clmmRes] = await Promise.all([
            fetch(REGISTRY_URL).catch(() => null),
            fetch(RAYDIUM_AMM).catch(() => null),
            fetch(RAYDIUM_CLMM).catch(() => null),
        ]);

        if (!registryRes) throw new Error('Failed to fetch Solana Registry');

        const registryJson = await registryRes.json();
        const ammJson = ammRes ? await ammRes.json() : {};
        const clmmJson = clmmRes ? await clmmRes.json() : {};

        const registryTokens = registryJson.tokens || [];

        // Extract mints with pools on Raydium
        const raydiumMints = new Set<string>();

        const extract = (pools: any) => {
            if (!pools) return;
            const list = Array.isArray(pools) ? pools : Object.values(pools);
            list.forEach((p: any) => {
                if (p.baseMint) raydiumMints.add(p.baseMint);
                if (p.quoteMint) raydiumMints.add(p.quoteMint);
            });
        };

        extract(ammJson.official);
        extract(ammJson.unOfficial);
        extract(clmmJson.official);
        extract(clmmJson.unOfficial);

        const tokens = registryTokens
            .filter((t: any) => t.chainId === 101 && raydiumMints.has(t.address))
            .map((t: any) => ({
                chainType: 'SOLANA',
                chainId: 'solana',
                address: t.address,
                symbol: t.symbol,
                name: t.name,
                decimals: t.decimals,
                logo: t.logoURI,
                source: 'RAYDIUM',
            }));

        return NextResponse.json({
            success: true,
            tokens,
            count: tokens.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[API Solana Discovery] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Solana discovery failed', tokens: [] },
            { status: 500 }
        );
    }
}
