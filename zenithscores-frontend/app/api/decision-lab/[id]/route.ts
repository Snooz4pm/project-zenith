import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const scenario = await prisma.decisionScenario.findUnique({
            where: { id },
            include: {
                // Include previous attempts for this user to check if they've already played it
                attempts: {
                    where: { userId: session.user.id },
                    select: { choice: true, decidedAt: true }
                }
            }
        });

        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // CRITICAL: Hard fail if chartData is missing/corrupt
        if (!scenario || !scenario.chartData || !Array.isArray(scenario.chartData) || scenario.chartData.length === 0) {
            console.error(`[CRITICAL] Scenario ${id} has corrupt/missing chartData`);
            return NextResponse.json(
                { error: 'Scenario data corruption detected. Please contact support.' },
                { status: 500 }
            );
        }

        // Option A: Simulated Balance (Fast Fix)
        const userBalance = 50000;

        return NextResponse.json({
            ...scenario,
            userBalance: userBalance
        });
    } catch (error) {
        console.error('Failed to fetch scenario details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
