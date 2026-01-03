import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    const wallet = searchParams.get('wallet');
    const status = searchParams.get('status') || 'open'; // 'open', 'closed', 'all'

    if (!wallet && !session?.user?.id) {
        return NextResponse.json({ error: 'Wallet address or authentication required' }, { status: 400 });
    }

    try {
        const whereClause: any = {};

        // Filter by wallet or user
        if (wallet) {
            whereClause.walletAddress = wallet;
        } else if (session?.user?.id) {
            whereClause.userId = session.user.id;
        }

        // Filter by status
        if (status === 'open') {
            whereClause.isOpen = true;
        } else if (status === 'closed') {
            whereClause.isOpen = false;
        }

        const positions = await prisma.arenaPosition.findMany({
            where: whereClause,
            orderBy: { openedAt: 'desc' },
        });

        return NextResponse.json({ positions });
    } catch (error) {
        console.error('Error fetching positions:', error);
        return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
    }
}
