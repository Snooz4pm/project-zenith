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
        const data = scenario.chartData as any[];
        const splitIndex = Math.floor(data.length * 0.8);

        if (choice !== 'STAY_OUT' && data.length > splitIndex) {
            const entryPrice = data[splitIndex].open; // Market Entry on Open of next candle? Or Close of current? safely Open of index.
            const exitPrice = data[data.length - 1].close;

            const rawReturn = (exitPrice - entryPrice) / entryPrice;

            // Direction Multiplier
            const direction = choice === 'BUY' ? 1 : -1;

            // Leverage Multiplier
            const leverageMult = Math.max(1, Math.min(2, leverage)); // Clamp 1-2

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

            // Update User Balance
            const user = await tx.user.update({
                where: { id: session.user.id },
                // @ts-ignore: Prisma Client sync issue
                data: {
                    virtualBalance: { increment: pnl },
                    // Track max daily loss? (Future V2)
                },
                // @ts-ignore
                select: { virtualBalance: true }
            });

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

            return { ...newAttempt, newBalance: user.virtualBalance };
        });

        return NextResponse.json(attempt);

    } catch (error: any) {
        if (error.message === 'ALREADY_ATTEMPTED') {
            return NextResponse.json({ error: 'You have already attempted this scenario.' }, { status: 409 });
        }
        if (error.code === 'P2002') { // Race condition fallback
            return NextResponse.json({ error: 'You have already attempted this scenario.' }, { status: 409 });
        }

        console.error('Failed to log decision attempt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
