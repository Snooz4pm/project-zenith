import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, scenarioId, symbol, timeframe, userChoice } = body;

        if (!content || !scenarioId || !userChoice) {
            return NextResponse.json({ error: 'Missing required reflection data' }, { status: 400 });
        }

        // Construct strict metadata object
        const metadata = {
            source: 'decision_lab',
            scenarioId,
            symbol: symbol || 'UNKNOWN',
            timeframe: timeframe || 'UNKNOWN',
            userChoice,
            savedAt: new Date().toISOString()
        };

        // Save as a Trading Note
        const note = await prisma.tradingNote.create({
            data: {
                userId: session.user.id,
                content,
                sentiment: userChoice === 'BUY' ? 'Bullish' : userChoice === 'SELL' ? 'Bearish' : 'Neutral',
                asset: symbol,
                phase: 'Post-Analysis',
                metadata: metadata as any // Prisma JSON type
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error('Failed to save reflection:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
