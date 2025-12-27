import { MarketTick } from '../types'

export async function fetchForex(pair: string): Promise<MarketTick> {
    const key = process.env.ALPHA_VANTAGE_KEY
    if (!key) throw new Error('ALPHA_VANTAGE_KEY not set')

    // Format check: EUR/USD -> from=EUR, to=USD
    // Some configs might pass EURUSD without slash
    let from = '', to = ''
    if (pair.includes('/')) {
        [from, to] = pair.split('/')
    } else if (pair.length === 6) {
        from = pair.slice(0, 3)
        to = pair.slice(3)
    } else {
        throw new Error(`Invalid forex pair format: ${pair}`)
    }

    // Use CURRENCY_EXCHANGE_RATE
    const url =
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${key}`

    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()

    if (json['Note'] || json['Information']) {
        throw new Error(`Alpha Vantage Limit/Info: ${JSON.stringify(json)}`)
    }

    const rate = json['Realtime Currency Exchange Rate']

    if (!rate) throw new Error(`Alpha Vantage FX failed for ${pair}`)

    const price = Number(rate['5. Exchange Rate'])

    return {
        symbol: `${from}${to}`,
        assetType: 'forex',
        price,
        change: 0, // FX realtime doesn't always give change
        changePercent: 0,
        timestamp: Date.now(),
        source: 'alphavantage',
    }
}
