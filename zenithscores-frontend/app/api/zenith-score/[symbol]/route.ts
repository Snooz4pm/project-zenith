
import { NextResponse } from 'next/server';
import { ZenithScoreCalculator, DEFAULT_CONFIG } from '@/lib/algorithm/zenith-score';

export async function GET(
    request: Request,
    { params }: { params: { symbol: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const assetType = searchParams.get('type') as 'stock' | 'crypto' | 'forex' || 'stock';
        // recalculate param is optional, defaults to false (cached)
        const forceRecalculate = searchParams.get('recalculate') === 'true';

        // Create calculator
        // TODO: Pass forceRecalculate to calculator if implemented, currently it checks cache internally
        const calculator = new ZenithScoreCalculator(params.symbol, assetType, DEFAULT_CONFIG);

        // Calculate score
        const result = await calculator.calculateFinalScore();

        return NextResponse.json({
            success: true,
            symbol: params.symbol,
            score: result.score,
            breakdown: result.breakdown,
            confidence: result.confidence,
            lastUpdated: result.lastUpdated,
            interpretation: getScoreInterpretation(result.score)
        });
    } catch (error: any) {
        console.error('Zenith score calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate Zenith Score', details: error.message },
            { status: 500 }
        );
    }
}

function getScoreInterpretation(score: number): {
    label: string;
    color: string;
    description: string;
    recommendation: string;
} {
    if (score >= 90) {
        return {
            label: 'Exceptional',
            color: '#10B981', // emerald
            description: 'Outstanding lifetime performance with excellent risk-adjusted returns',
            recommendation: 'Strong long-term holding candidate'
        };
    } else if (score >= 80) {
        return {
            label: 'Excellent',
            color: '#3B82F6', // blue
            description: 'Very strong historical performance with good consistency',
            recommendation: 'High-conviction investment opportunity'
        };
    } else if (score >= 70) {
        return {
            label: 'Good',
            color: '#8B5CF6', // violet
            description: 'Solid performance with acceptable risk characteristics',
            recommendation: 'Consider for portfolio allocation'
        };
    } else if (score >= 60) {
        return {
            label: 'Fair',
            color: '#F59E0B', // amber
            description: 'Average performance with some volatility concerns',
            recommendation: 'Monitor for improvement before investing'
        };
    } else if (score >= 50) {
        return {
            label: 'Neutral',
            color: '#6B7280', // gray
            description: 'Mixed historical performance with significant volatility',
            recommendation: 'Requires careful analysis before consideration'
        };
    } else if (score >= 40) {
        return {
            label: 'Poor',
            color: '#EF4444', // red
            description: 'Below-average performance with high risk',
            recommendation: 'Avoid unless specific catalyst identified'
        };
    } else {
        return {
            label: 'Very Poor',
            color: '#DC2626', // dark red
            description: 'Consistently poor performance with excessive risk',
            recommendation: 'Avoid completely'
        };
    }
}
