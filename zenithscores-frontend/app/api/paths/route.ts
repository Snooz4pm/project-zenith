import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Using email as ID per convention established in this feature
        const userId = session.user.email;

        // Fetch in parallel
        // path_name not on UserPathScore model; frontend resolves display names
        const [traits, pathScores] = await Promise.all([
            prisma.userTrait.findUnique({ where: { user_id: userId } }),
            prisma.userPathScore.findMany({
                where: { user_id: userId },
                orderBy: { score: 'desc' } // Return sorted by score
            })
        ]);

        return NextResponse.json({
            traits: traits || null,
            pathScores: pathScores || []
        });

    } catch (error) {
        console.error('Paths fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
