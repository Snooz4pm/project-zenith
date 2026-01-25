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
        supplyUi: number; // Human-readable supply (already normalized)
        decimals: number;
    },
    holders?: { uiAmount: number }[], // Use uiAmount directly
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

    // 2. Supply Distribution Analysis - RECOMMENDED APPROACH (uiAmount)
    let holderRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let finalTop1Pct = 0;
    let finalTop10Pct = 0;

    // DEBUG LOGGING
    console.log('=== HOLDER % CALCULATION (uiAmount Method) ===');
    console.log('supplyUi:', mintInfo.supplyUi);
    console.log('holders.length:', holders?.length || 0);

    if (holders && holders.length > 0 && mintInfo.supplyUi > 0) {
        // STEP 1: Explicit sorting by uiAmount
        const sortedHolders = [...holders].sort((a, b) => b.uiAmount - a.uiAmount);

        console.log('topHolder.uiAmount:', sortedHolders[0]?.uiAmount);

        // STEP 2: Calculate percentage (both already in human tokens)
        const topHolderAmount = sortedHolders[0].uiAmount;
        finalTop1Pct = (topHolderAmount / mintInfo.supplyUi) * 100;

        console.log('FINAL Top1%:', finalTop1Pct);

        if (finalTop1Pct > 20) {
            flags.push(`⚠️ Top Holder owns ${finalTop1Pct.toFixed(1)}% (Dev/Cabal Warning)`);
            holderRisk = "HIGH";
            riskScore += 3;
        } else if (finalTop1Pct > 10) {
            flags.push(`⚠️ Top Holder owns ${finalTop1Pct.toFixed(1)}%`);
            holderRisk = "MEDIUM";
            riskScore += 1;
        }

        // STEP 3: Calculate Top 10 concentration
        const top10Total = sortedHolders
            .slice(0, 10)
            .reduce((sum, h) => sum + h.uiAmount, 0);

        finalTop10Pct = (top10Total / mintInfo.supplyUi) * 100;

        console.log('top10Total:', top10Total);
        console.log('FINAL Top10%:', finalTop10Pct);

        if (finalTop10Pct > 50) {
            flags.push(`⚠️ Top 10 own ${finalTop10Pct.toFixed(1)}% (Concentrated)`);
            if (holderRisk !== "HIGH") holderRisk = "MEDIUM";
            riskScore += 2;
        }
    } else {
        console.warn('⚠️ HOLDER CALCULATION SKIPPED:', {
            hasHolders: !!holders,
            holdersLength: holders?.length || 0,
            supplyUi: mintInfo.supplyUi
        });
    }
    console.log('=== END DEBUG ===');

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
