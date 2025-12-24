import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await req.json();

        // Validate calibration data
        const {
            riskTolerance,
            timeHorizon,
            analysisStyle,
            patienceLevel,
            learningBias,
            userArchetype
        } = data;

        // Validate ranges
        if (riskTolerance !== undefined && (riskTolerance < 1 || riskTolerance > 10)) {
            return NextResponse.json(
                { error: 'riskTolerance must be between 1 and 10' },
                { status: 400 }
            );
        }

        if (patienceLevel !== undefined && (patienceLevel < 1 || patienceLevel > 10)) {
            return NextResponse.json(
                { error: 'patienceLevel must be between 1 and 10' },
                { status: 400 }
            );
        }

        if (learningBias !== undefined && (learningBias < 1 || learningBias > 10)) {
            return NextResponse.json(
                { error: 'learningBias must be between 1 and 10' },
                { status: 400 }
            );
        }

        // Upsert preferences
        const preferences = await prisma.userPreferences.upsert({
            where: { userId: session.user.id },
            update: {
                riskTolerance,
                timeHorizon,
                analysisStyle,
                patienceLevel,
                learningBias,
                userArchetype,
                updatedAt: new Date()
            },
            create: {
                userId: session.user.id,
                riskTolerance,
                timeHorizon,
                analysisStyle,
                patienceLevel,
                learningBias,
                userArchetype
            }
        });

        return NextResponse.json({
            success: true,
            preferences: {
                riskTolerance: preferences.riskTolerance,
                userArchetype: preferences.userArchetype,
                isCalibrated: !!preferences.userArchetype
            }
        });

    } catch (error) {
        console.error('Error saving calibration:', error);
        return NextResponse.json(
            { error: 'Failed to save calibration data' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                preferences: null,
                isCalibrated: false
            });
        }

        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
            select: {
                riskTolerance: true,
                timeHorizon: true,
                analysisStyle: true,
                patienceLevel: true,
                learningBias: true,
                userArchetype: true,
                defaultView: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            preferences,
            isCalibrated: !!preferences?.userArchetype
        });

    } catch (error) {
        console.error('Error fetching preferences:', error);
        return NextResponse.json(
            { error: 'Failed to fetch preferences' },
            { status: 500 }
        );
    }
}
