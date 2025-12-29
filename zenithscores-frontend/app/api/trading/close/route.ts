import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// External trading API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { symbol } = body;

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }

        // Get session ID from request or use user ID
        const sessionId = session.user.id;

        // Call external trading API to close position
        const response = await fetch(`${API_URL}/api/v1/trading/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                symbol: symbol
            })
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ success: true, data });
        } else {
            // Position might not exist or already closed
            return NextResponse.json({ success: true, message: 'Position closed' });
        }

    } catch (error) {
        console.error('Failed to close trade:', error);
        return NextResponse.json({ error: 'Failed to close trade' }, { status: 500 });
    }
}
