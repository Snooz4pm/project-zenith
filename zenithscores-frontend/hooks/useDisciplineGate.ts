
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { tracker, TrackingEvent } from '@/lib/gate/tracker';
import { evaluateGate, GateDecision, GateContext } from '@/lib/gate/engine';
import { getDisciplineState, recordGateViolation, attemptGateOverride } from '@/lib/gate/actions';
import { DisciplineState } from '@prisma/client';

export function useDisciplineGate() {
    const [dbState, setDbState] = useState<DisciplineState | null>(null);
    const [localDecision, setLocalDecision] = useState<GateDecision>({ status: 'open', action: 'none' });
    const [isLoaded, setIsLoaded] = useState(false);

    // Prevent spamming server with violation records
    const violationRecordedRef = useRef<boolean>(false);

    // 1. Initial Load & Polling
    const fetchState = useCallback(async () => {
        try {
            const state = await getDisciplineState();
            setDbState(state);
            setIsLoaded(true);
        } catch (e) {
            console.error("Failed to fetch discipline state", e);
        }
    }, []);

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchState]);

    // 2. Evaluation Loop (Runs frequently locally)
    const evaluate = useCallback(() => {
        if (!dbState) return;

        // Build Context from Tracker
        const ctx: GateContext = {
            marketRegime: 'volatile', // TODO: Get from market context
            recentLosses: 0,          // TODO: Get from PnL tracker
            tradesLastHour: tracker.getTradesLastHour(),
            assetSwitchesLast2Min: tracker.getSwitchesLast2Min(),
            sessionDurationMinutes: tracker.getSessionDurationMinutes()
        };

        const decision = evaluateGate(dbState.gateLevel, ctx);
        setLocalDecision(decision);

        // Auto-lock if decision is strict and not already recorded
        if ((decision.status === 'locked') && !violationRecordedRef.current && dbState.currentStatus !== 'locked') {
            violationRecordedRef.current = true;
            // Trip the wire
            recordGateViolation(
                decision.violationType || 'unknown',
                decision.action,
                decision.message || 'Gate Locked',
                { ...ctx, lockDuration: decision.lockDuration }
            ).then(() => {
                fetchState(); // Re-sync to get official lock
                // Reset ref after a delay to allow re-locking if cleared?
                setTimeout(() => { violationRecordedRef.current = false; }, 60000);
            });
        }
    }, [dbState, fetchState]);

    // 3. User Actions
    const trackAction = useCallback((type: TrackingEvent['type'], asset?: string) => {
        tracker.log({
            type,
            asset,
            timestamp: Date.now()
        });
        evaluate();
    }, [evaluate]);

    const override = async (reason: string) => {
        if (!dbState) return;
        await attemptGateOverride(reason, 5); // 5 sec wait hardcoded for now
        await fetchState();
        violationRecordedRef.current = false; // Reset local lock guard
    };

    return {
        // Status
        isLocked: dbState?.currentStatus === 'locked',
        gateLevel: dbState?.gateLevel || 'beginner',
        serverState: dbState,
        localDecision,

        // Actions
        trackAction,
        override,
        refresh: fetchState
    };
}
