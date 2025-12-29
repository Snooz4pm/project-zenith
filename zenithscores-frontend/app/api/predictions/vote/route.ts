import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/predictions/vote
 * Vote on a prediction (agree/disagree)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { predictionId, vote } = await request.json();

        if (!predictionId || !vote) {
            return NextResponse.json({ error: 'Missing predictionId or vote' }, { status: 400 });
        }

        if (!['AGREE', 'DISAGREE'].includes(vote)) {
            return NextResponse.json({ error: 'Vote must be AGREE or DISAGREE' }, { status: 400 });
        }

        // Check if prediction exists and is active
        const prediction = await prisma.marketPrediction.findUnique({
            where: { id: predictionId }
        });

        if (!prediction) {
            return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
        }

        if (prediction.status !== 'active') {
            return NextResponse.json({ error: 'Cannot vote on resolved predictions' }, { status: 400 });
        }

        if (prediction.authorId === session.user.id) {
            return NextResponse.json({ error: 'Cannot vote on your own prediction' }, { status: 400 });
        }

        // Check for existing vote
        const existingVote = await prisma.predictionVote.findUnique({
            where: {
                predictionId_voterId: {
                    predictionId,
                    voterId: session.user.id
                }
            }
        });

        if (existingVote) {
            // Update vote if different
            if (existingVote.vote === vote) {
                return NextResponse.json({ message: 'Already voted this way' });
            }

            await prisma.$transaction([
                prisma.predictionVote.update({
                    where: { id: existingVote.id },
                    data: { vote }
                }),
                prisma.marketPrediction.update({
                    where: { id: predictionId },
                    data: {
                        agreesCount: vote === 'AGREE'
                            ? { increment: 1 }
                            : { decrement: 1 },
                        disagreesCount: vote === 'DISAGREE'
                            ? { increment: 1 }
                            : { decrement: 1 }
                    }
                })
            ]);

            return NextResponse.json({
                status: 'success',
                action: 'changed',
                message: 'Vote changed'
            });
        }

        // Create new vote
        await prisma.$transaction([
            prisma.predictionVote.create({
                data: {
                    predictionId,
                    voterId: session.user.id,
                    vote
                }
            }),
            prisma.marketPrediction.update({
                where: { id: predictionId },
                data: {
                    agreesCount: vote === 'AGREE' ? { increment: 1 } : undefined,
                    disagreesCount: vote === 'DISAGREE' ? { increment: 1 } : undefined
                }
            })
        ]);

        return NextResponse.json({
            status: 'success',
            action: 'voted',
            message: `Voted ${vote.toLowerCase()}`
        });

    } catch (error) {
        console.error('[VOTE API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
