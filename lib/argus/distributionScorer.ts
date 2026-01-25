/**
 * Argus Distribution Quality Scorer - Phase 5.4
 * Single 0-100 cognitive anchor for distribution health
 */

export interface DistributionQuality {
    score: number; // 0-100
    grade: 'HEALTHY' | 'MODERATE_RISK' | 'HIGHLY_CENTRALIZED';
    contributors: {
        topHolderImpact: number;
        top10Impact: number;
        lpControlImpact: number;
        temporalImpact: number;
    };
}

export function calculateDistributionQuality(
    top1Pct: number,
    top10Pct: number,
    lpRiskScore: number = 0,
    concentrationDelta24h: number = 0
): DistributionQuality {
    let score = 100; // Start perfect
    const contributors = {
        topHolderImpact: 0,
        top10Impact: 0,
        lpControlImpact: 0,
        temporalImpact: 0
    };

    // 1. Top Holder Impact (40% weight)
    if (top1Pct > 50) {
        contributors.topHolderImpact = -40;
    } else if (top1Pct > 30) {
        contributors.topHolderImpact = -30;
    } else if (top1Pct > 20) {
        contributors.topHolderImpact = -20;
    } else if (top1Pct > 10) {
        contributors.topHolderImpact = -10;
    } else if (top1Pct < 5) {
        contributors.topHolderImpact = +5; // Bonus for very distributed
    }

    // 2. Top 10 Concentration (30% weight)
    if (top10Pct > 80) {
        contributors.top10Impact = -30;
    } else if (top10Pct > 60) {
        contributors.top10Impact = -20;
    } else if (top10Pct > 40) {
        contributors.top10Impact = -10;
    } else if (top10Pct < 25) {
        contributors.top10Impact = +5; // Bonus for healthy spread
    }

    // 3. LP Control Impact (20% weight)
    // lpRiskScore ranges from -30 (deployer controlled) to +20 (burned)
    contributors.lpControlImpact = lpRiskScore * 0.67; // Scale to ~20% weight

    // 4. Temporal Impact (10% weight)
    // Concentration delta: negative = improving, positive = worsening
    if (concentrationDelta24h > 10) {
        contributors.temporalImpact = -10; // Rapid consolidation
    } else if (concentrationDelta24h > 5) {
        contributors.temporalImpact = -5;
    } else if (concentrationDelta24h < -5) {
        contributors.temporalImpact = +5; // Improving distribution
    }

    // 5. Aggregate Score
    score += contributors.topHolderImpact;
    score += contributors.top10Impact;
    score += contributors.lpControlImpact;
    score += contributors.temporalImpact;

    // 6. Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    // 7. Determine Grade
    let grade: DistributionQuality['grade'] = 'HEALTHY';
    if (score < 50) grade = 'HIGHLY_CENTRALIZED';
    else if (score < 80) grade = 'MODERATE_RISK';

    return {
        score,
        grade,
        contributors
    };
}
