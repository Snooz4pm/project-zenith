import { NextRequest, NextResponse } from 'next/server';
import { getDexMatchedTokens } from '@/lib/market-observer/JupiterDexMerger';
import { calculateReality } from '@/lib/argus/realityEngine';

export async function GET(req: NextRequest) {
    try {
        // 1. Get high-conviction tokens from merger
        const matched = await getDexMatchedTokens();

        // 2. Filter for ones with supply data (or fetch some if missing)
        const hotTokens = matched
            .filter(t => (t.price || 0) > 0 && (t.supply || 0) > 0)
            .slice(0, 30) // Increased for cockpit scroll depth
            .map(t => {
                const reality = calculateReality(t.price!, t.supply!, t.price! * 10); // Check 10x feasibility as a baseline
                return {
                    mint: t.mint,
                    symbol: t.symbol,
                    name: t.name,
                    price: t.price,
                    supply: t.supply,
                    feasibility: reality.feasibility
                };
            });

        return NextResponse.json({
            count: hotTokens.length,
            tokens: hotTokens
        });

    } catch (err: any) {
        console.error('[API Argus HotTokens] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
