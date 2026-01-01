'use client';

import { useCallback } from 'react';
import { useDisciplineGate } from './useDisciplineGate';
import { recordGateViolation } from '@/lib/gate/actions';

export type PreTradeStatus = 'clear' | 'caution' | 'locked';

export interface PreTradeCheckResult {
    canTrade: boolean;
    status: PreTradeStatus;
    message?: string;
    sizeReduction?: number;
    recommendations?: string[];
    readinessIndex: number;
    applyRecommendation?: () => void;
    proceedAnyway?: () => void;
}

/**
 * Pre-Trade Check Hook
 * 
 * Use this hook before executing any trade to get gate status
 * and recommendations. Integrates with Discipline Gate.
 */
export function usePreTradeCheck(): PreTradeCheckResult {
    const { isLocked, localDecision, trackAction } = useDisciplineGate();

    // Map gate status to pre-trade status
    const mapStatus = (): PreTradeStatus => {
        if (isLocked || localDecision.status === 'locked') return 'locked';
        if (localDecision.status === 'warning') return 'caution';
        return 'clear';
    };

    const status = mapStatus();
    const readinessIndex = localDecision.readinessIndex ?? 100;

    // Apply recommended size reduction
    const applyRecommendation = useCallback(() => {
        trackAction('attempted_trade', undefined);
        console.log('[DisciplineGate] User applied size reduction:', localDecision.sizeReduction);
    }, [trackAction, localDecision.sizeReduction]);

    // Proceed anyway (logged but not blocked) - THIS IS TRACKED FOR ANALYTICS
    const proceedAnyway = useCallback(async () => {
        trackAction('attempted_trade', undefined);

        // Record this as a "proceed_despite_warning" for analytics
        try {
            await recordGateViolation(
                'proceed_despite_warning',
                'warn',
                `User proceeded despite CAUTION: ${localDecision.message}`,
                { readinessIndex, sizeReduction: localDecision.sizeReduction }
            );
        } catch (e) {
            console.error('[DisciplineGate] Failed to record proceed anyway:', e);
        }

        console.log('[DisciplineGate] User proceeded despite warning - logged for analytics');
    }, [trackAction, localDecision.message, readinessIndex, localDecision.sizeReduction]);

    return {
        canTrade: status !== 'locked',
        status,
        message: localDecision.message,
        sizeReduction: localDecision.sizeReduction,
        recommendations: localDecision.recommendations,
        readinessIndex,
        applyRecommendation: status === 'caution' ? applyRecommendation : undefined,
        proceedAnyway: status === 'caution' ? proceedAnyway : undefined
    };
}

/**
 * Pre-Trade Check Component - Inline UI that appears before trade execution
 */
export function PreTradeCheckInline({
    onApply,
    onProceed,
    onCancel
}: {
    onApply?: () => void;
    onProceed?: () => void;
    onCancel?: () => void;
}) {
    const { status, message, sizeReduction, proceedAnyway, applyRecommendation } = usePreTradeCheck();

    if (status === 'clear') return null;

    if (status === 'locked') {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Trading Locked
                </div>
                <p className="text-sm text-gray-400">
                    {message || 'Discipline Gate has temporarily locked trading.'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Please wait for the cooldown to complete.
                </p>
            </div>
        );
    }

    // CAUTION state
    return (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                ⚠ Discipline Gate: CAUTION
            </div>
            <p className="text-sm text-gray-400 mb-3">
                {message || 'Consider the following before trading:'}
            </p>
            {sizeReduction && sizeReduction > 0 && (
                <p className="text-sm text-yellow-400 mb-3">
                    Size reduction recommended: −{sizeReduction}%
                </p>
            )}
            <div className="flex gap-2">
                <button
                    onClick={() => {
                        if (applyRecommendation) applyRecommendation();
                        if (onApply) onApply();
                    }}
                    className="flex-1 py-2 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-sm font-medium text-yellow-400 transition-colors"
                >
                    Apply
                </button>
                <button
                    onClick={() => {
                        if (proceedAnyway) proceedAnyway();
                        if (onProceed) onProceed();
                    }}
                    className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-gray-400 transition-colors"
                >
                    Proceed Anyway
                </button>
            </div>
        </div>
    );
}

export default usePreTradeCheck;
