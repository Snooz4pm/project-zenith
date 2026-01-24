/**
 * Argus Behavioral Intelligence Engine - Phase 4 v3
 * Location: lib/argus/behaviorEngine.ts
 * 
 * Audits human signatures: Deployer history and funding sources.
 */

export interface BehaviorReport {
    deployerAddress: string;
    behaviorRisk: "LOW" | "MEDIUM" | "HIGH";
    fundingSource: {
        type: "CEX" | "MIXER" | "BURNER" | "UNKNOWN";
        name?: string;
    };
    trackRecord: {
        totalLaunched: number;
        diedQuickly: number; // McK < 100k or life < 1h
        confirmedRugs: number;
        avgLifespanMins: number;
    };
    flags: string[];
    score: number; // 0-100
}

export function analyzeBehavior(
    deployer: string,
    history: any[], // Raw tx or asset history
    firstInbound?: any // First funding tx
): BehaviorReport {
    const flags: string[] = [];
    let riskScore = 0;

    // 1. Funding Source Classification
    let fundingType: BehaviorReport["fundingSource"]["type"] = "UNKNOWN";
    let fundingName = "Unknown";

    // Heuristics for Funding Source (Simulated for v1)
    if (firstInbound?.isCex) {
        fundingType = "CEX";
        fundingName = firstInbound.cexName;
    } else if (firstInbound?.isMixer) {
        fundingType = "MIXER";
        flags.push("🚩 Funded by Bridge/Mixer");
        riskScore += 4;
    } else {
        fundingType = "BURNER";
        flags.push("⚠️ Funded by fresh burner wallet");
        riskScore += 2;
    }

    // 2. Track Record Analysis
    const totalLaunched = history.length;
    let diedQuickly = 0;
    let confirmedRugs = 0;

    history.forEach(token => {
        if (token.lifespanMins < 60) diedQuickly++;
        if (token.rugged) confirmedRugs++;
    });

    if (confirmedRugs > 0) {
        flags.push(`🚩 ${confirmedRugs} confirmed rugs in history`);
        riskScore += 5;
    }
    if (diedQuickly > 3) {
        flags.push(`⚠️ ${diedQuickly} tokens died < 1 hour`);
        riskScore += 3;
    }
    if (totalLaunched > 10 && confirmedRugs === 0) {
        flags.push("✅ Experienced Deployer (Clean History)");
        riskScore -= 2;
    }

    // 3. Final Calculation
    let behaviorRisk: BehaviorReport["behaviorRisk"] = "LOW";
    if (riskScore >= 6) behaviorRisk = "HIGH";
    else if (riskScore >= 3) behaviorRisk = "MEDIUM";

    const score = Math.max(0, 100 - (riskScore * 12));

    return {
        deployerAddress: deployer,
        behaviorRisk,
        fundingSource: { type: fundingType, name: fundingName },
        trackRecord: {
            totalLaunched,
            diedQuickly,
            confirmedRugs,
            avgLifespanMins: history.length > 0 ? 30 : 0 // Mocked for v1
        },
        flags,
        score
    };
}
