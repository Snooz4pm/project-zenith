
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth'; // Adjust import path if needed

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, asset, sentiment, phase, metadata } = body;

        // Find user by email to get ID (since session usually has email)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const note = await prisma.tradingNote.create({
            data: {
                userId: user.id,
                content,
                asset,
                sentiment,
                phase,
                // Using snapshotUrl field for storing metadata/AI analysis if needed, or append to content
                snapshotUrl: metadata?.aiAnalysis ? 'AI-Context' : null
            }
        });

        return NextResponse.json({ success: true, note });
    } catch (error) {
        console.error('Journal Error:', error);
        return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
    }
}
