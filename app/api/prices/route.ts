export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const ids = searchParams.get('ids');

        if (!ids) {
            return NextResponse.json({ data: {} });
        }

        const mints = ids.split(',').filter(m => m.length > 32); // Simple validation

        if (mints.length === 0) {
            return NextResponse.json({ data: {} });
        }

        // Batch requests (Jupiter limit is around 100, but let's be safe with 50)
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < mints.length; i += BATCH_SIZE) {
            batches.push(mints.slice(i, i + BATCH_SIZE));
        }

        const results: Record<string, any> = {};

        // Fetch each batch
        await Promise.all(batches.map(async (batch) => {
            try {
                const batchIds = batch.join(',');
                const res = await fetch(`${JUPITER_PRICE_API}?ids=${batchIds}&showExtraInfo=true`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        Object.assign(results, data.data);
                    }
                }
            } catch (err) {
                console.error('[API Prices] Batch fetch error:', err);
            }
        }));

        return NextResponse.json({
            data: results
        });

    } catch (error: any) {
        console.error('[API Prices] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prices', details: error.message },
            { status: 500 }
        );
    }
}
