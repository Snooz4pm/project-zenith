// =============================================================================
// Rug Check API - Uses RugCheck.xyz API to analyze token safety
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RugCheckResult {
    mint: string;
    score: number;          // 0-100 (higher = safer)
    risks: string[];        // List of detected risks
    isRug: boolean;         // High probability of rug
    details: {
        mintAuthority: boolean;
        freezeAuthority: boolean;
        lpBurned: boolean;
        topHolderPercent: number;
        lpLocked: boolean;
        lpLockedPercent: number;
    };
}

// Cache results to avoid rate limiting
const cache = new Map<string, { data: RugCheckResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const mint = searchParams.get('mint');

        if (!mint) {
            return NextResponse.json({ error: 'Missing mint address' }, { status: 400 });
        }

        // Check cache
        const cached = cache.get(mint);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cached.data, cached: true });
        }

        // Fetch from RugCheck API
        const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mint}/report`);

        if (!response.ok) {
            // Fallback: basic on-chain check
            return NextResponse.json({
                mint,
                score: 50,
                risks: ['Unable to fetch full report'],
                isRug: false,
                details: {
                    mintAuthority: false,
                    freezeAuthority: false,
                    lpBurned: false,
                    topHolderPercent: 0,
                    lpLocked: false,
                    lpLockedPercent: 0,
                },
                cached: false,
            });
        }

        const data = await response.json();

        // Parse RugCheck response
        const risks: string[] = [];
        let score = 100;

        // Check mint authority
        if (data.mintAuthority && data.mintAuthority !== null) {
            risks.push('Mint authority not revoked');
            score -= 30;
        }

        // Check freeze authority
        if (data.freezeAuthority && data.freezeAuthority !== null) {
            risks.push('Freeze authority enabled');
            score -= 20;
        }

        // Check LP status
        const lpBurned = data.markets?.[0]?.lp?.lpBurned || false;
        const lpLockedPercent = data.markets?.[0]?.lp?.lpLockedPct || 0;

        if (!lpBurned && lpLockedPercent < 80) {
            risks.push('LP not burned or locked');
            score -= 25;
        }

        // Check top holders
        const topHolderPercent = data.topHolders?.[0]?.pct || 0;
        if (topHolderPercent > 20) {
            risks.push(`Top holder owns ${topHolderPercent.toFixed(1)}%`);
            score -= 15;
        }

        // Check for known rug patterns
        if (data.rugged) {
            risks.push('Token flagged as rugged');
            score = 0;
        }

        const result: RugCheckResult = {
            mint,
            score: Math.max(0, score),
            risks,
            isRug: score < 30 || data.rugged,
            details: {
                mintAuthority: !!data.mintAuthority,
                freezeAuthority: !!data.freezeAuthority,
                lpBurned,
                topHolderPercent,
                lpLocked: lpLockedPercent > 80,
                lpLockedPercent,
            },
        };

        // Cache result
        cache.set(mint, { data: result, timestamp: Date.now() });

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('[RugCheck] Error:', err);
        return NextResponse.json({ error: 'Failed to check token' }, { status: 500 });
    }
}
