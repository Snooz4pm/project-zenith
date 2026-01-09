// =============================================================================
// Tracked Wallets API - Whale Tracking for Premium Users
// =============================================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Default whale wallets to pre-populate
const DEFAULT_WHALES = [
    { address: 'GRd3X5GwvrKvR4i9eD4HJJpvyUQSwEzEL4mZqB9kW8Dq', label: 'Zenith Alpha', isPreset: true },
    { address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', label: 'SOL Whale #1', isPreset: true },
    { address: 'DYw8jCTfwGNfBLpYYxP5RwYfRFq1vqzT3b6wCZPkUc1N', label: 'Smart Money', isPreset: true },
];

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        // Check if user has premium
        const subscription = await prisma.premiumSubscription.findUnique({
            where: { walletAddress: wallet },
        });

        if (!subscription?.isActive || subscription.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Premium required' }, { status: 403 });
        }

        // Get user's tracked wallets
        let trackedWallets = await prisma.trackedWallet.findMany({
            where: { userWallet: wallet },
            orderBy: { createdAt: 'desc' },
        });

        // If no wallets tracked, add defaults
        if (trackedWallets.length === 0) {
            await prisma.trackedWallet.createMany({
                data: DEFAULT_WHALES.map(w => ({
                    userWallet: wallet,
                    trackedAddress: w.address,
                    label: w.label,
                    isPreset: w.isPreset,
                })),
                skipDuplicates: true,
            });

            trackedWallets = await prisma.trackedWallet.findMany({
                where: { userWallet: wallet },
                orderBy: { createdAt: 'desc' },
            });
        }

        return NextResponse.json({
            wallets: trackedWallets,
            total: trackedWallets.length,
        });
    } catch (err: any) {
        console.error('[TrackedWallets] GET Error:', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userWallet, trackedAddress, label } = body;

        if (!userWallet || !trackedAddress) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Check premium
        const subscription = await prisma.premiumSubscription.findUnique({
            where: { walletAddress: userWallet },
        });

        if (!subscription?.isActive) {
            return NextResponse.json({ error: 'Premium required' }, { status: 403 });
        }

        // Check limit (max 10 wallets)
        const count = await prisma.trackedWallet.count({
            where: { userWallet },
        });

        if (count >= 10) {
            return NextResponse.json({ error: 'Max 10 wallets allowed' }, { status: 400 });
        }

        // Add wallet
        const wallet = await prisma.trackedWallet.create({
            data: {
                userWallet,
                trackedAddress,
                label: label || 'Custom Wallet',
                isPreset: false,
            },
        });

        return NextResponse.json({ wallet, success: true });
    } catch (err: any) {
        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'Already tracking this wallet' }, { status: 400 });
        }
        console.error('[TrackedWallets] POST Error:', err);
        return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const userWallet = searchParams.get('wallet');

        if (!id || !userWallet) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        await prisma.trackedWallet.deleteMany({
            where: {
                id,
                userWallet,
            },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[TrackedWallets] DELETE Error:', err);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
