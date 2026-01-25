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

    // 2. Supply Distribution Analysis (v2) - Reference Implementation
    let holderRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let finalTop1Pct = 0;
    let finalTop10Pct = 0;

    // DEBUG LOGGING
    console.log('=== HOLDER % CALCULATION DEBUG ===');
    console.log('mint.supply (raw):', mintInfo.supply);
    console.log('mint.decimals:', mintInfo.decimals);
    console.log('holders.length:', holders?.length || 0);

    if (holders && holders.length > 0 && mintInfo.supply > 0) {
        // STEP 1: Explicit sorting (don't trust input order)
        const sortedHolders = [...holders].sort((a, b) => b.amount - a.amount);

        console.log('topHolder.amount (raw):', sortedHolders[0]?.amount);

        // STEP 2: Normalize to same units (human tokens, not raw)
        const divisor = Math.pow(10, mintInfo.decimals);
        const supplyTokens = mintInfo.supply / divisor;
        const topHolderTokens = sortedHolders[0].amount / divisor;

        console.log('divisor:', divisor);
        console.log('normalizedSupply:', supplyTokens);
        console.log('normalizedTopHolder:', topHolderTokens);

        // STEP 3: Calculate percentage (both in same units)
        if (supplyTokens > 0) {
            finalTop1Pct = (topHolderTokens / supplyTokens) * 100;
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
        }

        // STEP 4: Calculate Top 10 concentration
        const top10Sum = sortedHolders.slice(0, 10).reduce((sum, h) => sum + h.amount, 0);
        const top10Tokens = top10Sum / divisor;
        finalTop10Pct = (top10Tokens / supplyTokens) * 100;

        console.log('top10Tokens:', top10Tokens);
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
            supply: mintInfo.supply
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
