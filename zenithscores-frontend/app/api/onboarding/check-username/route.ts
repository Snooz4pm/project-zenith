import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ available: false, error: 'Username required' }, { status: 400 });
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            }
        });

        return NextResponse.json({ available: !existingUser });
    } catch (error) {
        console.error('Error checking username:', error);
        return NextResponse.json({ available: false, error: 'Database error' }, { status: 500 });
    }
}
