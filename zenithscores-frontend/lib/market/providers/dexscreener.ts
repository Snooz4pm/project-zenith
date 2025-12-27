import { MarketTick } from '../types'

export async function fetchCrypto(symbol: string): Promise<MarketTick> {
    // Use a proper search or pair endpoint. The prompt suggested search?q=symbol
    const res = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
        { cache: 'no-store' }
    )

    if (!res.ok) throw new Error('DexScreener failed')

    const json = await res.json()
    const pair = json.pairs?.[0]
    if (!pair) throw new Error('No pair found')

    return {
        symbol: symbol.toUpperCase(),
        assetType: 'crypto',
        price: Number(pair.priceUsd),
        change: Number(pair.priceChange.h24),
        changePercent: Number(pair.priceChange.h24),
        volume: Number(pair.volume?.h24),
        high24h: Number(pair.highPrice || 0), // Fallback if missing
        low24h: Number(pair.lowPrice || 0),
        timestamp: Date.now(),
        source: 'dexscreener',
    }
}
