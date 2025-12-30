import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Trade = {
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    type: 'BUY' | 'SELL';
    createdAt: Date;
};

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

        const trades: Trade[] = await prisma.trade.findMany({
            where: {
                userId: session.user.id,
                createdAt: { gte: today },
                exitPrice: { not: null },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (trades.length === 0) {
            return NextResponse.json({
                todayPnL: 0,
                winRate: 0,
                streak: 0,
            });
        }

        const calcPnL = (t: Trade) =>
            t.type === 'BUY'
                ? (t.exitPrice! - t.entryPrice) * t.quantity
                : (t.entryPrice - t.exitPrice!) * t.quantity;

        const pnls = trades.map(calcPnL);

        const todayPnL = pnls.reduce((a, b) => a + b, 0);

        const winningTrades = pnls.filter(pnl => pnl > 0).length;

        const winRate = Math.round((winningTrades / trades.length) * 100);

        // ✅ TRUE streak: consecutive wins from most recent trade
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
        return NextResponse.json({
            todayPnL: 0,
            winRate: 0,
            streak: 0,
        });
    }
}
