
'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DisciplineState, GateViolation } from "@prisma/client";

export async function getDisciplineState() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { disciplineState: true }
    });

    if (!user) return null;

    // Auto-create if missing
    if (!user.disciplineState) {
        return await prisma.disciplineState.create({
            data: {
                userId: user.id,
                gateLevel: 'beginner', // Default
            }
        });
    }

    return user.disciplineState;
}

export async function recordGateViolation(
    violationType: string,
    severity: string,
    message: string,
    context?: any
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { disciplineState: true }
    });

    if (!user?.disciplineState) throw new Error("No discipline state found");

    // 1. Record Violation
    await prisma.gateViolation.create({
        data: {
            disciplineStateId: user.disciplineState.id,
            violationType,
            severity,
            message,
            contextData: context || {},
        }
    });

    // 2. Update State if Lock
    if (severity === 'hard_lock' || severity === 'soft_lock') {
        const lockDuration = context?.lockDuration || 300; // Default 5m
        const expiresAt = new Date(Date.now() + (lockDuration * 1000));

        await prisma.disciplineState.update({
            where: { id: user.disciplineState.id },
            data: {
                currentStatus: 'locked',
                lockReason: violationType,
                lockExplanation: message,
                lockExpiresAt: expiresAt
            }
        });
    }

    // 3. Inject into Study Workspace (Active Mission)
    // Fetch latest journal (which acts as the mission)
    const latestJournal = await prisma.tradeJournal.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
    });

    if (latestJournal) {
        await prisma.missionUpdate.create({
            data: {
                journalId: latestJournal.id,
                note: `[GATE VIOLATION] ${violationType.toUpperCase()}: ${message}`,
                price: 0,
                source: 'asset_page'
            }
        });
    }

    return { success: true };
}

export async function attemptGateOverride(reason: string, forcedWait: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { disciplineState: true }
    });

    if (!user?.disciplineState) throw new Error("No discipline state found");

    // Only Pro/Expert can override? 
    // For MVP, anyone can override if they wait

    await prisma.gateOverride.create({
        data: {
            disciplineStateId: user.disciplineState.id,
            reason,
            forcedWait
        }
    });

    // Unlock
    await prisma.disciplineState.update({
        where: { id: user.disciplineState.id },
        data: {
            currentStatus: 'open',
            lockReason: null,
            lockExplanation: null,
            lockExpiresAt: null
        }
    });

    return { success: true };
}

/**
 * Get violation logs for the current user
 */
export async function getViolationLogs(limit: number = 20) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { disciplineState: true }
    });

    if (!user?.disciplineState) return [];

    const violations = await prisma.gateViolation.findMany({
        where: { disciplineStateId: user.disciplineState.id },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return violations.map(v => ({
        id: v.id,
        type: v.violationType,
        severity: v.severity,
        message: v.message,
        createdAt: v.createdAt.toISOString(),
        context: v.contextData
    }));
}

/**
 * Get override history for the current user
 */
export async function getOverrideHistory(limit: number = 10) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { disciplineState: true }
    });

    if (!user?.disciplineState) return [];

    const overrides = await prisma.gateOverride.findMany({
        where: { disciplineStateId: user.disciplineState.id },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return overrides.map(o => ({
        id: o.id,
        reason: o.reason,
        forcedWait: o.forcedWait,
        createdAt: o.createdAt.toISOString()
    }));
}

