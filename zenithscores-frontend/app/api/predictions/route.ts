import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/predictions
 * Get predictions with filters
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'active';
        const symbol = searchParams.get('symbol');
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = {};

        if (status !== 'all') {
            where.status = status;
        }
        if (symbol) {
            where.symbol = symbol;
        }
        if (userId) {
            where.authorId = userId;
        }

        const predictions = await prisma.marketPrediction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                votes: {
                    select: { voterId: true, vote: true }
                }
            }
        });

        // Get author info for each prediction
        const authorIds = [...new Set(predictions.map(p => p.authorId))];
        const authors = await prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: { id: true, name: true, image: true }
        });
        const authorMap = new Map(authors.map(a => [a.id, a]));

        const enrichedPredictions = predictions.map(p => ({
            id: p.id,
            author: authorMap.get(p.authorId) || { id: p.authorId, name: 'Unknown', image: null },
            symbol: p.symbol,
            assetType: p.assetType,
            direction: p.direction,
            targetPrice: p.targetPrice,
            currentPrice: p.currentPrice,
            deadline: p.deadline,
            thesis: p.thesis,
            confidence: p.confidence,
            agreesCount: p.agreesCount,
            disagreesCount: p.disagreesCount,
            status: p.status,
            finalPrice: p.finalPrice,
            wasCorrect: p.wasCorrect,
            pointsEarned: p.pointsEarned,
            createdAt: p.createdAt,
            resolvedAt: p.resolvedAt,
            votes: p.votes
        }));

        return NextResponse.json({ predictions: enrichedPredictions });

    } catch (error) {
        console.error('[PREDICTIONS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * POST /api/predictions
 * Create a new prediction
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            symbol,
            assetType,
            direction,
            targetPrice,
            currentPrice,
            deadline,
            thesis,
            confidence
        } = body;

        // Validation
        if (!symbol || !direction || !targetPrice || !deadline || !thesis) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['BULLISH', 'BEARISH'].includes(direction)) {
            return NextResponse.json({ error: 'Direction must be BULLISH or BEARISH' }, { status: 400 });
        }

        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return NextResponse.json({ error: 'Deadline must be in the future' }, { status: 400 });
        }

        // Create prediction
        const prediction = await prisma.marketPrediction.create({
            data: {
                authorId: session.user.id,
                symbol: symbol.toUpperCase(),
                assetType: assetType || 'crypto',
                direction,
                targetPrice: parseFloat(targetPrice),
                currentPrice: parseFloat(currentPrice),
                deadline: deadlineDate,
                thesis,
                confidence: Math.min(100, Math.max(1, parseInt(confidence) || 50))
            }
        });

        // Update user stats
        await prisma.userPredictionStats.upsert({
            where: { userId: session.user.id },
            update: {
                totalPredictions: { increment: 1 },
                pendingPredictions: { increment: 1 }
            },
            create: {
                userId: session.user.id,
                totalPredictions: 1,
                pendingPredictions: 1
            }
        });

        return NextResponse.json({
            status: 'success',
            prediction,
            message: 'Prediction created successfully'
        });

    } catch (error) {
        console.error('[PREDICTIONS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
