/**
 * POST /api/smart-swap/create
 * 
 * Creates a Smart Swap mission from a selected scenario roadmap.
 * User has reviewed scenarios and chosen one to execute.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BrainRoadmap } from '@/types/BrainV2';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            wallet,
            roadmap,
        } = body as {
            wallet: string;
            roadmap: BrainRoadmap;
        };

        if (!wallet || !roadmap) {
            return NextResponse.json({ error: 'Missing wallet or roadmap' }, { status: 400 });
        }

        // Validate roadmap has steps
        if (!roadmap.steps || roadmap.steps.length === 0) {
            return NextResponse.json({ error: 'Roadmap has no steps' }, { status: 400 });
        }

        console.log(`[Create Mission] User: ${wallet}`);
        console.log(`[Create Mission] Scenario: ${roadmap.scenario}`);
        console.log(`[Create Mission] Steps: ${roadmap.steps.length}`);

        // Create Smart Swap mission
        const swap = await (prisma as any).smartSwap.create({
            data: {
                userId: wallet,
                status: 'PLANNED',
                fromToken: roadmap.steps[0].fromToken || '',
                toToken: roadmap.steps[roadmap.steps.length - 1].toToken || '',
                startValueSOL: 0, // Will be set at execution time
                targetValueSOL: 0, // Will be calculated at execution time
                currentStepIndex: 0,
                scenario: roadmap.scenario,
                steps: {
                    create: roadmap.steps.map((step: any, index: number) => ({
                        index,
                        action: step.action,
                        status: 'PLANNED',
                        fromToken: step.fromToken || '',
                        toToken: step.toToken || '',
                        expectedValueSOL: 0, // Intent-based, no amounts
                        minValueSOL: 0, // Will be calculated at execution
                        holdMinutes: step.action === 'HOLD' ? step.holdMinutes : null,
                        holdReason: step.action === 'HOLD' ? step.holdReason : null,
                    }))
                }
            },
            include: {
                steps: true,
            }
        });

        console.log(`[Create Mission] ✅ Created mission: ${swap.id}`);
        console.log(`[Create Mission]   Steps created: ${swap.steps.length}`);

        return NextResponse.json({
            success: true,
            missionId: swap.id,
            status: swap.status,
            currentStep: swap.currentStepIndex,
            totalSteps: swap.steps.length,
        });

    } catch (error: any) {
        console.error('[Create Mission] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create mission' },
            { status: 500 }
        );
    }
}
