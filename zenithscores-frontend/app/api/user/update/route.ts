import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== 'string' || name.trim().length < 1) {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: name.trim(),
                image: body.image || undefined // Update image if provided
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
