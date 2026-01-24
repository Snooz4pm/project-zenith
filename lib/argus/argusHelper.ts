/**
 * Argus Frontend Helper
 * Location: @/lib/argus/argusHelper.ts
 */

import { RealityMetrics } from './realityEngine';

export interface ArgusRealityResponse {
    success: boolean;
    timestamp: string;
    metrics: RealityMetrics;
    parameters: {
        currentPrice: number;
        circulatingSupply: number;
        targetPrice: number;
    };
    error?: string;
}

/**
 * Utility to fetch reality analysis from the Argus API.
 */
export async function fetchRealityAnalysis(
    currentPrice: number,
    circulatingSupply: number,
    targetPrice: number
): Promise<ArgusRealityResponse> {
    const params = new URLSearchParams({
        currentPrice: currentPrice.toString(),
        circulatingSupply: circulatingSupply.toString(),
        targetPrice: targetPrice.toString(),
    });

    const res = await fetch(`/api/argus/reality?${params.toString()}`);

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch Argus analysis');
    }

    return res.json();
}
