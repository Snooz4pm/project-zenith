import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache for market data
const marketCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export async function GET() {
    try {
        // Check cache first
        const cached = marketCache.get('markets');
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('[Terminal] Returning cached markets');
            return NextResponse.json(cached.data);
        }

        console.log('[Terminal] Fetching fresh market data...');

        // Fetch top Solana pairs from DexScreener
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
        const data = await response.json();

        if (!data.pairs || data.pairs.length === 0) {
            throw new Error('No market data available');
        }

        // Filter and format top pairs
        const markets = data.pairs
            .filter((pair: any) =>
                pair.liquidity?.usd > 1000000 && // Min $1M liquidity
                pair.volume?.h24 > 100000 && // Min $100k 24h volume
                pair.chainId === 'solana'
            )
            .slice(0, 9) // Top 9 pairs
            .map((pair: any) => ({
                pair: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
                price: parseFloat(pair.priceUsd) || 0,
                change24h: parseFloat(pair.priceChange?.h24) || 0,
                volume24h: parseFloat(pair.volume?.h24) || 0,
                liquidity: parseFloat(pair.liquidity?.usd) || 0,
                fdv: parseFloat(pair.fdv) || 0,
                dexId: pair.dexId || 'raydium',
                pairAddress: pair.pairAddress,
            }));

        const result = {
            markets,
            timestamp: Date.now(),
        };

        // Cache the result
        marketCache.set('markets', { data: result, timestamp: Date.now() });

        console.log(`[Terminal] Fetched ${markets.length} markets`);
        return NextResponse.json(result);

    } catch (err: any) {
        console.error('[Terminal] Error fetching markets:', err);
        return NextResponse.json({
            error: 'Failed to fetch market data',
            markets: []
        }, { status: 500 });
    }
}
