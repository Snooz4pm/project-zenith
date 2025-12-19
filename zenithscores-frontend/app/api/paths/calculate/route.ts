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

        // In a real app we'd fetch the user ID from the email if session.user.id is missing
        let userId = session.user.id;
        if (!userId) {
            // Fallback or error. For this implementation plan, I'll assume ID is on session
            // or user needs to query it. 
            // To be safe I should probably fetch the user by email if ID is missing.
            // But I can't import prisma here easily without instantiating it again or importing from a shared lib.
            // `lib/paths_engine.ts` instantiates it. I should maybe export prisma from there or use a singleton.
            // The file `lib/paths_engine.ts` has `const prisma = new PrismaClient()`.
            // I should probably move prisma instantiation to `lib/prisma.ts` singleton in a real app, 
            // but for this file I'll trust `session.user.id` or simple string for now.

            // Actually, I'll just pass session.user.email if that's what's used as ID in this system, 
            // BUT standard is UUID. 
            // Let's look at `AcademyQuiz.tsx`: it sends `user_id: session.user.email`.
            // So the frontend thinks email is the ID.
            // The schema `UserTrait.user_id` is String.
            // If I use email as Foreign Key (logical), it works if consistency is kept.
            // I will use `session.user.email` as the ID for now to match frontend expectation,
            // but strictly speaking it should be the UUID. 
            // Validating `schema.prisma`: `UserTrait` has `user_id` string, no relation defined in the snippet I saw?
            // user_id String @unique.
            // User model: id String @id @default(uuid()).
            // If I store email in `user_id`, it might break strict relations if added later.
            // But for now, I will use what `AcademyQuiz` sends: email.
            userId = session.user.email;
        }

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
