// =============================================================================
// Premium Subscription API - Create subscription after SOL payment + signature
// =============================================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// Pricing in SOL
const PRICES = {
    single: 0.05,
    duo: 0.08,
    all: 0.12,
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            walletAddress,
            paymentTxHash,
            signedMessage,
            signature,
            features,
            amountPaid
        } = body;

        // Validate required fields
        if (!walletAddress || !paymentTxHash || !signedMessage || !signature || !features) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify the signature matches the wallet
        const publicKeyBytes = bs58.decode(walletAddress);
        const messageBytes = new TextEncoder().encode(signedMessage);
        const signatureBytes = bs58.decode(signature);

        const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. Parse the signed message to extract expiry
        // Message format: "I subscribe to Zenith Premium Alerts until [ISO timestamp]"
        const expiryMatch = signedMessage.match(/until (.+)$/);
        if (!expiryMatch) {
            return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
        }

        const expiresAt = new Date(expiryMatch[1]);
        if (isNaN(expiresAt.getTime())) {
            return NextResponse.json({ error: 'Invalid expiry date' }, { status: 400 });
        }

        // 3. Upsert subscription (create or update if renewal)
        const subscription = await prisma.premiumSubscription.upsert({
            where: { walletAddress },
            create: {
                walletAddress,
                expiresAt,
                features: JSON.stringify(features),
                amountPaid: amountPaid || 0.05,
                paymentTxHash,
                signedMessage,
                signature,
                isActive: true,
            },
            update: {
                expiresAt,
                features: JSON.stringify(features),
                amountPaid: amountPaid || 0.05,
                paymentTxHash,
                signedMessage,
                signature,
                isActive: true,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            subscription: {
                walletAddress: subscription.walletAddress,
                expiresAt: subscription.expiresAt,
                features: JSON.parse(subscription.features),
                isActive: subscription.isActive,
            },
        });
    } catch (err: any) {
        console.error('[Subscribe] Error:', err);
        return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
    }
}

// GET - Check subscription status for a wallet
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
        }

        const subscription = await prisma.premiumSubscription.findUnique({
            where: { walletAddress },
        });

        if (!subscription) {
            return NextResponse.json({
                isActive: false,
                hasSubscription: false,
            });
        }

        const now = new Date();
        const isExpired = subscription.expiresAt < now;

        // Auto-deactivate if expired
        if (isExpired && subscription.isActive) {
            await prisma.premiumSubscription.update({
                where: { walletAddress },
                data: { isActive: false },
            });
        }

        return NextResponse.json({
            isActive: !isExpired && subscription.isActive,
            hasSubscription: true,
            expiresAt: subscription.expiresAt,
            features: JSON.parse(subscription.features),
            daysRemaining: isExpired ? 0 : Math.ceil((subscription.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });
    } catch (err: any) {
        console.error('[Subscribe] GET Error:', err);
        return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
    }
}
