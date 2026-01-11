/**
 * Price Prediction Validator
 * 
 * Tests brain's ability to predict short-term price movements
 * WITHOUT executing any swaps.
 * 
 * Flow:
 * 1. Fetch prices for all tokens
 * 2. Brain analyzes and predicts direction (UP/DOWN/NEUTRAL)
 * 3. Wait 1 minute
 * 4. Fetch new prices and compare
 * 5. Track accuracy
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenPriceInSOL } from '@/lib/solana/price';

export const dynamic = 'force-dynamic';

interface PredictionSnapshot {
    token: string;
    symbol: string;
    priceSOL: number;
    prediction: 'UP' | 'DOWN' | 'NEUTRAL';
    confidence: number;
    timestamp: number;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tokens, duration = 10 } = body as {
            tokens: Array<{ mint: string; symbol: string }>;
            duration?: number; // minutes
        };

        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
        }

        console.log(`[Prediction Test] Starting ${duration}min test with ${tokens.length} tokens`);

        // Create test run
        const testRun = await (prisma as any).predictionTest.create({
            data: {
                totalTokens: tokens.length,
                durationMinutes: duration,
                status: 'RUNNING',
            }
        });

        // Start background process
        runPredictionTest(testRun.id, tokens, duration);

        return NextResponse.json({
            success: true,
            testId: testRun.id,
            message: `Prediction test started. Will run for ${duration} minutes.`,
        });

    } catch (error: any) {
        console.error('[Prediction Test] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start test' },
            { status: 500 }
        );
    }
}

/**
 * Background process - runs prediction cycles
 */
async function runPredictionTest(
    testId: string,
    tokens: Array<{ mint: string; symbol: string }>,
    durationMinutes: number
) {
    const cycles = durationMinutes; // 1 cycle per minute
    let correctPredictions = 0;
    let totalPredictions = 0;

    for (let cycle = 0; cycle < cycles; cycle++) {
        console.log(`[Prediction Test] Cycle ${cycle + 1}/${cycles}`);

        try {
            // 1. Fetch current prices
            const snapshots: PredictionSnapshot[] = [];

            for (const token of tokens.slice(0, 100)) { // Limit to 100 tokens to avoid rate limits
                const price = await getTokenPriceInSOL(token.mint);
                if (!price) continue;

                // 2. Brain predicts direction (simplified - you'll enhance this)
                const prediction = predictDirection(price);

                snapshots.push({
                    token: token.mint,
                    symbol: token.symbol,
                    priceSOL: price,
                    prediction: prediction.direction,
                    confidence: prediction.confidence,
                    timestamp: Date.now(),
                });
            }

            // 3. Wait 1 minute
            await new Promise(resolve => setTimeout(resolve, 60_000));

            // 4. Fetch new prices and compare
            for (const snapshot of snapshots) {
                const newPrice = await getTokenPriceInSOL(snapshot.token);
                if (!newPrice) continue;

                const priceChange = ((newPrice - snapshot.priceSOL) / snapshot.priceSOL) * 100;
                const actualDirection = priceChange > 0.1 ? 'UP' : priceChange < -0.1 ? 'DOWN' : 'NEUTRAL';
                const correct = snapshot.prediction === actualDirection;

                if (correct) correctPredictions++;
                totalPredictions++;

                // Store result
                await (prisma as any).predictionCycle.create({
                    data: {
                        testId,
                        cycle,
                        token: snapshot.token,
                        symbol: snapshot.symbol,
                        startPrice: snapshot.priceSOL,
                        endPrice: newPrice,
                        priceChangePct: priceChange,
                        predicted: snapshot.prediction,
                        actual: actualDirection,
                        correct,
                        confidence: snapshot.confidence,
                    }
                });
            }

            // Update test run
            const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
            await (prisma as any).predictionTest.update({
                where: { id: testId },
                data: {
                    cyclesCompleted: cycle + 1,
                    accuracy,
                }
            });

            console.log(`[Prediction Test] Cycle ${cycle + 1} complete. Accuracy: ${accuracy.toFixed(1)}%`);

        } catch (error) {
            console.error(`[Prediction Test] Cycle ${cycle + 1} failed:`, error);
        }
    }

    // Mark test complete
    await (prisma as any).predictionTest.update({
        where: { id: testId },
        data: {
            status: 'COMPLETED',
            completedAt: new Date(),
        }
    });

    console.log(`[Prediction Test] Complete! Final accuracy: ${((correctPredictions / totalPredictions) * 100).toFixed(1)}%`);
}

/**
 * Simplified prediction logic
 * TODO: Replace with actual brain signals (momentum, volume, RTL)
 */
function predictDirection(currentPrice: number): { direction: 'UP' | 'DOWN' | 'NEUTRAL'; confidence: number } {
    // Placeholder - you'll replace this with real brain logic
    // For now, random prediction
    const random = Math.random();

    if (random > 0.6) return { direction: 'UP', confidence: 0.6 };
    if (random < 0.4) return { direction: 'DOWN', confidence: 0.6 };
    return { direction: 'NEUTRAL', confidence: 0.3 };
}
