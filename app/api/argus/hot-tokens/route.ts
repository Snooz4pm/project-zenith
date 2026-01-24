export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDexMatchedTokens } from '@/lib/market-observer/JupiterDexMerger';
import { calculateReality } from '@/lib/argus/realityEngine';

export async function GET(req: NextRequest) {
    try {
        // 1. Get high-conviction tokens from merger
        const matched = await getDexMatchedTokens();

        // 2. Filter for ones with supply data
        const hotTokens = matched
            .filter(t => (t.price || 0) > 0 && (t.supply || 0) > 0)
            .slice(0, 30)
            .map(t => {
                const reality = calculateReality(t.price!, t.supply!, t.price! * 10);

                // Deterministic "Flow" Tag based on riskScore and volume
                let flow = "Neutral";
                if (t.riskScore <= 30 && (t.volume5m || 0) > 10000) flow = "🐳 Smart Inflow";
                else if (t.riskScore > 65) flow = "⚠️ Risky Surge";
                else if ((t.volume5m || 0) > 50000) flow = "🔥 Momentum";

                return {
                    mint: t.mint,
                    symbol: t.symbol,
                    name: t.name,
                    price: t.price,
                    supply: t.supply,
                    volume5m: t.volume5m,
                    riskScore: t.riskScore,
                    feasibility: reality.feasibility,
                    flow
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
