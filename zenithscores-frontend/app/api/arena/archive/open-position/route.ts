import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { OpenPositionRequest } from '@/lib/arena/archive/types';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    try {
        const body: OpenPositionRequest = await req.json();
        const { token, tokenAddress, side, sizeUSD, walletAddress, chainId, entryPrice, sizeTokens, txHash } = body;

        // Validate required fields
        if (!token || !tokenAddress || !side || !sizeUSD || !walletAddress || !entryPrice || !sizeTokens) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate side
        if (side !== 'long' && side !== 'short') {
            return NextResponse.json({ error: 'Invalid side. Must be "long" or "short"' }, { status: 400 });
        }

        // Create the position
        const position = await prisma.arenaPosition.create({
            data: {
                walletAddress,
                userId: session?.user?.id || null,
                token,
                tokenAddress,
                chainId: chainId || 1,
                side,
                entryPrice,
                sizeUSD,
                sizeTokens,
                txHash: txHash || null,
                isOpen: true,
            },
        });

        return NextResponse.json({ success: true, position });
    } catch (error) {
        console.error('Error opening position:', error);
        return NextResponse.json({ error: 'Failed to open position' }, { status: 500 });
    }
}
