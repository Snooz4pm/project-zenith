import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { username, experienceLevel } = await req.json();

        // Validate username
        const usernameRegex = /^[a-z0-9_]{3,20}$/;
        if (!username || !usernameRegex.test(username)) {
            return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
        }

        // Check if username is taken (by another user)
        const existingUser = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                },
                NOT: {
                    id: session.user.id
                }
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        // Update user with onboarding data
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                username,
                experienceLevel: experienceLevel || null,
                hasCompletedOnboarding: true,
                calibrationCompleted: true // Also set legacy field for compatibility
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error completing onboarding:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
