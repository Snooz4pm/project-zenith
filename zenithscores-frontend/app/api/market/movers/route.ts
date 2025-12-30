import { NextResponse } from 'next/server';
import { getTrendingTokens } from '@/lib/dexscreener';

export const dynamic = 'force-dynamic';

/**
 * Market Movers - Now shows trending CRYPTO tokens (swappable for revenue)
 *
 * Revenue Model: Users click → swap → 0x affiliate fees
 * Chains: Base, Arbitrum, Ethereum (all fee-generating)
 */
export async function GET() {
    try {
        // Fetch trending tokens from multiple chains
        const baseTokens = await getTrendingTokens('base');
        const arbTokens = await getTrendingTokens('arbitrum');
        const ethTokens = await getTrendingTokens('ethereum');

        // Combine and sort by 24h volume
        const allTokens = [...baseTokens, ...arbTokens, ...ethTokens];

        const movers = allTokens
            .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
            .slice(0, 8) // Top 8 movers
            .map(token => ({
                symbol: token.symbol,
                name: token.name,
                price: token.priceUsd,
                change: token.priceChange24h, // Absolute change
                changePercent: token.priceChange24h, // Percent change
                chain: token.chainName, // Add chain for display
                address: token.address, // For swap routing
            }));

        return NextResponse.json({ movers });
    } catch (error) {
        console.error('Market movers error:', error);

        // Fallback: Return empty but don't crash
        return NextResponse.json({ movers: [] });
    }
}
