import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isPremiumUser } from '@/lib/subscription';
import { SCENARIOS } from '@/lib/data/decision-scenarios';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check premium status
        const isPremium = await isPremiumUser(session.user.id);

        // Map static scenarios to the expected partial format
        // Free users get only the first 3 scenarios, premium users get all
        const scenarios = SCENARIOS.map((s, index) => ({
            id: s.id,
            title: `${s.market} - ${s.regime.toUpperCase()}`,
            marketType: s.assetClass,
            symbol: s.market,
            timeframe: s.timeframe,
            difficulty: 'medium', // Default
            isPremium: index >= 3, // First 3 are free, rest are premium
            source: 'history',
            locked: !isPremium && index >= 3 // Lock premium scenarios for free users
        }));

        return NextResponse.json({ scenarios, isPremium });
    } catch (error) {
        console.error('Failed to fetch scenarios:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
