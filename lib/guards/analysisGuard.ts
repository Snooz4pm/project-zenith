/**
 * Analysis Guard - Prevents bad page states
 * 
 * PURPOSE:
 * - Hard-block access only when data is missing
 * - Centralize failure behavior (no silent errors)
 * - Single source of truth for access control
 * 
 * ⚠️ NEVER inline this logic in pages
 */

import { redirect } from 'next/navigation';

type GuardInput = {
    isAlgorithmPick: boolean;
    assetId?: string;
} | null;

/**
 * Guards Deep Analysis page access
 * Redirects to /not-available only if data is missing
 */
export function analysisGuard(data: GuardInput): asserts data is NonNullable<GuardInput> {
    // No data at all → redirect
    if (!data) {
        redirect('/not-available');
    }
}

/**
 * Check if asset qualifies for analysis (without redirect)
 * Use this for conditional rendering in lists
 */
export function canAccessAnalysis(data: GuardInput): boolean {
    return data !== null;
}
