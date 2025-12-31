import { MarketTick } from '../types'
import { computeTimeBased24hChange } from '@/lib/market-data/change-calculator'

export async function fetchForex(pair: string): Promise<MarketTick> {
    const key =
        process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_KEY
    if (!key) throw new Error('ALPHA_VANTAGE_API_KEY not set')

    // Parse pair
    let from = '', to = ''
    if (pair.includes('/')) {
        ;[from, to] = pair.split('/')
    } else if (pair.length === 6) {
        from = pair.slice(0, 3)
        to = pair.slice(3)
    } else {
        throw new Error(`Invalid forex pair format: ${pair}`)
    }

    const url =
        `https://www.alphavantage.co/query?function=FX_INTRADAY` +
        `&from_symbol=${from}&to_symbol=${to}&interval=60min&apikey=${key}`

    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()

    if (json['Note'] || json['Information']) {
        throw new Error(`Alpha Vantage FX limit/info for ${pair}`)
    }

    const seriesData = json['Time Series FX (60min)']
    if (!seriesData) {
        throw new Error(`Alpha Vantage FX Series missing for ${pair}`)
    }

    // Build + SORT series ONCE (newest → oldest)
    const series = Object.entries(seriesData)
        .map(([t, v]) => ({
            time: Math.floor(new Date(t).getTime() / 1000),
            price: Number((v as any)['4. close'])
        }))
        .sort((a, b) => b.time - a.time)

    if (series.length < 25) {
        throw new Error(`Not enough FX data to compute 24h change for ${pair}`)
    }

    const current = series[0]

    // ☢️ Nuclear rule: time-based 24h change
    const { change24h, status } = computeTimeBased24hChange(series)

    // Absolute price change (real, not fake)
    const ref = series.find(
        p => current.time - p.time >= 23 * 60 * 60
    )

    if (!ref) {
        throw new Error(`No 24h reference candle for ${pair}`)
    }

    const absoluteChange = current.price - ref.price

    return {
        symbol: `${from}/${to}`,
        assetType: 'forex',
        price: current.price,
        change: absoluteChange,
        changePercent: change24h,
        timestamp: Date.now(),
        source: 'alphavantage',
        status,
        verificationStatus: status === 'LIVE' ? 'verified' : 'unverified'
    }
}
