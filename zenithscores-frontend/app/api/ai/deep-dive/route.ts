
import { NextResponse } from 'next/server';
import { generateDeepDive, DeepDiveRequest } from '@/lib/ai/gemini_deep';

export async function POST(req: Request) {
    try {
        const body: DeepDiveRequest = await req.json();

        if (!body.symbol) {
            return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
        }

        const report = await generateDeepDive(body);
        return NextResponse.json({ report });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
