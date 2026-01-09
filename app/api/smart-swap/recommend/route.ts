/**
 * Smart Swap Recommendations API
 *
 * CRITICAL: This API ONLY provides recommendations
 * - Does NOT execute swaps
 * - Does NOT handle transactions
 * - Does NOT interact with wallets
 * - Only returns analysis and suggestions
 *
 * Swap execution is handled by the existing swap component
 */

import { NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/smart-swap/engine';
import { SmartSwapRequest, RiskMode } from '@/lib/smart-swap/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for recommendations

// Simple in-memory cache to reduce API calls
const recommendationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amountIn, tokenInMint, riskMode, filters } = body;

        // Validation
        if (!amountIn || amountIn <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount. Must be greater than 0.' },
                { status: 400 }
            );
        }

        if (!tokenInMint) {
            return NextResponse.json(
                { error: 'Token input mint is required.' },
                { status: 400 }
            );
        }

        if (!['safe', 'balanced', 'degenerate'].includes(riskMode)) {
            return NextResponse.json(
                { error: 'Invalid risk mode. Must be safe, balanced, or degenerate.' },
                { status: 400 }
            );
        }

        console.log(`[Smart Swap API] Request: ${amountIn} ${tokenInMint} (${riskMode} mode)`);

        // Check cache (include filters in key)
        const cacheKey = `${amountIn}-${tokenInMint}-${riskMode}-${JSON.stringify(filters || {})}`;
        const cached = recommendationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('[Smart Swap API] Returning cached recommendations');
            return NextResponse.json(cached.data);
        }

        // Generate recommendations
        const request: SmartSwapRequest = {
            amountIn,
            tokenInMint,
            riskMode: riskMode as RiskMode,
            filters,
        };

        const recommendations = await generateRecommendations(request);

        // Cache the result
        recommendationCache.set(cacheKey, {
            data: recommendations,
            timestamp: Date.now(),
        });

        console.log(`[Smart Swap API] Returning ${recommendations.recommendations.length} recommendations`);

        return NextResponse.json(recommendations);
    } catch (error: any) {
        console.error('[Smart Swap API] Error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to generate recommendations',
                details: 'An error occurred while analyzing tokens. Please try again.',
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        {
            message: 'Smart Swap Recommendations API',
            version: '1.0.0',
            status: 'operational',
            note: 'This is a recommendation-only API. It does not execute swaps.',
        },
        { status: 200 }
    );
}
