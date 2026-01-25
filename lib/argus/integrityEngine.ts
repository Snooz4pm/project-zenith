import { calculateDistributionQuality, DistributionQuality } from './distributionScorer';

export type IntegrityReport = {
    contractRisk: "LOW" | "MEDIUM" | "HIGH";
    holderRisk: "LOW" | "MEDIUM" | "HIGH";
    flags: string[];
    top1Pct: number;
    top10Pct: number;
    score: number;
    distributionQuality?: DistributionQuality;
};

export function analyzeTokenIntegrity(
    mintInfo: {
        mintAuthority: string | null;
        freezeAuthority: string | null;
        supply: number;
        decimals: number;
    },
    holders?: { amount: number }[]
): IntegrityReport {
    const flags: string[] = [];
    let riskScore = 0;

    // 1. Contract Configuration Checks
    if (mintInfo.mintAuthority) {
        flags.push("Mint authority enabled (supply can inflate)");
        riskScore += 3;
    }
    if (mintInfo.freezeAuthority) {
        flags.push("Freeze authority enabled (wallets can be frozen)");
        riskScore += 2;
    }
    if (mintInfo.decimals > 12) {
        flags.push("Unusual decimals configuration");
        riskScore += 1;
    }
    if (mintInfo.supply <= 0) {
        flags.push("Zero or invalid supply");
        riskScore += 3;
    }

    // 2. Supply Distribution Analysis (v2)
    let holderRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let finalTop1Pct = 0;
    let finalTop10Pct = 0;

    if (holders && holders.length > 0 && mintInfo.supply > 0) {
        const top1Amount = holders[0].amount;
        finalTop1Pct = (top1Amount / mintInfo.supply) * 100;

        if (finalTop1Pct > 20) {
            flags.push(`⚠️ Top Holder owns ${finalTop1Pct.toFixed(1)}% (Dev/Cabal Warning)`);
            holderRisk = "HIGH";
            riskScore += 3;
        } else if (finalTop1Pct > 10) {
            flags.push(`⚠️ Top Holder owns ${finalTop1Pct.toFixed(1)}%`);
            holderRisk = "MEDIUM";
            riskScore += 1;
        }

        const top10Sum = holders.slice(0, 10).reduce((sum, h) => sum + h.amount, 0);
        finalTop10Pct = (top10Sum / mintInfo.supply) * 100;

        if (finalTop10Pct > 50) {
            flags.push(`⚠️ Top 10 own ${finalTop10Pct.toFixed(1)}% (Concentrated)`);
            if (holderRisk !== "HIGH") holderRisk = "MEDIUM";
            riskScore += 2;
        }
    }

    let contractRisk: IntegrityReport["contractRisk"] = "LOW";
    if (riskScore >= 4) contractRisk = "HIGH";
    else if (riskScore >= 2) contractRisk = "MEDIUM";

    const score = Math.max(0, 100 - (riskScore * 10));

    // Phase 5.4: Calculate Distribution Quality Score
    const distributionQuality = calculateDistributionQuality(
        finalTop1Pct,
        finalTop10Pct,
        0, // LP risk score (will be integrated in Phase 5.1 full implementation)
        0  // Concentration delta (will be integrated in Phase 5.2)
    );

    return {
        contractRisk,
        holderRisk,
        flags,
        top1Pct: finalTop1Pct,
        top10Pct: finalTop10Pct,
        score,
        distributionQuality
    };
}
