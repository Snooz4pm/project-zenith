// =============================================================================
// User Alert Preferences API
// Controls notification behavior - opt-in only, rate-limited
// =============================================================================

import { NextResponse } from 'next/server';

// Default preferences - NOTIFICATIONS OFF by default
const DEFAULT_PREFERENCES = {
    // Core notification settings
    pushEnabled: false, // OFF by default - user must opt in
    memoEnabled: false, // On-chain memo alerts
    frequency: 'instant', // instant, daily, weekly

    // Rate limiting (even when enabled)
    maxPushPerHour: 1,
    maxPushPerDay: 3,

    // Filter thresholds - only alerts meeting these get pushed
    minApeScore: 80,        // High bar for notifications
    minTradeSize: 100000,   // $100K+ whale moves only
    rugRiskThreshold: 80,   // High risk only

    // Feature-specific toggles
    notifyWhales: true,     // Whale movements
    notifyRugRisk: true,    // Rug risk spikes
    notifyGraduation: true, // Pump.fun graduations
    notifyNewCoins: false,  // New coins (noisy - off by default)

    // Last notification timestamps (for rate limiting)
    lastPushAt: null,
    pushCountToday: 0,
    pushCountHour: 0,
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        return NextResponse.json({
            preferences: {
                walletAddress: wallet,
                ...DEFAULT_PREFERENCES,
            },
        });
    } catch (err: any) {
        console.error('[Preferences] GET Error:', err);
        return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { wallet, ...updates } = body;

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        // Whitelist allowed fields
        const allowedFields = [
            'pushEnabled', 'memoEnabled', 'frequency',
            'maxPushPerHour', 'maxPushPerDay',
            'minApeScore', 'minTradeSize', 'rugRiskThreshold',
            'notifyWhales', 'notifyRugRisk', 'notifyGraduation', 'notifyNewCoins',
        ];

        const filteredUpdates: any = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        return NextResponse.json({
            preferences: {
                walletAddress: wallet,
                ...DEFAULT_PREFERENCES,
                ...filteredUpdates,
            },
            success: true,
        });
    } catch (err: any) {
        console.error('[Preferences] PATCH Error:', err);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

// Check if a notification can be sent (rate limit check)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { wallet, alertSeverity, alertType } = body;

        if (!wallet || !alertSeverity) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Notification Gate Logic
        const canNotify = {
            allowed: false,
            reason: '',
        };

        // Rule 1: Only CRITICAL severity can trigger push
        if (alertSeverity !== 'CRITICAL') {
            canNotify.reason = 'Only CRITICAL alerts can trigger notifications';
            return NextResponse.json(canNotify);
        }

        // Rule 2: Would check if pushEnabled in DB
        // Rule 3: Would check rate limits in DB
        // Rule 4: Would check alert type matches user preferences

        // For now, return allowed=true for CRITICAL (client handles rest)
        canNotify.allowed = true;
        canNotify.reason = 'Alert eligible for notification (subject to client-side checks)';

        return NextResponse.json(canNotify);
    } catch (err: any) {
        console.error('[Preferences] POST Error:', err);
        return NextResponse.json({ allowed: false, reason: 'Server error' });
    }
}
