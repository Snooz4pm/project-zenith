import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                todayPnL: 0,
                winRate: 0,
                streak: 0,
            });
        }

        // UTC-safe "today"
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // First get user's portfolios
        const portfolios = await prisma.portfolio.findMany({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (portfolios.length === 0) {
            return NextResponse.json({
                todayPnL: 0,
                winRate: 0,
                streak: 0,
            });
        }

        const portfolioIds = portfolios.map(p => p.id);

        // Get today's trades from user's portfolios
        const trades = await prisma.trade.findMany({
            where: {
                portfolioId: { in: portfolioIds },
                timestamp: { gte: today },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        if (trades.length === 0) {
            return NextResponse.json({
                todayPnL: 0,
                winRate: 0,
                streak: 0,
            });
        }

        // Calculate P&L from realized trades (SELL trades have realizedPnL)
        const sellTrades = trades.filter(t => t.side === 'SELL' && t.realizedPnL !== null);

        const todayPnL = sellTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
        const winningTrades = sellTrades.filter(t => (t.realizedPnL || 0) > 0).length;
        const winRate = sellTrades.length > 0
            ? Math.round((winningTrades / sellTrades.length) * 100)
            : 0;

        // Streak: consecutive wins from most recent
        let streak = 0;
        for (const t of sellTrades) {
            if ((t.realizedPnL || 0) > 0) streak++;
            else break;
        }

        return NextResponse.json({
            todayPnL: Math.round(todayPnL * 100) / 100,
            winRate,
            streak,
        });
    } catch (error) {
        console.error('Performance API error:', error);
        return NextResponse.json({
            todayPnL: 0,
            winRate: 0,
            streak: 0,
        });
    }
}
