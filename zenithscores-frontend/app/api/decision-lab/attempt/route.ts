import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Unit size for consistent PnL ($10,000 position size equivalent)
const BASE_POSITION_SIZE = 10000;

// Generate synthetic chart data if missing
function generateChartData(basePrice: number = 1000, count: number = 100): any[] {
    const data = [];
    let price = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const day = 86400;
    const startTime = now - (count * day);

    for (let i = 0; i < count; i++) {
        const time = startTime + (i * day);
        const volatility = price * 0.02;
        const change = (Math.random() - 0.5) * volatility;

        const open = price;
        const close = Math.max(0.01, price + change);
        const high = Math.max(open, close) * 1.01;
        const low = Math.min(open, close) * 0.99;

        data.push({ time, open, high, low, close });
        price = close;
    }
    return data;
}

// Fallback prices for common symbols
const FALLBACK_PRICES: Record<string, number> = {
    'BTC': 65000, 'ETH': 3500, 'SOL': 150, 'XRP': 0.50, 'DOGE': 0.15,
    'AAPL': 185, 'MSFT': 400, 'NVDA': 500, 'TSLA': 250, 'GME': 25,
    'SPY': 500, 'QQQ': 430, 'SPX': 5000,
    'EUR/USD': 1.08, 'GBP/USD': 1.27, 'USD/JPY': 150, 'XAU/USD': 2000,
};

function getBasePriceFromSymbol(symbol: string): number {
    const normalized = symbol.toUpperCase().replace(/\/USD$/, '');
    for (const [key, price] of Object.entries(FALLBACK_PRICES)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return price;
        }
    }
    return 1000; // Default fallback
}

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

        // Get chart data - use existing or generate from basePrice
        let data: any[] = [];
        if (scenario.chartData && Array.isArray(scenario.chartData) && scenario.chartData.length > 0) {
            data = scenario.chartData as any[];
        } else {
            // Generate synthetic data using basePrice or symbol fallback
            const basePrice = (scenario as any).basePrice || getBasePriceFromSymbol(scenario.symbol);
            data = generateChartData(basePrice, 100);
        }

        // 2. Calculate PnL
        let pnl = 0;
        let returnPercentage = 0;
        const splitIndex = Math.floor(data.length * 0.8);
        const positionSize = Number(stake) || BASE_POSITION_SIZE;

        if (choice !== 'STAY_OUT') {
            if (splitIndex >= data.length || !data[splitIndex] || !data[data.length - 1]) {
                // Fallback if data is weirdly short or missing
                console.error('Data index out of bounds for PnL calc');
                pnl = 0;
            } else {
                const entryCandle = data[splitIndex];
                const exitCandle = data[data.length - 1];

                const entryPrice = Number(entryCandle.open);
                const exitPrice = Number(exitCandle.close);

                // Validation
                if (!Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || entryPrice === 0) {
                    console.error(`Invalid price data: Entry ${entryPrice}, Exit ${exitPrice}`);
                    pnl = 0;
                } else {
                    const direction = choice === 'BUY' ? 1 : -1;
                    const safeLeverage = Number(leverage) || 1;
                    const leverageMult = Math.max(1, Math.min(2, safeLeverage));

                    const rawReturn = (exitPrice - entryPrice) / entryPrice; // Percentage move

                    // Core PnL Formula: (Move * Direction) * Size * Leverage
                    pnl = rawReturn * direction * positionSize * leverageMult;
                    returnPercentage = rawReturn * direction * leverageMult * 100;
                }
            }

            // Final Guard: Never return NaN
            if (!Number.isFinite(pnl)) pnl = 0;
            if (!Number.isFinite(returnPercentage)) returnPercentage = 0;
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
