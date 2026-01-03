export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const UNISWAP_LIST_URL = 'https://tokens.uniswap.org';

/**
 * EVM Token Discovery
 * 
 * Uses Uniswap canonical lists across multiple chains.
 */
export async function GET() {
    try {
        const res = await fetch(UNISWAP_LIST_URL);
        if (!res.ok) throw new Error('Failed to fetch Uniswap list');

        const json = await res.json();

        const supportedChains = new Set([1, 56, 8453, 42161]);

        const tokens = json.tokens
            .filter((t: any) => supportedChains.has(t.chainId))
            .map((t: any) => ({
                chainType: 'EVM',
                chainId: t.chainId.toString(),
                address: t.address,
                symbol: t.symbol,
                name: t.name,
                decimals: t.decimals,
                logo: t.logoURI,
                source: 'UNISWAP',
            }));

        return NextResponse.json({
            success: true,
            tokens,
            count: tokens.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[API EVM Discovery] Error:', error);
        return NextResponse.json(
            { success: false, error: 'EVM discovery failed', tokens: [] },
            { status: 500 }
        );
    }
}
