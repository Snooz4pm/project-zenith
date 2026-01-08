// =============================================================================
// Helius Webhook Handler - Receives real-time transaction alerts
// =============================================================================

import { NextResponse } from 'next/server';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@zenithscores.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// In-memory store for push subscriptions (use Redis in production)
const pushSubscriptions = new Map<string, any>();

// Whale threshold in USD
const WHALE_THRESHOLD = 10000;

interface HeliusWebhookPayload {
    type: string;
    timestamp: number;
    signature: string;
    slot: number;
    nativeTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        amount: number;
    }>;
    tokenTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        mint: string;
        tokenAmount: number;
        tokenStandard: string;
    }>;
    accountData?: Array<{
        account: string;
        nativeBalanceChange: number;
        tokenBalanceChanges: any[];
    }>;
}

export async function POST(req: Request) {
    try {
        const payload: HeliusWebhookPayload[] = await req.json();

        if (!Array.isArray(payload)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const alerts: any[] = [];

        for (const tx of payload) {
            // Process token transfers
            if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
                for (const transfer of tx.tokenTransfers) {
                    // Check if this is a significant transfer
                    // In production, you'd look up the token price to calculate USD value
                    const amount = transfer.tokenAmount;

                    // For now, log all transfers (filter by amount in production)
                    console.log(`[Helius] Token transfer: ${amount} of ${transfer.mint}`);

                    alerts.push({
                        type: 'whale_transfer',
                        mint: transfer.mint,
                        from: transfer.fromUserAccount,
                        to: transfer.toUserAccount,
                        amount,
                        signature: tx.signature,
                        timestamp: tx.timestamp,
                    });
                }
            }

            // Process native SOL transfers
            if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
                for (const transfer of tx.nativeTransfers) {
                    const solAmount = transfer.amount / 1e9;

                    // Alert on large SOL transfers (>100 SOL)
                    if (solAmount > 100) {
                        alerts.push({
                            type: 'large_sol_transfer',
                            from: transfer.fromUserAccount,
                            to: transfer.toUserAccount,
                            amount: solAmount,
                            signature: tx.signature,
                            timestamp: tx.timestamp,
                        });
                    }
                }
            }
        }

        // Send push notifications for alerts
        if (alerts.length > 0) {
            await sendAlertNotifications(alerts);
        }

        return NextResponse.json({
            processed: payload.length,
            alerts: alerts.length,
        });
    } catch (err: any) {
        console.error('[Helius Webhook] Error:', err);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function sendAlertNotifications(alerts: any[]) {
    // Get all active push subscriptions
    const subscriptions = Array.from(pushSubscriptions.values());

    for (const alert of alerts) {
        const notification = {
            title: alert.type === 'whale_transfer' ? '🐋 Whale Alert!' : '💰 Large SOL Transfer',
            body: `${alert.amount.toLocaleString()} ${alert.type === 'whale_transfer' ? 'tokens' : 'SOL'} moved`,
            data: {
                url: `https://solscan.io/tx/${alert.signature}`,
            },
        };

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub, JSON.stringify(notification));
            } catch (err) {
                console.error('[Push] Failed to send notification:', err);
                // Remove invalid subscriptions
                if ((err as any).statusCode === 410) {
                    pushSubscriptions.delete(sub.endpoint);
                }
            }
        }
    }
}

// Endpoint to register push subscription
export async function PUT(req: Request) {
    try {
        const { subscription, walletAddress } = await req.json();

        if (!subscription || !walletAddress) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Store subscription
        pushSubscriptions.set(walletAddress, subscription);

        console.log(`[Push] Registered subscription for ${walletAddress}`);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Push] Registration error:', err);
        return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
    }
}
