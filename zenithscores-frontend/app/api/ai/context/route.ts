
import { NextResponse } from 'next/server';
import { generateMarketContext, MarketContextRequest } from '@/lib/ai/gemini';

export async function POST(req: Request) {
    try {
        const body: MarketContextRequest = await req.json();

        // Basic validation
        if (!body.symbol || !body.regime) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const analysis = await generateMarketContext(body);

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
