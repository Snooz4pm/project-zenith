import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch Portfolio
        let portfolio = await prisma.portfolio.findUnique({
            where: { userId }
        });

        // Create if not exists (lazy init)
        if (!portfolio) {
            portfolio = await prisma.portfolio.create({
                data: {
                    userId,
                    balance: 50000,
                    totalRealizedPnL: 0
                }
            });
        }

        // Get trade counts
        const totalTrades = await prisma.decisionAttempt.count({
            where: { userId }
        });

        // Get win rate stats if needed later
        /*
        const wins = await prisma.decisionAttempt.count({
            where: { userId, pnl: { gt: 0 } }
        });
        */

        return NextResponse.json({
            balance: portfolio.balance,
            totalPnL: portfolio.totalRealizedPnL,
            totalTrades,
            currency: 'USD'
        });

    } catch (error) {
        console.error('Failed to fetch user portfolio:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
