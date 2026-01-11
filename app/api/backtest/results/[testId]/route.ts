/**
 * GET /api/backtest/results/[testId]
 * 
 * Returns prediction test results with accuracy metrics
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { testId: string } }
) {
    try {
        const { testId } = params;

        const test = await (prisma as any).predictionTest.findUnique({
            where: { id: testId },
            include: {
                cycles: {
                    orderBy: { cycle: 'asc' }
                }
            }
        });

        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Calculate detailed metrics
        const totalPredictions = test.cycles.length;
        const correctPredictions = test.cycles.filter((c: any) => c.correct).length;
        const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

        // Group by prediction type
        const upPredictions = test.cycles.filter((c: any) => c.predicted === 'UP');
        const downPredictions = test.cycles.filter((c: any) => c.predicted === 'DOWN');
        const neutralPredictions = test.cycles.filter((c: any) => c.predicted === 'NEUTRAL');

        const upAccuracy = upPredictions.length > 0
            ? (upPredictions.filter((c: any) => c.correct).length / upPredictions.length) * 100
            : 0;
        const downAccuracy = downPredictions.length > 0
            ? (downPredictions.filter((c: any) => c.correct).length / downPredictions.length) * 100
            : 0;
        const neutralAccuracy = neutralPredictions.length > 0
            ? (neutralPredictions.filter((c: any) => c.correct).length / neutralPredictions.length) * 100
            : 0;

        // Average price change
        const avgPriceChange = test.cycles.reduce((sum: number, c: any) => sum + c.priceChangePct, 0) / totalPredictions;

        // Best and worst predictions
        const sortedByChange = [...test.cycles].sort((a, b) => Math.abs(b.priceChangePct) - Math.abs(a.priceChangePct));
        const biggestMovers = sortedByChange.slice(0, 10);

        return NextResponse.json({
            test: {
                id: test.id,
                status: test.status,
                durationMinutes: test.durationMinutes,
                cyclesCompleted: test.cyclesCompleted,
                totalTokens: test.totalTokens,
                createdAt: test.createdAt,
                completedAt: test.completedAt,
            },
            metrics: {
                totalPredictions,
                correctPredictions,
                accuracy: accuracy.toFixed(2),
                avgPriceChange: avgPriceChange.toFixed(4),
                byDirection: {
                    up: {
                        total: upPredictions.length,
                        correct: upPredictions.filter((c: any) => c.correct).length,
                        accuracy: upAccuracy.toFixed(2),
                    },
                    down: {
                        total: downPredictions.length,
                        correct: downPredictions.filter((c: any) => c.correct).length,
                        accuracy: downAccuracy.toFixed(2),
                    },
                    neutral: {
                        total: neutralPredictions.length,
                        correct: neutralPredictions.filter((c: any) => c.correct).length,
                        accuracy: neutralAccuracy.toFixed(2),
                    }
                }
            },
            biggestMovers: biggestMovers.map((c: any) => ({
                symbol: c.symbol,
                priceChangePct: c.priceChangePct.toFixed(2),
                predicted: c.predicted,
                actual: c.actual,
                correct: c.correct,
            })),
            cycles: test.cycles.map((c: any) => ({
                cycle: c.cycle,
                symbol: c.symbol,
                priceChangePct: c.priceChangePct.toFixed(2),
                predicted: c.predicted,
                actual: c.actual,
                correct: c.correct,
                confidence: c.confidence,
            }))
        });

    } catch (error: any) {
        console.error('[Backtest Results] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch results' },
            { status: 500 }
        );
    }
}
