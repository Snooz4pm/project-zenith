import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Unit size for consistent PnL ($10,000 position size equivalent)
const BASE_POSITION_SIZE = 10000;

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { scenarioId, choice, timeToDecisionMs, leverage = 1 } = body;

        if (!scenarioId || !choice || timeToDecisionMs === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Scenario to get Price Data
        const scenario = await prisma.decisionScenario.findUnique({
            where: { id: scenarioId },
            select: { chartData: true }
        });

        if (!scenario || !scenario.chartData || !Array.isArray(scenario.chartData)) {
            return NextResponse.json({ error: 'Scenario data unavailable' }, { status: 500 });
        }

        // 2. Calculate PnL
        let pnl = 0;
        let returnPercentage = 0;

        // Logic: Entry is at 80% mark (SplitIndex). Exit is at Last candle Close.
        // NOTE: For robustness, we should ideally store the "entry index" in DB, but 80% is the hardcoded rule for now.
        // Logic: Entry is at 80% mark (SplitIndex). Exit is at Last candle Close.
        // NOTE: For robustness, we should ideally store the "entry index" in DB, but 80% is the hardcoded rule for now.
        const data = scenario.chartData as any[];

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Chart data is empty or invalid format');
        }

        const splitIndex = Math.floor(data.length * 0.8);

        if (choice !== 'STAY_OUT') {
            if (splitIndex >= data.length || !data[splitIndex] || !data[data.length - 1]) {
                throw new Error(`Data indices out of bounds. Length: ${data.length}, Split: ${splitIndex}`);
            }

            const entryCandle = data[splitIndex];
            const exitCandle = data[data.length - 1];

            // Validate prices
            const entryPrice = Number(entryCandle.open);
            const exitPrice = Number(exitCandle.close);

            if (isNaN(entryPrice) || isNaN(exitPrice) || entryPrice === 0) {
                throw new Error(`Invalid price data. Entry: ${entryPrice}, Exit: ${exitPrice}`);
            }

            const rawReturn = (exitPrice - entryPrice) / entryPrice;

            // Direction Multiplier
            const direction = choice === 'BUY' ? 1 : -1;

            // Leverage Multiplier
            const safeLeverage = Number(leverage) || 1;
            const leverageMult = Math.max(1, Math.min(2, safeLeverage)); // Clamp 1-2

            returnPercentage = rawReturn * direction * leverageMult * 100; // formatted as %
            pnl = (BASE_POSITION_SIZE * rawReturn * direction * leverageMult);
        }

        // 3. Transaction: Create Attempt + Update User Balance
        const attempt = await prisma.$transaction(async (tx) => {
            // Check for existing attempt (Idempotency)
            const existing = await tx.decisionAttempt.findUnique({
                where: {
                    userId_scenarioId: {
                        userId: session.user.id,
                        scenarioId: scenarioId
                    }
                }
            });

            if (existing) throw new Error('ALREADY_ATTEMPTED');

            // Option A: Skip database balance update for now (Simulation Mode)
            const newBalance = 50000 + pnl;

            // Create Attempt
            const newAttempt = await tx.decisionAttempt.create({
                data: {
                    userId: session.user.id,
                    scenarioId,
                    choice,
                    timeToDecisionMs,
                    leverage,
                    pnl,
                    returnPercentage
                }
            });

            return { ...newAttempt, newBalance: newBalance };
        });

        return NextResponse.json(attempt);

    } catch (error: any) {
        // Detailed logging for debugging 500 errors
        console.error('[DECISION_ATTEMPT_ERROR] Full error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });

        if (error.message === 'ALREADY_ATTEMPTED') {
            return NextResponse.json({ error: 'You have already attempted this scenario.' }, { status: 409 });
        }
        if (error.code === 'P2002') { // Race condition fallback
            return NextResponse.json({ error: 'You have already attempted this scenario.' }, { status: 409 });
        }

        return NextResponse.json({
            error: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
