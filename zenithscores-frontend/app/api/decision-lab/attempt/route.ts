import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

/**
 * PHASE 5 — Forward Simulation (Correct Execution Model)
 * Simulates candle-by-candle price action to find exact SL/TP exit
 */
function simulateForwardExecution(
    candles: any[],
    entryIndex: number,
    entryPrice: number,
    direction: 'LONG' | 'SHORT',
    stopLoss: number,
    takeProfit: number
): { exitPrice: number; outcome: 'WIN' | 'LOSS' | 'INCOMPLETE'; exitIndex: number } {

    // Simulate from entry+1 to end
    for (let i = entryIndex + 1; i < candles.length; i++) {
        const candle = candles[i];

        if (direction === 'LONG') {
            // Check if SL hit first (conservative - assume low comes before high)
            if (candle.low <= stopLoss) {
                return { exitPrice: stopLoss, outcome: 'LOSS', exitIndex: i };
            }
            // Check if TP hit
            if (candle.high >= takeProfit) {
                return { exitPrice: takeProfit, outcome: 'WIN', exitIndex: i };
            }
        } else {
            // SHORT
            // Check if SL hit first (conservative - assume high comes before low)
            if (candle.high >= stopLoss) {
                return { exitPrice: stopLoss, outcome: 'LOSS', exitIndex: i };
            }
            // Check if TP hit
            if (candle.low <= takeProfit) {
                return { exitPrice: takeProfit, outcome: 'WIN', exitIndex: i };
            }
        }
    }

    // If we reach here, neither SL nor TP was hit - use final candle close
    const finalCandle = candles[candles.length - 1];
    const finalPrice = finalCandle.close;

    // Determine if this is a win or loss based on final price vs entry
    let outcome: 'WIN' | 'LOSS' | 'INCOMPLETE' = 'INCOMPLETE';
    if (direction === 'LONG') {
        outcome = finalPrice > entryPrice ? 'WIN' : 'LOSS';
    } else {
        outcome = finalPrice < entryPrice ? 'WIN' : 'LOSS';
    }

    return { exitPrice: finalPrice, outcome, exitIndex: candles.length - 1 };
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            scenarioId,
            choice,
            timeToDecisionMs,
            riskPercent = 1,
            accountBalance = 50000,
            stopLossPercent = 2,
            takeProfitPercent = 4
        } = body;

        if (!scenarioId || !choice || timeToDecisionMs === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate choice
        if (!['BUY', 'SELL', 'STAY_OUT'].includes(choice)) {
            return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });
        }

        // 1. Fetch Scenario to get Price Data
        const scenario = await prisma.decisionScenario.findUnique({
            where: { id: scenarioId }
        });

        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // Get chart data - use existing or generate from basePrice
        let candles: any[] = [];
        if (scenario.chartData && Array.isArray(scenario.chartData) && scenario.chartData.length > 0) {
            candles = scenario.chartData as any[];
        } else {
            // Generate synthetic data using basePrice or symbol fallback
            const basePrice = (scenario as any).basePrice || getBasePriceFromSymbol(scenario.symbol);
            candles = generateChartData(basePrice, 100);
        }

        if (candles.length === 0) {
            return NextResponse.json({ error: 'No chart data available' }, { status: 500 });
        }

        // 2. Calculate PnL using the CORRECT 5-Phase Model
        let pnl = 0;
        let returnPercentage = 0;

        if (choice === 'STAY_OUT') {
            // No trade, no PnL
            pnl = 0;
            returnPercentage = 0;
        } else {
            // PHASE 1 — Capital & Risk Definition
            const safeAccountBalance = Number(accountBalance) || 50000;
            const safeRiskPercent = Math.max(0.1, Math.min(10, Number(riskPercent) || 1));
            const safeSLPercent = Math.max(0.1, Math.min(20, Number(stopLossPercent) || 2));
            const safeTPPercent = Math.max(0.1, Math.min(50, Number(takeProfitPercent) || 4));

            const riskAmount = safeAccountBalance * (safeRiskPercent / 100);
            const direction = choice === 'BUY' ? 'LONG' : 'SHORT';

            // PHASE 2 — Entry Lock (80% through chart)
            const entryIndex = Math.floor(candles.length * 0.8);
            if (entryIndex >= candles.length) {
                return NextResponse.json({ error: 'Invalid entry point' }, { status: 500 });
            }

            const entryCandle = candles[entryIndex];
            const entryPrice = Number(entryCandle.close);

            if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
                console.error('Invalid entry price:', entryPrice);
                pnl = 0;
                returnPercentage = 0;
            } else {
                // PHASE 3 — Position Sizing (THIS IS CRITICAL)
                const stopLossDistance = entryPrice * (safeSLPercent / 100);
                const positionSize = riskAmount / stopLossDistance;

                // PHASE 4 — Exit Levels
                const stopLoss = direction === 'LONG'
                    ? entryPrice - stopLossDistance
                    : entryPrice + stopLossDistance;

                const takeProfit = direction === 'LONG'
                    ? entryPrice + (entryPrice * (safeTPPercent / 100))
                    : entryPrice - (entryPrice * (safeTPPercent / 100));

                // PHASE 5 — Forward Simulation
                const result = simulateForwardExecution(
                    candles,
                    entryIndex,
                    entryPrice,
                    direction,
                    stopLoss,
                    takeProfit
                );

                // Calculate PnL based on actual exit
                const priceChange = result.exitPrice - entryPrice;
                const directionMultiplier = direction === 'LONG' ? 1 : -1;

                pnl = priceChange * directionMultiplier * positionSize;
                returnPercentage = (pnl / riskAmount) * 100;

                // Safety check
                if (!Number.isFinite(pnl)) pnl = 0;
                if (!Number.isFinite(returnPercentage)) returnPercentage = 0;
            }
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

                // If already attempted, just return the existing data
                if (existing) {
                    const portfolio = await tx.portfolio.findUnique({ where: { userId: session.user.id } });
                    return {
                        attempt: existing,
                        pnl: existing.pnl,
                        newBalance: portfolio?.balance || 50000
                    };
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
                let updatedPortfolio = portfolio;
                if (Math.abs(pnl) > 0.01) {
                    console.log(`[Portfolio Update] User: ${session.user.id}, Old Balance: ${portfolio.balance}, PnL: ${pnl}`);
                    updatedPortfolio = await tx.portfolio.update({
                        where: { id: portfolio.id },
                        data: {
                            balance: { increment: pnl },
                            totalRealizedPnL: { increment: pnl }
                        }
                    });
                    console.log(`[Portfolio Update] New Balance: ${updatedPortfolio.balance}`);

                    // Create a Trade record for history
                    const entryIndex = Math.floor(candles.length * 0.8);
                    const entryPrice = Number(candles[entryIndex]?.close) || 1;
                    const riskAmount = accountBalance * (riskPercent / 100);
                    const stopLossDistance = entryPrice * (stopLossPercent / 100);
                    const quantity = riskAmount / stopLossDistance;

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
                        leverage: 1, // Not used in new model, keeping for backwards compatibility
                        pnl,
                        returnPercentage
                    }
                });

                return {
                    attempt: newAttempt,
                    pnl: newAttempt.pnl,
                    newBalance: updatedPortfolio.balance
                };
            });

            return NextResponse.json(result);

        } catch (dbError: any) {
            console.error("Decision Lab DB Transaction Error:", dbError);
            if (dbError.code === 'P2002') {
                return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
            }
            throw dbError;
        }

    } catch (error: any) {
        console.error('[DECISION_ATTEMPT_ERROR] Full error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });

        if (error.message === 'ALREADY_ATTEMPTED') {
            return NextResponse.json({ error: 'You have already attempted this scenario.' }, { status: 409 });
        }

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'You have already attempted this scenario.' }, { status: 409 });
        }

        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
