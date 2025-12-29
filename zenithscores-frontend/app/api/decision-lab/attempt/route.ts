import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { scenarioId, choice, timeToDecisionMs } = body;

        if (!scenarioId || !choice || timeToDecisionMs === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Capture the decision attempt
        // Idempotency: Prisma will throw if [userId, scenarioId] exists due to @@unique constraint
        const attempt = await prisma.decisionAttempt.create({
            data: {
                userId: session.user.id,
                scenarioId,
                choice,
                timeToDecisionMs
            }
        });

        return NextResponse.json(attempt);
    } catch (error: any) {
        // Handle specific Prisma unique constraint violation code
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'You have already attempted this scenario.' },
                { status: 409 }
            );
        }

        console.error('Failed to log decision attempt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
