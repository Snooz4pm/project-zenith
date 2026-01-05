import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateQuizTraits, updateUserPaths, QuizSignal } from '@/lib/paths_engine';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const walletAddress = (session?.user as any)?.walletAddress;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Identify user by wallet address
        // Prisma `UserTrait` links to `user_id`. `User` table has `id`.

        // Let's parse the body
        const body: QuizSignal = await req.json();

        // Validate body basics
        if (typeof body.accuracy !== 'number' || typeof body.difficulty !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Use wallet address as user identifier
        const userId = walletAddress;

        // Calculate partial traits from this quiz
        const partialTraits = calculateQuizTraits(body);

        // Update DB
        const result = await updateUserPaths(userId, partialTraits);

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Paths calculation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
