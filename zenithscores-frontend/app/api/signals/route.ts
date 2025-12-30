import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // TODO: Implement when Signal model is added to schema
        // For now, return empty array to prevent 404 errors
        const signals: any[] = [];

        return NextResponse.json({ signals });
    } catch (error) {
        console.error('[API] Failed to fetch signals:', error);
        return NextResponse.json({ signals: [] });
    }
}
