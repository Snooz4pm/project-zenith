import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { calculateQuizTraits, calculatePathScores, calculateTraitsFromTrading, UserTraits } from '@/lib/paths_engine';
import { generateMockTradingSignals } from '@/lib/mock-trading-signals';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.email;
        const body = await request.json();
        const { quizId, quizPerformance } = body;

        console.log('🔄 Processing quiz completion:', { userId, quizId });

        // 1. Calculate traits from this quiz
        const quizTraits = calculateQuizTraits({
            accuracy: quizPerformance.score || 0,
            avgTimePerQuestion: quizPerformance.timeTaken / (quizPerformance.questionCount || 10),
            difficulty: quizPerformance.difficulty || 3,
            answerChanges: quizPerformance.answerChanges || 0,
            repeatedMistakes: quizPerformance.repeatedMistakes || 0
        });

        console.log('📊 Quiz traits calculated:', quizTraits);

        // 2. Get existing traits or create new
        const existingTraits = await prisma.userTrait.findUnique({
            where: { user_id: userId }
        });

        // 3. Merge traits (average with existing)
        const mergedTraits: UserTraits = existingTraits ? {
            analytical_depth: Math.round((existingTraits.analytical_depth + (quizTraits.analytical_depth || 0)) / 2),
            risk_discipline: Math.round((existingTraits.risk_discipline + (quizTraits.risk_discipline || existingTraits.risk_discipline)) / 2),
            adaptability: Math.round((existingTraits.adaptability + (quizTraits.adaptability || 0)) / 2),
            consistency: Math.round((existingTraits.consistency + (quizTraits.consistency || 0)) / 2),
            emotional_stability: Math.round((existingTraits.emotional_stability + (quizTraits.emotional_stability || 0)) / 2),
            calibration_confidence: Math.min(100, existingTraits.calibration_confidence + (quizTraits.calibration_confidence || 15))
        } : {
            analytical_depth: quizTraits.analytical_depth || 50,
            risk_discipline: quizTraits.risk_discipline || 50,
            adaptability: quizTraits.adaptability || 50,
            consistency: quizTraits.consistency || 50,
            emotional_stability: quizTraits.emotional_stability || 50,
            calibration_confidence: 60 // First quiz gives initial calibration
        };

        console.log('🔀 Merged traits:', mergedTraits);

        // 4. Save to database
        await prisma.userTrait.upsert({
            where: { user_id: userId },
            update: mergedTraits,
            create: {
                user_id: userId,
                ...mergedTraits
            }
        });

        // 5. Generate mock trading signals for now (replace with real later)
        const mockSignals = generateMockTradingSignals(userId, 10);
        const tradingTraits = calculateTraitsFromTrading(mockSignals);

        // 6. Calculate path scores with both quiz and trading data
        const pathScores = calculatePathScores(mergedTraits, tradingTraits);

        console.log('🎯 Path scores calculated:', pathScores);

        // 7. Save path scores to database
        for (const [pathId, score] of Object.entries(pathScores)) {
            await prisma.userPathScore.upsert({
                where: {
                    user_id_path_id: {
                        user_id: userId,
                        path_id: pathId
                    }
                },
                update: {
                    score,
                    confidence: mergedTraits.calibration_confidence
                },
                create: {
                    user_id: userId,
                    path_id: pathId,
                    score,
                    confidence: mergedTraits.calibration_confidence
                }
            });
        }

        return NextResponse.json({
            success: true,
            pathScores,
            calibration: mergedTraits.calibration_confidence
        });

    } catch (error) {
        console.error('❌ Error updating paths:', error);
        return NextResponse.json(
            { error: 'Failed to update paths' },
            { status: 500 }
        );
    }
}
