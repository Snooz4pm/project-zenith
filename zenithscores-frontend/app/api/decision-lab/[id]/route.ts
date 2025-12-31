import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { resolveBasePrice } from '@/lib/pricing/resolveBasePrice';

// Helper to generate synthetic chart data if scenario has none
function generateSyntheticData(basePrice: number = 1000, days: number = 100) {
    const data = [];
    let price = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const day = 86400;
    const startTime = now - (days * day);

    for (let i = 0; i < days; i++) {
        const time = startTime + (i * day);
        const volatility = price * 0.02;
        const change = (Math.random() - 0.5) * volatility;

        const open = price;
        const close = Math.max(0.01, price + change); // Prevent negative
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({ time, open, high, low, close });
        price = close;
    }
    return data;
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Check if user already completed this scenario (LOCK CHECK)
        const existingAttempt = await prisma.decisionAttempt.findUnique({
            where: {
                userId_scenarioId: {
                    userId: session.user.id,
                    scenarioId: id
                }
            }
        });

        if (existingAttempt) {
            return NextResponse.json({
                playable: false,
                reason: 'You have already completed this scenario. Each scenario can only be attempted once.'
            });
        }

        // Fetch from database
        const dbScenario = await prisma.decisionScenario.findUnique({
            where: { id }
        });

        if (!dbScenario) {
            return NextResponse.json({
                playable: false,
                reason: 'Scenario was deprecated or removed'
            });
        }

        // Check if scenario is playable (has required data)
        if (!dbScenario.basePrice && !dbScenario.chartData) {
            return NextResponse.json({
                playable: false,
                reason: 'Scenario is missing required price data'
            });
        }

        // Auto-resolve base price if missing (uses cache or fetches)
        const basePrice = dbScenario.basePrice || await resolveBasePrice(id);

        // Use database chart data or generate synthetic if missing
        let chartData = dbScenario.chartData;
        if (!chartData || (Array.isArray(chartData) && chartData.length === 0)) {
            chartData = generateSyntheticData(basePrice, 100);
        }

        // Final validation - must have valid chart data
        if (!chartData || (Array.isArray(chartData) && chartData.length === 0)) {
            return NextResponse.json({
                playable: false,
                reason: 'Failed to generate valid chart data'
            });
        }

        // Get or create user's portfolio
        let portfolio = await prisma.portfolio.findUnique({
            where: { userId: session.user.id },
            select: { balance: true }
        });

        // Create portfolio if it doesn't exist (first time user)
        if (!portfolio) {
            portfolio = await prisma.portfolio.create({
                data: {
                    userId: session.user.id,
                    balance: 50000,
                    totalRealizedPnL: 0
                },
                select: { balance: true }
            });
        }

        // Map to expected format
        const scenario = {
            id: dbScenario.id,
            title: dbScenario.title,
            marketType: dbScenario.marketType,
            symbol: dbScenario.symbol,
            timeframe: dbScenario.timeframe,
            difficulty: dbScenario.difficulty,
            isPremium: false, // All free now
            description: dbScenario.description || dbScenario.decisionPrompt,
            chartData,
            basePrice: dbScenario.basePrice,
            explanationOutcome: dbScenario.explanationOutcome,
            decisionPrompt: dbScenario.decisionPrompt || "Analyze the context. What is your allocation?",
            eventName: dbScenario.eventName,
            userBalance: portfolio.balance
        };

        return NextResponse.json(scenario);
    } catch (error) {
        console.error('Failed to fetch scenario details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

