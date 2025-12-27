export interface MarketSnapshot {
    symbol: string
    assetType: string
    price: number
    changePercent: number
    volatility: number
    volume?: number
    trend: 'up' | 'down' | 'flat'
    distanceFromEMA20: number
    distanceFromEMA50: number
    session: 'asia' | 'eu' | 'us'
}

export function getMarketSession(): 'asia' | 'eu' | 'us' {
    const hour = new Date().getUTCHours()
    if (hour >= 0 && hour < 8) return 'asia'
    if (hour >= 8 && hour < 14) return 'eu'
    return 'us'
}

export function buildSnapshot(
    price: number,
    ema20: number,
    ema50: number,
    volume?: number,
    symbol: string = 'UNKNOWN',
    assetType: string = 'unknown'
): MarketSnapshot {
    return {
        symbol,
        assetType,
        price,
        changePercent: ema20 ? ((price - ema20) / ema20) * 100 : 0, // Approx
        volatility: Math.abs(price - ema20),
        volume,
        trend:
            price > ema20 && price > ema50
                ? 'up'
                : price < ema20 && price < ema50
                    ? 'down'
                    : 'flat',
        distanceFromEMA20: ema20 ? (price - ema20) / ema20 : 0,
        distanceFromEMA50: ema50 ? (price - ema50) / ema50 : 0,
        session: getMarketSession(),
    }
}
