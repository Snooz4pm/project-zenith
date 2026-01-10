/**
 * Smart Swap Brain v1 - Intelligence Engine
 *
 * READ-ONLY intelligence module.
 * No wallet, no tx, no promises.
 */

import {
    BrainInput,
    BrainOutput,
    RankedTarget,
    AlphaSignal,
    RouteSimulation,
    ALPHA_WEIGHTS,
    BRAIN_CONSTRAINTS,
    RoadmapBias,
} from '@/types/Brain';

const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'];

/**
 * Check if token is a stablecoin
 */
function isStablecoin(symbol: string): boolean {
    return STABLECOINS.includes(symbol.toUpperCase());
}

/**
 * Alpha Freshness Score (0-1)
 *
 * Detects early but survivable alpha.
 * NOT price prediction - liquidity + attention velocity.
 */
function calculateAlphaFreshness(signal?: AlphaSignal): number {
    if (!signal) return 0.3; // neutral bias if AlphaScan missing

    // 1. Pool Freshness (NOT too new, NOT too old)
    let poolFreshness = 0;
    if (signal.poolAgeHours < 2) {
        poolFreshness = 0; // Reject ultra-new rugs
    } else if (signal.poolAgeHours > 168) {
        poolFreshness = 0.2; // Too old, low freshness
    } else {
        poolFreshness = 1 - signal.poolAgeHours / 168;
    }

    // 2. Volume Acceleration
    const volumeAcceleration = Math.min(Math.max(signal.volumeChange24h / 300, 0), 1);

    // 3. Transaction Momentum
    const txMomentum = Math.min(Math.max(signal.txGrowth24h / 200, 0), 1);

    // Weighted combination
    const alphaScore =
        ALPHA_WEIGHTS.poolFreshness * poolFreshness +
        ALPHA_WEIGHTS.volumeAcceleration * volumeAcceleration +
        ALPHA_WEIGHTS.txMomentum * txMomentum;

    return alphaScore;
}

/**
 * IQ Score - Route quality + liquidity
 */
function calculateIQScore(route: RouteSimulation): number {
    if (!route.exists) return 0;

    // Penalties
    let score = 100;

    // RTL penalty (0-12% → 0-12 points penalty)
    score -= route.roundTripLoss;

    // Hop penalty (each hop beyond 1 costs 5 points)
    score -= (route.hops - 1) * 5;

    // Slippage penalty
    const totalSlippage = route.entrySlippage + route.exitSlippage;
    score -= totalSlippage;

    // Liquidity bonus
    score += route.liquidityScore * 20;

    return Math.max(0, Math.min(100, score));
}

/**
 * Determine roadmap bias based on metrics
 */
function determineRoadmapBias(
    alphaScore: number,
    iqScore: number,
    volatility: number,
    rtl: number
): RoadmapBias {
    if (alphaScore > 0.7 && rtl < 8) {
        return 'early momentum';
    } else if (iqScore > 75 && volatility < 0.5) {
        return 'stable alpha';
    } else if (alphaScore > 0.6 && volatility > 0.7) {
        return 'high risk / high attention';
    } else {
        return 'liquidity expansion';
    }
}

/**
 * MAIN BRAIN FUNCTION
 * Processes universe and returns ranked targets
 */
export function runBrain(input: BrainInput): BrainOutput {
    console.log('[Brain] Processing universe...');

    const rankedTargets: RankedTarget[] = [];
    let safeCount = 0;
    let routeableCount = 0;

    for (const token of input.tokens) {
        // Skip SOL itself
        if (token.address === input.baseToken.address) continue;

        // Get route simulation
        const route = input.routes[token.address];
        if (!route || !route.exists) continue;

        routeableCount++;

        // HARD CONSTRAINTS
        // 1. Final token cannot be stablecoin
        if (BRAIN_CONSTRAINTS.STABLECOINS_FORBIDDEN_AS_FINAL && isStablecoin(token.symbol)) {
            continue;
        }

        // 2. RTL must be ≤ max
        if (route.roundTripLoss > BRAIN_CONSTRAINTS.MAX_RTL) {
            continue;
        }

        // 3. Max hops
        if (route.hops > BRAIN_CONSTRAINTS.MAX_HOPS) {
            continue;
        }

        // Token passed constraints
        safeCount++;

        // Calculate scores
        const iqScore = calculateIQScore(route);
        const alphaSignal = input.alphaSignals?.[token.address];
        const alphaScore = calculateAlphaFreshness(alphaSignal);
        const combinedScore = iqScore * 0.6 + alphaScore * 100 * 0.4;

        // Estimate volatility (based on slippage + alpha signal)
        const volatility = Math.min(
            (route.entrySlippage + route.exitSlippage) / 40 +
                (alphaSignal ? alphaSignal.volumeChange24h / 500 : 0),
            1
        );

        // Count stable hops (simple: assume direct route if hops === 1)
        const stableHopCount = route.hops > 1 ? 1 : 0;

        // Determine classification
        const classification = route.roundTripLoss <= 10 && iqScore >= 70 ? 'A' : 'B';

        // Determine bias
        const bias = determineRoadmapBias(alphaScore, iqScore, volatility, route.roundTripLoss);

        // Build roadmap preview (simple for now)
        const roadmapSteps = [
            {
                from: 'SOL',
                to: token.symbol,
                reason: bias === 'early momentum' ? 'Alpha entry' : 'Route entry',
            },
            {
                from: token.symbol,
                to: 'SOL',
                reason: 'Exit to base',
            },
        ];

        const target: RankedTarget = {
            targetToken: {
                address: token.address,
                symbol: token.symbol,
            },
            classification,
            metrics: {
                iqScore,
                alphaScore,
                combinedScore,
                volatility,
                roundTripLoss: route.roundTripLoss,
                hops: route.hops,
                stableHopCount,
            },
            roadmapPreview: {
                steps: roadmapSteps,
                expectedBias: bias,
            },
        };

        rankedTargets.push(target);
    }

    // Sort by combined score (descending)
    rankedTargets.sort((a, b) => b.metrics.combinedScore - a.metrics.combinedScore);

    console.log(`[Brain] Processed ${input.tokens.length} tokens`);
    console.log(`[Brain] ${routeableCount} routeable, ${safeCount} safe`);
    console.log(`[Brain] Top target: ${rankedTargets[0]?.targetToken.symbol || 'none'}`);

    return {
        universeStats: {
            totalTokens: input.tokens.length,
            routeableTokens: routeableCount,
            safeTokens: safeCount,
        },
        rankedTargets,
    };
}
