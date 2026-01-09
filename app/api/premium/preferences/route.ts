// =============================================================================
// User Alert Preferences API
// =============================================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        let preferences = await prisma.alertPreferences.findUnique({
            where: { walletAddress: wallet },
        });

        // Create default preferences if not exist
        if (!preferences) {
            preferences = await prisma.alertPreferences.create({
                data: {
                    walletAddress: wallet,
                    pushEnabled: true,
                    memoEnabled: false,
                    frequency: 'instant',
                    minApeScore: 70,
                    minTradeSize: 10000,
                    rugRiskThreshold: 60,
                },
            });
        }

        return NextResponse.json({ preferences });
    } catch (err: any) {
        console.error('[Preferences] GET Error:', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { wallet, ...updates } = body;

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        // Only allow specific fields to be updated
        const allowedFields = ['pushEnabled', 'memoEnabled', 'frequency', 'minApeScore', 'minTradeSize', 'rugRiskThreshold'];
        const filteredUpdates: any = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        const preferences = await prisma.alertPreferences.upsert({
            where: { walletAddress: wallet },
            create: {
                walletAddress: wallet,
                ...filteredUpdates,
            },
            update: filteredUpdates,
        });

        return NextResponse.json({ preferences, success: true });
    } catch (err: any) {
        console.error('[Preferences] PATCH Error:', err);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
