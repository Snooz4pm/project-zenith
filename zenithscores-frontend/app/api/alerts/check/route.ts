/**
 * Alert Checker API
 * 
 * POST - Check all active alerts against current prices and trigger if hit
 * Called periodically by client or cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PriceData {
    symbol: string;
    price: number;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const prices: PriceData[] = body.prices || [];

        if (prices.length === 0) {
            return NextResponse.json({ triggered: [] });
        }

        // Build price lookup map
        const priceMap = new Map<string, number>();
        for (const p of prices) {
            priceMap.set(p.symbol.toUpperCase(), p.price);
        }

        // Find user's active alerts for these symbols
        const symbols = Array.from(priceMap.keys());
        const activeAlerts = await prisma.priceAlert.findMany({
            where: {
                userId: session.user.id,
                status: 'active',
                symbol: { in: symbols }
            }
        });

        const triggeredAlerts: Array<{
            id: string;
            symbol: string;
            targetPrice: number;
            triggeredPrice: number;
            wasCorrect: boolean | null;
            pointsEarned: number;
        }> = [];

        for (const alert of activeAlerts) {
            const currentPrice = priceMap.get(alert.symbol);
            if (!currentPrice) continue;

            const targetPrice = Number(alert.targetPrice);
            const priceAtCreation = Number(alert.priceAtCreation);

            let triggered = false;

            // Check if alert should trigger
            if (alert.direction === 'above' && currentPrice >= targetPrice) {
                triggered = true;
            } else if (alert.direction === 'below' && currentPrice <= targetPrice) {
                triggered = true;
            } else if (alert.direction === 'cross') {
                // Cross in either direction
                if ((priceAtCreation < targetPrice && currentPrice >= targetPrice) ||
                    (priceAtCreation > targetPrice && currentPrice <= targetPrice)) {
                    triggered = true;
                }
            }

            if (triggered) {
                // Calculate if prediction was correct
                let wasCorrect: boolean | null = null;
                let pointsEarned = 10; // Base points for setting alert

                if (alert.predictedDirection) {
                    const priceMoved = currentPrice > priceAtCreation ? 'up' : 'down';
                    wasCorrect = priceMoved === alert.predictedDirection;

                    if (wasCorrect) {
                        pointsEarned += 25; // Bonus for correct prediction

                        // Extra bonus if within predicted timeframe
                        if (alert.expiresAt && new Date() < new Date(alert.expiresAt)) {
                            pointsEarned += 15;
                        }
                    }
                }

                // Update alert to triggered
                await prisma.priceAlert.update({
                    where: { id: alert.id },
                    data: {
                        status: 'triggered',
                        priceAtTrigger: currentPrice,
                        triggeredAt: new Date(),
                        wasCorrect,
                        pointsEarned
                    }
                });

                triggeredAlerts.push({
                    id: alert.id,
                    symbol: alert.symbol,
                    targetPrice,
                    triggeredPrice: currentPrice,
                    wasCorrect,
                    pointsEarned
                });
            }
        }

        // Also check for expired alerts
        await prisma.priceAlert.updateMany({
            where: {
                userId: session.user.id,
                status: 'active',
                expiresAt: { lt: new Date() }
            },
            data: {
                status: 'expired'
            }
        });

        return NextResponse.json({
            triggered: triggeredAlerts,
            checkedCount: activeAlerts.length
        });

    } catch (error) {
        console.error('[Alert Checker API] Error:', error);
        return NextResponse.json({ error: 'Failed to check alerts' }, { status: 500 });
    }
}
