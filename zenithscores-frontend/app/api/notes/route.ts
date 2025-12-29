import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/notes
 * Fetches all trading notes for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const asset = searchParams.get('asset');
        const limit = parseInt(searchParams.get('limit') || '50');

        const notes = await prisma.tradingNote.findMany({
            where: {
                userId: session.user.id,
                ...(asset && { asset }),
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 100),
        });

        return NextResponse.json({ status: 'success', data: notes });
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
        console.log('[NOTES API] POST request received');

        const session = await getServerSession(authOptions);
        console.log('[NOTES API] Session:', {
            exists: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        });

        if (!session?.user?.id) {
            console.log('[NOTES API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('[NOTES API] Request body:', body);

        const {
            content,
            sentiment,
            phase,
            asset,
            stressLevel,
            mood,
            snapshotUrl
        } = body;

        if (!content || content.trim().length === 0) {
            console.log('[NOTES API] No content provided');
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        console.log('[NOTES API] Creating note for user:', session.user.id);

        const note = await prisma.tradingNote.create({
            data: {
                userId: session.user.id,
                content: content.trim(),
                sentiment,
                phase,
                asset,
                stressLevel: stressLevel !== undefined ? Number(stressLevel) : 3,
                mood,
                snapshotUrl
            }
        });

        console.log('[NOTES API] Note created successfully:', note.id);

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                type: 'note',
                targetId: note.id.toString(),
                targetType: 'note',
                metadata: { action: 'create' },
            }
        });

        console.log('[NOTES API] Returning success');
        return NextResponse.json({ status: 'success', data: note });
    } catch (error) {
        console.error('[NOTES API] Error creating note:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}

/**
 * DELETE /api/notes?id=X
 * Delete own note only
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
        }

        // Verify ownership
        const note = await prisma.tradingNote.findFirst({
            where: {
                id: parseInt(id),
                userId: session.user.id,
            }
        });

        if (!note) {
            return NextResponse.json(
                { error: 'Note not found or access denied' },
                { status: 404 }
            );
        }

        await prisma.tradingNote.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ status: 'success', message: 'Note deleted' });
    } catch (error) {
        console.error('Notes DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }
}

/**
 * PATCH /api/notes
 * Update own note - manual save
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, content, sentiment, phase, mood, stressLevel } = body;

        if (!id) {
            return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
        }

        // Verify ownership
        const note = await prisma.tradingNote.findFirst({
            where: {
                id: parseInt(id),
                userId: session.user.id,
            }
        });

        if (!note) {
            return NextResponse.json(
                { error: 'Note not found or access denied' },
                { status: 404 }
            );
        }

        const updated = await prisma.tradingNote.update({
            where: { id: parseInt(id) },
            data: {
                ...(content !== undefined && { content: content.trim() }),
                ...(sentiment !== undefined && { sentiment }),
                ...(phase !== undefined && { phase }),
                ...(mood !== undefined && { mood }),
                ...(stressLevel !== undefined && { stressLevel }),
            }
        });

        return NextResponse.json({ status: 'success', data: updated });
    } catch (error) {
        console.error('Notes PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }
}
