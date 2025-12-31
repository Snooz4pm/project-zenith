import { MarketTick } from '../types'
import { compute24hChange } from '@/lib/market-data/change-calculator'

export async function fetchForex(pair: string): Promise<MarketTick> {
    const key = process.env.ALPHA_VANTAGE_KEY
    if (!key) throw new Error('ALPHA_VANTAGE_KEY not set')

    // Format check: EUR/USD -> from=EUR, to=USD
    let from = '', to = ''
    if (pair.includes('/')) {
        [from, to] = pair.split('/')
    } else if (pair.length === 6) {
        from = pair.slice(0, 3)
        to = pair.slice(3)
    } else {
        throw new Error(`Invalid forex pair format: ${pair}`)
    }

    // Use FX_DAILY for correct previous close
    const url =
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&apikey=${key}`

    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()

    if (json['Note'] || json['Information']) {
        // Fallback for demo keys or limits: try realtime just for price
        // But throwing is safer for now to avoid fake 0.00%
        console.warn(`Alpha Vantage Limit/Info`, json)
        throw new Error(`Alpha Vantage FX limit hit for ${pair}`)
    }

    const series = json['Time Series FX (Daily)']
    if (!series) throw new Error(`Alpha Vantage FX Series missing for ${pair}`)

    // Sort dates descending (newest first)
    // Keys are "YYYY-MM-DD"
    const dates = Object.keys(series).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    )

    if (dates.length < 2) throw new Error(`Insufficient FX history for ${pair}`)

    const todayStr = dates[0]
    const yesterdayStr = dates[1]

    const current = Number(series[todayStr]['4. close'])
    const prevClose = Number(series[yesterdayStr]['4. close'])

    // Debug mapping (Temporary)
    console.log({
        symbol: pair,
        current,
        prevClose,
        diff: current - prevClose
    })

    const changePercent = compute24hChange(current, prevClose)
    const change = current - prevClose

    return {
        symbol: `${from}/${to}`, // Normalize to slash format
        assetType: 'forex',
        price: current,
        change,
        changePercent,
        timestamp: Date.now(),
        source: 'alphavantage',
    }
}
