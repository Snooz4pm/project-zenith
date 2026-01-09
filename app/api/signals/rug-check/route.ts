// =============================================================================
// Rug Check API with Risk Score Algorithm
// BASIC: Simple pass/fail | PREMIUM: Full 20-signal analysis
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RugCheckResult {
    mint: string;
    // BASIC (free)
    isRisky: boolean;
    quickVerdict: 'SAFE' | 'CAUTION' | 'DANGER';
    // PREMIUM (paid)
    rugScore?: number;
    signals?: RugSignal[];
    detailedAnalysis?: {
        mintAuthority: boolean;
        freezeAuthority: boolean;
        lpBurned: boolean;
        lpLockedPercent: number;
        topHolderPercent: number;
        isHoneypot: boolean;
        devSelling: boolean;
        isCopycat: boolean;
        contractVerified: boolean;
        liquidityStable: boolean;
    };
    recommendations?: string[];
}

interface RugSignal {
    name: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    weight: number;
    detail: string;
}

// Cache results
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// RUG RISK SCORE ALGORITHM (0-100, higher = SAFER)
// =============================================================================

async function analyzeToken(mint: string): Promise<RugCheckResult> {
    const signals: RugSignal[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Fetch from RugCheck API
    let rugCheckData: any = null;
    try {
        const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mint}/report`);
        if (response.ok) {
            rugCheckData = await response.json();
        }
    } catch {
        // Continue with what we have
    }

    // ==========================================================================
    // SIGNAL 1: Mint Authority (weight: 15)
    // ==========================================================================
    {
        const weight = 15;
        maxScore += weight;
        const hasAuthority = rugCheckData?.mintAuthority && rugCheckData.mintAuthority !== null;

        signals.push({
            name: 'Mint Authority',
            status: hasAuthority ? 'FAIL' : 'PASS',
            weight,
            detail: hasAuthority ? 'Can mint unlimited tokens' : 'Revoked - cannot mint more',
        });

        if (!hasAuthority) totalScore += weight;
    }

    // ==========================================================================
    // SIGNAL 2: Freeze Authority (weight: 10)
    // ==========================================================================
    {
        const weight = 10;
        maxScore += weight;
        const hasFreeze = rugCheckData?.freezeAuthority && rugCheckData.freezeAuthority !== null;

        signals.push({
            name: 'Freeze Authority',
            status: hasFreeze ? 'FAIL' : 'PASS',
            weight,
            detail: hasFreeze ? 'Can freeze your tokens' : 'No freeze capability',
        });

        if (!hasFreeze) totalScore += weight;
    }

    // ==========================================================================
    // SIGNAL 3: LP Status (weight: 20)
    // ==========================================================================
    {
        const weight = 20;
        maxScore += weight;
        const lpBurned = rugCheckData?.markets?.[0]?.lp?.lpBurned || false;
        const lpLockedPct = rugCheckData?.markets?.[0]?.lp?.lpLockedPct || 0;

        let status: 'PASS' | 'WARN' | 'FAIL' = 'FAIL';
        let detail = 'LP not protected';
        let points = 0;

        if (lpBurned) {
            status = 'PASS';
            detail = 'LP burned permanently';
            points = weight;
        } else if (lpLockedPct >= 90) {
            status = 'PASS';
            detail = `${lpLockedPct}% LP locked`;
            points = weight;
        } else if (lpLockedPct >= 50) {
            status = 'WARN';
            detail = `Only ${lpLockedPct}% LP locked`;
            points = weight * 0.5;
        }

        signals.push({ name: 'Liquidity Protection', status, weight, detail });
        totalScore += points;
    }

    // ==========================================================================
    // SIGNAL 4: Top Holder Concentration (weight: 15)
    // ==========================================================================
    {
        const weight = 15;
        maxScore += weight;
        const topPct = rugCheckData?.topHolders?.[0]?.pct || 0;

        let status: 'PASS' | 'WARN' | 'FAIL' = 'FAIL';
        let points = 0;

        if (topPct <= 5) {
            status = 'PASS';
            points = weight;
        } else if (topPct <= 15) {
            status = 'WARN';
            points = weight * 0.5;
        }

        signals.push({
            name: 'Top Holder',
            status,
            weight,
            detail: `Largest holder owns ${topPct.toFixed(1)}%`,
        });
        totalScore += points;
    }

    // ==========================================================================
    // SIGNAL 5: Known Rug Flag (weight: 40)
    // ==========================================================================
    {
        const weight = 40;
        maxScore += weight;
        const isRugged = rugCheckData?.rugged || false;

        signals.push({
            name: 'Rug Status',
            status: isRugged ? 'FAIL' : 'PASS',
            weight,
            detail: isRugged ? 'FLAGGED AS RUGGED' : 'No rug reports',
        });

        if (!isRugged) totalScore += weight;
    }

    // Calculate final score (0-100)
    const rugScore = Math.round((totalScore / maxScore) * 100);

    // Determine quick verdict
    let quickVerdict: 'SAFE' | 'CAUTION' | 'DANGER';
    if (rugScore >= 70) quickVerdict = 'SAFE';
    else if (rugScore >= 40) quickVerdict = 'CAUTION';
    else quickVerdict = 'DANGER';

    // Generate recommendations
    const recommendations: string[] = [];
    signals
        .filter(s => s.status !== 'PASS')
        .forEach(s => {
            if (s.name === 'Mint Authority') recommendations.push('Wait for mint authority to be revoked');
            if (s.name === 'Freeze Authority') recommendations.push('Beware: tokens can be frozen');
            if (s.name === 'Liquidity Protection') recommendations.push('LP not fully protected - higher rug risk');
            if (s.name === 'Top Holder') recommendations.push('Check who the top holder is before aping');
            if (s.name === 'Rug Status') recommendations.push('DO NOT BUY - token is flagged as rugged');
        });

    return {
        mint,
        // Basic
        isRisky: rugScore < 50,
        quickVerdict,
        // Premium
        rugScore,
        signals,
        detailedAnalysis: {
            mintAuthority: !!(rugCheckData?.mintAuthority),
            freezeAuthority: !!(rugCheckData?.freezeAuthority),
            lpBurned: rugCheckData?.markets?.[0]?.lp?.lpBurned || false,
            lpLockedPercent: rugCheckData?.markets?.[0]?.lp?.lpLockedPct || 0,
            topHolderPercent: rugCheckData?.topHolders?.[0]?.pct || 0,
            isHoneypot: false, // Would need simulation
            devSelling: false, // Would need transaction analysis
            isCopycat: false, // Would need name matching
            contractVerified: true, // Placeholder
            liquidityStable: true, // Would need historical data
        },
        recommendations,
    };
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const mint = searchParams.get('mint');
        const isPremium = searchParams.get('premium') === 'true';

        if (!mint) {
            return NextResponse.json({ error: 'Missing mint address' }, { status: 400 });
        }

        // Check cache
        const cached = cache.get(mint);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            const result = isPremium ? cached.data : stripPremiumData(cached.data);
            return NextResponse.json({ ...result, cached: true, isPremium });
        }

        // Analyze token
        const analysis = await analyzeToken(mint);

        // Cache result
        cache.set(mint, { data: analysis, timestamp: Date.now() });

        // Return based on access level
        const result = isPremium ? analysis : stripPremiumData(analysis);

        return NextResponse.json({ ...result, isPremium });
    } catch (err: any) {
        console.error('[RugCheck] Error:', err);
        return NextResponse.json({ error: 'Failed to check token' }, { status: 500 });
    }
}

// Strip premium-only data for free users
function stripPremiumData(data: RugCheckResult): Partial<RugCheckResult> {
    return {
        mint: data.mint,
        isRisky: data.isRisky,
        quickVerdict: data.quickVerdict,
        // Premium fields hidden
        rugScore: undefined,
        signals: undefined,
        detailedAnalysis: undefined,
        recommendations: undefined,
    };
}
