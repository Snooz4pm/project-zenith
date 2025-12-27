import { OHLCV } from '@/lib/market-data/types'

export type VolatilityRegime =
    | 'low'
    | 'normal'
    | 'high'
    | 'extreme'

export function calculateVolatility(
    data: OHLCV[],
    period = 20
): number {
    if (data.length < period + 1) return 0

    let sum = 0
    for (let i = data.length - period; i < data.length; i++) {
        sum += Math.abs(data[i].close - data[i - 1].close)
    }

    return sum / period
}

export function classifyVolatility(
    current: number,
    history: number[]
): VolatilityRegime {
    if (!history.length) return 'normal'

    const avg =
        history.reduce((a, b) => a + b, 0) / history.length

    if (current < avg * 0.7) return 'low'
    if (current < avg * 1.2) return 'normal'
    if (current < avg * 2) return 'high'
    return 'extreme'
}
