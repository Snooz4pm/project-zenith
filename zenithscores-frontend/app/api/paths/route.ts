import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculatePathScores, calculateTraitsFromTrading, UserTraits } from '@/lib/paths_engine';
import { generateMockTradingSignals } from '@/lib/mock-trading-signals';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const walletAddress = (session?.user as any)?.walletAddress;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Using wallet address as ID
        const userId = walletAddress;

        // Fetch user traits from DB
        const traits = await prisma.userTrait.findUnique({ where: { user_id: userId } });

        // Generate mock trading signals for launch to demonstrate the system
        const mockSignals = generateMockTradingSignals(userId, 20);
        const tradingTraits = calculateTraitsFromTrading(mockSignals);

        // Calculate dynamic path scores blending quiz traits + trading signals
        // Use default empty traits if user has none
        const safeTraits = (traits as UserTraits) || {
            analytical_depth: 0,
            risk_discipline: 0,
            adaptability: 0,
            consistency: 0,
            emotional_stability: 0,
            calibration_confidence: 0
        };

        const calculatedScores = calculatePathScores(safeTraits, tradingTraits);

        // Convert Record to Array for frontend
        const pathScoresArray = Object.entries(calculatedScores).map(([pathId, score]) => ({
            id: `${userId}-${pathId}`, // Fake ID for frontend key
            user_id: userId,
            path_id: pathId,
            score: score,
            confidence: safeTraits.calibration_confidence,
            rank: 0 // Will be sorted by frontend
        }));

        return NextResponse.json({
            traits: traits || null,
            pathScores: pathScoresArray,
            // Include raw calculated stats for debugging if needed
            tradingStats: tradingTraits
        });

    } catch (error) {
        console.error('Paths fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
