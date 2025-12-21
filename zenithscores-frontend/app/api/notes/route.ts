import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/notes
 * Fetches all trading notes for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const notes = await prisma.tradingNote.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/notes
 * Creates a new trading note for the authenticated user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const {
            content,
            sentiment,
            phase,
            asset,
            stressLevel,
            mood,
            snapshotUrl
        } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const note = await prisma.tradingNote.create({
            data: {
                userId: user.id,
                content,
                sentiment,
                phase,
                asset,
                stressLevel: stressLevel !== undefined ? Number(stressLevel) : 3,
                mood,
                snapshotUrl
            }
        });

        return NextResponse.json({ note });
    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
