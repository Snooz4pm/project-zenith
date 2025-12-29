import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateConversation } from '@/lib/actions/community';

/**
 * POST /api/conversations/direct
 * Gets or creates a direct conversation between the current user and target user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
        }

        if (session.user.id === targetUserId) {
            return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
        }

        const conversation = await getOrCreateConversation(session.user.id, targetUserId);

        return NextResponse.json({
            conversationId: conversation.id,
            status: 'success'
        });

    } catch (error) {
        console.error('[DIRECT CONV API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
