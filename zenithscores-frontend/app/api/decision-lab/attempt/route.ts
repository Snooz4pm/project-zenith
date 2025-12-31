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
        const { scenarioId, choice, timeToDecisionMs, leverage = 1, stake } = body;

        if (!scenarioId || !choice || timeToDecisionMs === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Scenario to get Price Data
        const scenario = await prisma.decisionScenario.findUnique({
            where: { id: scenarioId }
        });

        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        if (!scenario.chartData || !Array.isArray(scenario.chartData) || scenario.chartData.length === 0) {
            return NextResponse.json({
                error: 'Scenario data unavailable. This scenario might be a shell without price data yet.',
                status: 'DATA_EXTRACT_ERROR'
            }, { status: 500 });
        }

        // 2. Calculate PnL
        let pnl = 0;
        let returnPercentage = 0;
        const data = scenario.chartData as any[];
        const splitIndex = Math.floor(data.length * 0.8);

        // Position sizing: Use stake from body or default to BASE_POSITION_SIZE
        const positionSize = Number(stake) || BASE_POSITION_SIZE;

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
            pnl = (positionSize * rawReturn * direction * leverageMult);

            // Safety check for NaN or Infinity
            if (!isFinite(pnl)) pnl = 0;
        }

        // 3. Transaction: Create Attempt + Update User Portfolio
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Check for existing attempt (Idempotency)
                const existing = await tx.decisionAttempt.findUnique({
                    where: {
                        userId_scenarioId: {
                            userId: session.user.id,
                            scenarioId: scenarioId
                        }
                    }
                });

                // If already attempted, just return the existing data without crashing
                if (existing) {
                    const portfolio = await tx.portfolio.findUnique({ where: { userId: session.user.id } });
                    return { attempt: existing, balance: portfolio?.balance || 50000 };
                }

                // Find or Create Portfolio
                let portfolio = await tx.portfolio.findUnique({
                    where: { userId: session.user.id }
                });

                if (!portfolio) {
                    portfolio = await tx.portfolio.create({
                        data: {
                            userId: session.user.id,
                            balance: 50000,
                            totalRealizedPnL: 0
                        }
                    });
                }

                // Update Portfolio Balance and Realized PnL
                // Only update if PnL is non-zero (user didn't stay out)
                let updatedPortfolio = portfolio;
                if (Math.abs(pnl) > 0.01) { // Floating point safety
                    updatedPortfolio = await tx.portfolio.update({
                        where: { id: portfolio.id },
                        data: {
                            balance: { increment: pnl },
                            totalRealizedPnL: { increment: pnl }
                        }
                    });

                    // Create a Trade record for history
                    // Careful with Quantity division by zero
                    const entryPrice = Number(data[splitIndex]?.open) || 1;
                    const quantity = positionSize / entryPrice;

                    await tx.trade.create({
                        data: {
                            portfolioId: portfolio.id,
                            symbol: scenario.symbol,
                            side: choice,
                            quantity: isFinite(quantity) ? quantity : 0,
                            price: entryPrice,
                            realizedPnL: pnl,
                            timestamp: new Date()
                        }
                    });
                }

                // Create Attempt
                const newAttempt = await tx.decisionAttempt.create({
                    data: {
                        userId: session.user.id,
                        scenarioId,
                        choice,
                        timeToDecisionMs,
                        leverage: Math.floor(leverage), // Ensure Int
                        stake: Math.floor(positionSize), // Ensure Int, add this field if it's new
                        pnl,
                        returnPercentage
                    }
                });

                return { attempt: newAttempt, balance: updatedPortfolio.balance };
            });

            return NextResponse.json(result);

        } catch (dbError: any) {
            console.error("Decision Lab DB Transaction Error:", dbError);
            // If it's a unique constraint violation (should be handled by idempotency check but just in case)
            if (dbError.code === 'P2002') {
                return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
            }
            throw dbError; // Re-throw to be caught by outer catch
        }

        return NextResponse.json(result);

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
            error: error.message || 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
