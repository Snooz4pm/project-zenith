import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SCENARIOS } from '@/lib/data/decision-scenarios';

// Helper to generate synthetic chart data so the frontend doesn't struggle
function generateSyntheticData(days: number = 100, trend: number = 0) {
    const data = [];
    let price = 1000;
    const now = Math.floor(Date.now() / 1000);
    const day = 86400;

    // Start from past
    const startTime = now - (days * day);

    for (let i = 0; i < days; i++) {
        const time = startTime + (i * day);
        const volatility = price * 0.02; // 2% daily vol
        const change = (Math.random() - 0.5 + trend) * volatility;

        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        data.push({
            time,
            open,
            high,
            low,
            close
        });

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

        // Find from static file
        const staticScenario = SCENARIOS.find(s => s.id === id);

        if (!staticScenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // Determine trend for synthetic chart based on "regime"
        let trend = 0;
        if (staticScenario.regime === 'trend') trend = 0.2; // Up
        if (staticScenario.regime === 'breakdown') trend = -0.2; // Down
        if (staticScenario.regime === 'chaos') trend = 0; // Volatile

        const syntheticChart = generateSyntheticData(100, trend);

        // Map to expected format
        const scenario = {
            id: staticScenario.id,
            title: `${staticScenario.market} - ${staticScenario.date}`,
            marketType: staticScenario.assetClass,
            symbol: staticScenario.market,
            timeframe: staticScenario.timeframe,
            difficulty: 'medium',
            isPremium: false,
            description: staticScenario.pauseContext,
            chartData: syntheticChart,
            explanationOutcome: `${staticScenario.historicalOutcome}\n\n${staticScenario.behavioralInsight}`,
            decisionPrompt: "Analyze the context. What is your allocation?",
            eventName: staticScenario.id,
            userBalance: 50000
        };

        return NextResponse.json(scenario);
    } catch (error) {
        console.error('Failed to fetch scenario details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
