import { MarketTick } from '../types'

export async function fetchStock(symbol: string): Promise<MarketTick> {
    const key = process.env.ALPHA_VANTAGE_KEY
    if (!key) throw new Error('ALPHA_VANTAGE_KEY not set')

    const url =
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`

    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()

    if (json['Note'] || json['Information']) {
        throw new Error(`Alpha Vantage Limit/Info: ${JSON.stringify(json)}`)
    }

    const q = json['Global Quote']

    if (!q || Object.keys(q).length === 0) throw new Error(`Alpha Vantage stock failed for ${symbol}`)

    const price = Number(q['05. price'])
    const prev = Number(q['08. previous close'])
    const change = price - prev

    return {
        symbol: symbol.toUpperCase(),
        assetType: 'stock',
        price,
        change,
        changePercent: (change / prev) * 100,
        timestamp: Date.now(),
        source: 'alphavantage',
    }
}
