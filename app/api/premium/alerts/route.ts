// =============================================================================
// Alerts API - Alert-First, Notification-Optional Architecture
// Alerts are DATA stored in-app. Notifications are OPTIONAL delivery.
// =============================================================================

import { NextResponse } from 'next/server';

// Severity levels determine notification eligibility
type AlertSeverity = 'INFO' | 'SIGNAL' | 'CRITICAL';

// Sample alerts with severity levels
const SAMPLE_ALERTS = [
    {
        id: 'alert-1',
        type: 'whale_buy',
        severity: 'CRITICAL' as AlertSeverity, // Eligible for push
        title: '🐋 Major Whale Activity',
        message: 'Whale wallet bought $150,000 worth of SOL',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: 150000,
        isRead: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'alert-2',
        type: 'new_coin',
        severity: 'SIGNAL' as AlertSeverity, // In-app only
        title: '🆕 High Score Token Detected',
        message: 'New token with Ape Score 85 detected',
        tokenMint: null,
        apeScore: 85,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'alert-3',
        type: 'rug_risk',
        severity: 'CRITICAL' as AlertSeverity, // Eligible for push
        title: '🚨 Rug Risk Spike',
        message: 'Token in your watchlist risk increased to 85%',
        tokenMint: null,
        riskScore: 85,
        isRead: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        id: 'alert-4',
        type: 'pump_graduation',
        severity: 'CRITICAL' as AlertSeverity, // Eligible for push
        title: '🎓 Pump.fun Graduation Imminent',
        message: 'Token at 95% bonding - about to graduate!',
        tokenMint: null,
        bondingProgress: 95,
        isRead: false,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
        id: 'alert-5',
        type: 'price_spike',
        severity: 'SIGNAL' as AlertSeverity, // In-app only
        title: '📈 Volume Spike Detected',
        message: 'Token volume increased 500% in 1 hour',
        tokenMint: null,
        isRead: false,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
        id: 'alert-6',
        type: 'new_listing',
        severity: 'INFO' as AlertSeverity, // In-app only, never push
        title: '📋 New Token Listed',
        message: 'New Solana token added to discovery',
        tokenMint: null,
        isRead: true, // Already read
        createdAt: new Date(Date.now() - 18000000).toISOString(),
    },
];

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');
        const severity = searchParams.get('severity'); // Optional filter

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        // Filter by severity if requested
        let alerts = SAMPLE_ALERTS;
        if (severity) {
            alerts = alerts.filter(a => a.severity === severity.toUpperCase());
        }

        // Count by severity for badge display
        const counts = {
            critical: SAMPLE_ALERTS.filter(a => a.severity === 'CRITICAL' && !a.isRead).length,
            signal: SAMPLE_ALERTS.filter(a => a.severity === 'SIGNAL' && !a.isRead).length,
            info: SAMPLE_ALERTS.filter(a => a.severity === 'INFO' && !a.isRead).length,
        };

        return NextResponse.json({
            alerts,
            total: alerts.length,
            unread: alerts.filter(a => !a.isRead).length,
            counts, // For badge display: "2 critical, 1 signal"
        });
    } catch (err: any) {
        console.error('[Alerts] GET Error:', err);
        return NextResponse.json({ alerts: SAMPLE_ALERTS, total: SAMPLE_ALERTS.length, unread: 5 });
    }
}

// Mark alerts as read
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { alertIds, markAll } = body;

        // In production: update database
        // For now: return success (client handles in localStorage)
        return NextResponse.json({
            success: true,
            marked: markAll ? 'all' : alertIds?.length || 0,
        });
    } catch (err: any) {
        console.error('[Alerts] PATCH Error:', err);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

// Create new alert (internal use for background jobs)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { walletAddress, type, severity, title, message, tokenMint, metadata } = body;

        if (!walletAddress || !type || !severity || !title || !message) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Validate severity
        if (!['INFO', 'SIGNAL', 'CRITICAL'].includes(severity)) {
            return NextResponse.json({ error: 'Invalid severity' }, { status: 400 });
        }

        const alert = {
            id: `alert-${Date.now()}`,
            type,
            severity,
            title,
            message,
            tokenMint,
            metadata,
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        // NOTE: Push notification is NOT sent here
        // It's handled by a separate notification gate on the client
        // Only CRITICAL alerts are eligible, and only if user opted in

        return NextResponse.json({ alert, success: true });
    } catch (err: any) {
        console.error('[Alerts] POST Error:', err);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

// Clear all alerts
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        return NextResponse.json({ success: true, cleared: true });
    } catch (err: any) {
        console.error('[Alerts] DELETE Error:', err);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
