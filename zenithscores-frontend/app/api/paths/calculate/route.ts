import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateQuizTraits, updateUserPaths, QuizSignal } from '@/lib/paths_engine';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Identify user by email (since that's what we have in session usually, 
        // but DB might expect ID. schema user_id is "String @unique" and mapped to email in some places? 
        // Wait, schema says: model UserTrait { user_id String @unique ... }
        // User table: id String @id, email String @unique.
        // Usually user_id refers to User.id.
        // I need to resolve email to ID if simple string isn't the ID.
        // Let's assume session.user.id is available if properly configured, otherwise look up by email.

        // For now, I'll rely on session.user.id if it exists, or look up user.
        // Prisma `UserTrait` links to `user_id`. `User` table has `id`.

        // Let's parse the body
        const body: QuizSignal = await req.json();

        // Validate body basics
        if (typeof body.accuracy !== 'number' || typeof body.difficulty !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Use email as user identifier (consistent with frontend and UserTrait schema)
        const userId = session.user.email;

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
