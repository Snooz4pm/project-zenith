import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SCENARIOS } from '@/lib/data/decision-scenarios';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Map static scenarios to the expected partial format
        const scenarios = SCENARIOS.map(s => ({
            id: s.id,
            title: `${s.market} - ${s.regime.toUpperCase()}`,
            marketType: s.assetClass,
            symbol: s.market,
            timeframe: s.timeframe,
            difficulty: 'medium', // Default
            isPremium: false,
            source: 'history'
        }));

        return NextResponse.json(scenarios);
    } catch (error) {
        console.error('Failed to fetch scenarios:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
