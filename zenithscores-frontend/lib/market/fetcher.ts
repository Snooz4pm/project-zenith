import { fetchCrypto } from './providers/dexscreener'
import { fetchStock } from './providers/alphavantageStock'
import { fetchForex } from './providers/alphavantageForex'
import { MarketTick, AssetType } from './types'

export async function fetchMarket(
    symbol: string,
    assetType: AssetType
): Promise<MarketTick | null> {
    try {
        switch (assetType) {
            case 'crypto':
                return await fetchCrypto(symbol)
            case 'stock':
                return await fetchStock(symbol)
            case 'forex':
                return await fetchForex(symbol)
            default:
                throw new Error(`Unknown asset type: ${assetType}`)
        }
    } catch (err) {
        console.error('[FETCH ERROR]', symbol, err)
        return null // NEVER throw to UI
    }
}
