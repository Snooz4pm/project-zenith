import { MarketTick } from '../types'

export async function fetchCrypto(symbol: string): Promise<MarketTick> {
    // Use a proper search or pair endpoint. The prompt suggested search?q=symbol
    const res = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
        { cache: 'no-store' }
    )

    if (!res.ok) throw new Error('DexScreener failed')

    const json = await res.json()
    const pairs = json.pairs || []

    if (pairs.length === 0) throw new Error('No pair found')

    // Filter for USD pairs and sort by volume
    const validPairs = pairs.filter((p: any) =>
        ['USDT', 'USDC', 'USD', 'DAI'].includes(p.quoteToken.symbol.toUpperCase())
    )

    // Sort by: 1. Has Change Data, 2. Volume
    const sortedPairs = (validPairs.length > 0 ? validPairs : pairs).sort((a: any, b: any) => {
        // Prioritize pairs that actually have 24h change data
        const changeA = Math.abs(a.priceChange?.h24 || 0)
        const changeB = Math.abs(b.priceChange?.h24 || 0)
        const hasChangeA = changeA > 0 ? 1 : 0
        const hasChangeB = changeB > 0 ? 1 : 0

        if (hasChangeA !== hasChangeB) return hasChangeB - hasChangeA

        // Then by volume
        const volA = a.volume?.h24 || 0
        const volB = b.volume?.h24 || 0
        return volB - volA
    })

    const pair = sortedPairs[0]

    return {
        symbol: symbol.toUpperCase(),
        assetType: 'crypto',
        price: Number(pair.priceUsd),
        change: Number(pair.priceChange?.h24 || 0),
        changePercent: Number(pair.priceChange?.h24 || 0),
        volume: Number(pair.volume?.h24 || 0),
        high24h: Number(pair.highPrice || 0), // Fallback if missing
        low24h: Number(pair.lowPrice || 0),
        timestamp: Date.now(),
        source: 'dexscreener',
    }
}
