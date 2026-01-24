export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { calculateReality } from '@/lib/argus/realityEngine';

/**
 * GET /api/argus/reality
 * 
 * Query Params:
 * - currentPrice (number)
 * - circulatingSupply (number)
 * - targetPrice (number)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const currentPrice = parseFloat(searchParams.get('currentPrice') || '');
        const circulatingSupply = parseFloat(searchParams.get('circulatingSupply') || '');
        const targetPrice = parseFloat(searchParams.get('targetPrice') || '');

        // 1. Validation
        if (
            isNaN(currentPrice) || currentPrice <= 0 ||
            isNaN(circulatingSupply) || circulatingSupply <= 0 ||
            isNaN(targetPrice) || targetPrice <= 0
        ) {
            return NextResponse.json(
                {
                    error: "Invalid inputs. Parameters 'currentPrice', 'circulatingSupply', and 'targetPrice' must be positive numbers."
                },
                { status: 400 }
            );
        }

        // 2. Calculation
        const analysis = calculateReality(currentPrice, circulatingSupply, targetPrice);

        // 3. Response
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            metrics: analysis,
            parameters: {
                currentPrice,
                circulatingSupply,
                targetPrice
            }
        });

    } catch (error: any) {
        console.error('[API Argus Reality] Error:', error.message);
        return NextResponse.json(
            { error: "Internal Server Error", message: error.message },
            { status: 500 }
        );
    }
}
