import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
        const close = price + change;
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

        // Fetch from database
        const dbScenario = await prisma.decisionScenario.findUnique({
            where: { id }
        });

        if (!dbScenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // Use database chart data or generate synthetic if missing
        let chartData = dbScenario.chartData;
        if (!chartData || (Array.isArray(chartData) && chartData.length === 0)) {
            chartData = generateSyntheticData(dbScenario.basePrice || 1000, 100);
        }

        // Get user's portfolio balance
        const portfolio = await prisma.portfolio.findUnique({
            where: { userId: session.user.id },
            select: { balance: true }
        });

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
            userBalance: portfolio?.balance || 50000
        };

        return NextResponse.json(scenario);
    } catch (error) {
        console.error('Failed to fetch scenario details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

