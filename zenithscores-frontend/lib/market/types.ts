export type AssetType = 'crypto' | 'stock' | 'forex'

export interface MarketTick {
    symbol: string            // BTCUSDT, AAPL, EURUSD
    assetType: AssetType
    price: number
    change: number            // absolute
    changePercent: number
    volume?: number
    high24h?: number
    low24h?: number
    timestamp: number         // ms
    source: 'dexscreener' | 'alphavantage' | 'replay'
    status?: 'LIVE' | 'CLOSED' | 'STALE'
    verificationStatus?: 'verified' | 'discrepancy' | 'unverified'
}
