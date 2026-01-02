import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClosePositionRequest } from '@/lib/arena/types';
import { calculateRealizedPnL } from '@/lib/arena/pnl';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    try {
        const body: ClosePositionRequest = await req.json();
        const { positionId, exitPrice, closeTxHash } = body;

        if (!positionId || exitPrice === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find the position
        const position = await prisma.arenaPosition.findUnique({
            where: { id: positionId },
        });

        if (!position) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        if (!position.isOpen) {
            return NextResponse.json({ error: 'Position is already closed' }, { status: 400 });
        }

        // Verify ownership if user is logged in
        if (session?.user?.id && position.userId && position.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Calculate realized PnL
        const realizedPnL = calculateRealizedPnL(position as any, exitPrice);

        // Update the position
        const updatedPosition = await prisma.arenaPosition.update({
            where: { id: positionId },
            data: {
                isOpen: false,
                closedAt: new Date(),
                exitPrice,
                realizedPnL,
                closeTxHash: closeTxHash || null,
            },
        });

        return NextResponse.json({ success: true, position: updatedPosition });
    } catch (error) {
        console.error('Error closing position:', error);
        return NextResponse.json({ error: 'Failed to close position' }, { status: 500 });
    }
}
