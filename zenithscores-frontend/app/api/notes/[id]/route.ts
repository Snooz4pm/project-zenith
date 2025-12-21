import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/notes/[id]
 * Deletes a specific trading note
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const noteId = parseInt(params.id);
        if (isNaN(noteId)) {
            return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
        }

        // Verify the note belongs to the user
        const note = await prisma.tradingNote.findUnique({
            where: { id: noteId }
        });

        if (!note) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        if (note.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.tradingNote.delete({
            where: { id: noteId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
