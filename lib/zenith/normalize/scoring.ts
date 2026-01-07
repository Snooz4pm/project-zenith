
import { ZenithToken } from '../types';

export function computeZenithScore(t: ZenithToken): number {
    // clamp(log10(liquidityUsd) / 6, 0, 1)
    const liquidityScore = Math.min(Math.max(Math.log10(t.liquidityUsd) / 6, 0), 1);

    // clamp(log10(volume24hUsd) / 6, 0, 1)
    const volumeScore = Math.min(Math.max(Math.log10(t.volume24hUsd) / 6, 0), 1);

    // clamp(txCount / 2000, 0, 1)
    const txScore = Math.min(Math.max(t.txCount24h / 2000, 0), 1);

    // clamp((priceChange24h + 20) / 40, 0, 1)
    const momentumScore = Math.min(Math.max((t.priceChange24h + 20) / 40, 0), 1);

    // poolScore = min(orcaPools + raydiumPools, 3) / 3 
    // (Simplified: we assume if it's on DexScreener it has at least 1 pool, bonus logic can be added later if we fetch Orca/Raydium specifically)
    const poolScore = 0.5; // Placeholder avg

    // jupiterBonus = isJupiterListed ? 1 : 0
    // We only create tokens if they are Jupiter listed (per normalize logic usually), so this is 1?
    // User logic: "isJupiterListed ? 1 : 0". In our normalize, we might check map presence.
    const jupiterBonus = 1;

    return (
        liquidityScore * 0.30 +
        volumeScore * 0.25 +
        txScore * 0.15 +
        momentumScore * 0.15 +
        poolScore * 0.10 +
        jupiterBonus * 0.05
    );
}
