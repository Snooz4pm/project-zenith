
import { ZenithToken } from '../types';
import { computeZenithScore } from './scoring';

export function normalizeToken(
    pair: any,
    jupiterToken: any | undefined
): ZenithToken | null {
    // 1. DATA EXTRACTION
    const liquidity = Number(pair.liquidity?.usd || 0);
    const volume = Number(pair.volume?.h24 || 0);
    const txs = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);

    // 2. HARD FILTERS (The Manifesto)
    // ❌ Liquidity < $50,000
    if (liquidity < 50_000) return null;

    // ❌ 24h volume < $10,000
    if (volume < 10_000) return null;

    // ❌ Tx count < 100 / 24h
    if (txs < 100) return null;

    // ❌ Not routable via Jupiter (We assume if jupiterToken is undefined, it's not strictly known/verified)
    // User said: "Token is REJECTED if ... Not routable via Jupiter"
    // We use the Jupiter "All" list as the authority.
    if (!jupiterToken) return null;


    // 3. CONSTRUCT TOKEN
    const token: ZenithToken = {
        mint: pair.baseToken.address,
        symbol: jupiterToken.symbol || pair.baseToken.symbol, // Trust Jupiter symbol first
        name: jupiterToken.name || pair.baseToken.name,
        logoURI: jupiterToken.logoURI, // DexScreener doesn't always have reliable logs

        priceUsd: Number(pair.priceUsd),
        liquidityUsd: liquidity,
        volume24hUsd: volume,
        txCount24h: txs,
        priceChange24h: Number(pair.priceChange?.h24 || 0),

        zenithScore: 0
    };

    // 4. SCORE
    token.zenithScore = computeZenithScore(token);

    return token;
}
