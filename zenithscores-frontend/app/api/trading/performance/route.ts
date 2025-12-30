import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ todayPnL: 0, winRate: 0, streak: 0 });
        }

        // 1. Get User's Portfolio
        const portfolio = await prisma.portfolio.findFirst({
            where: { userId: session.user.id }
        });

        if (!portfolio) {
            return NextResponse.json({ todayPnL: 0, winRate: 0, streak: 0 });
        }

        // 2. UTC-safe "today"
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // 3. Fetch realized trades for today
        const trades = await prisma.trade.findMany({
            where: {
                portfolioId: portfolio.id,
                timestamp: { gte: today },
                side: 'SELL',
                realizedPnL: { not: null },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        if (trades.length === 0) {
            return NextResponse.json({ todayPnL: 0, winRate: 0, streak: 0 });
        }

        const pnls = trades.map(t => t.realizedPnL || 0);
        const todayPnL = pnls.reduce((a, b) => a + b, 0);
        const winningTrades = pnls.filter(pnl => pnl > 0).length;
        const winRate = Math.round((winningTrades / trades.length) * 100);

        // Streak from most recent
        let streak = 0;
        for (const pnl of pnls) {
            if (pnl > 0) streak++;
            else break;
        }

        return NextResponse.json({
            todayPnL: Math.round(todayPnL * 100) / 100,
            winRate,
            streak,
        });
    } catch (error) {
        console.error('Performance API error:', error);
        return NextResponse.json({ todayPnL: 0, winRate: 0, streak: 0 });
    }
}
