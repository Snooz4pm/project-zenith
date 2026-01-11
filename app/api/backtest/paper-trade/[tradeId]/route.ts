/**
 * GET /api/backtest/paper-trade/[tradeId]
 * 
 * Returns paper trade results with decision-by-decision breakdown
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { tradeId: string } }
) {
    try {
        const { tradeId } = params;

        const trade = await (prisma as any).paperTrade.findUnique({
            where: { id: tradeId },
            include: {
                decisions: {
                    orderBy: { index: 'asc' }
                }
            }
        });

        if (!trade) {
            return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
        }

        // Calculate metrics
        const swaps = trade.decisions.filter((d: any) => d.action === 'SWAP');
        const holds = trade.decisions.filter((d: any) => d.action === 'HOLD');

        const avgAccuracy = swaps.length > 0
            ? swaps.reduce((sum: number, s: any) => sum + (100 - (s.accuracyPct || 0)), 0) / swaps.length
            : 0;

        const successfulSwaps = swaps.filter((s: any) => (s.accuracyPct || 100) < 10).length; // <10% deviation = success
        const successfulHolds = holds.filter((h: any) => (h.priceChangePct || 0) > 0).length;

        return NextResponse.json({
            trade: {
                id: trade.id,
                status: trade.status,
                durationMinutes: trade.durationMinutes,
                startCapitalUSD: trade.startCapitalUSD,
                currentValueUSD: trade.currentValueUSD,
                finalValueUSD: trade.finalValueUSD,
                roiPct: trade.roiPct,
                createdAt: trade.createdAt,
                completedAt: trade.completedAt,
            },
            metrics: {
                totalDecisions: trade.decisions.length,
                swaps: swaps.length,
                holds: holds.length,
                avgPredictionAccuracy: avgAccuracy.toFixed(1),
                successfulSwaps,
                successfulHolds,
                swapSuccessRate: swaps.length > 0 ? ((successfulSwaps / swaps.length) * 100).toFixed(1) : '0',
                holdSuccessRate: holds.length > 0 ? ((successfulHolds / holds.length) * 100).toFixed(1) : '0',
            },
            decisions: trade.decisions.map((d: any) => ({
                index: d.index,
                action: d.action,
                // SWAP details
                ...(d.action === 'SWAP' && {
                    fromToken: d.fromToken,
                    toToken: d.toToken,
                    expectedOut: d.expectedOut,
                    actualOut: d.actualOut,
                    accuracyPct: d.accuracyPct ? (100 - d.accuracyPct).toFixed(1) : null,
                }),
                // HOLD details
                ...(d.action === 'HOLD' && {
                    holdMinutes: d.holdMinutes,
                    holdReason: d.holdReason,
                    priceChangePct: d.priceChangePct?.toFixed(2),
                }),
                portfolioValueUSD: d.portfolioValueUSD?.toFixed(2),
                timestamp: d.timestamp,
            }))
        });

    } catch (error: any) {
        console.error('[Paper Trade Results] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch results' },
            { status: 500 }
        );
    }
}
