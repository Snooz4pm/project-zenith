/**
 * Wallet Auth API - Simple wallet-based authentication
 * 
 * NO NextAuth. NO sessions. NO providers.
 * Identity = Wallet Address. Verified via signature.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { walletAddress, signature, message } = body;

        // Validate required fields
        if (!walletAddress || !signature || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: walletAddress, signature, message' },
                { status: 400 }
            );
        }

        // Verify the signature
        try {
            const publicKey = new PublicKey(walletAddress);
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = bs58.decode(signature);

            const isValid = nacl.sign.detached.verify(
                messageBytes,
                signatureBytes,
                publicKey.toBytes()
            );

            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid signature' },
                    { status: 401 }
                );
            }
        } catch (e) {
            console.error('[Wallet Auth] Signature verification failed:', e);
            return NextResponse.json(
                { error: 'Signature verification failed' },
                { status: 401 }
            );
        }

        // Upsert user - create if doesn't exist, return if does
        const user = await prisma.user.upsert({
            where: { walletAddress },
            update: {}, // No update needed on re-auth
            create: {
                walletAddress,
                profile: { create: {} } // Create empty profile
            },
            include: {
                profile: true
            }
        });

        console.log('[Wallet Auth] User authenticated:', user.id);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                username: user.username,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('[Wallet Auth] Error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

/**
 * GET - Resolve wallet to user (no signature needed for read)
 */
export async function GET(req: NextRequest) {
    const walletAddress = req.nextUrl.searchParams.get('wallet');

    if (!walletAddress) {
        return NextResponse.json(
            { error: 'wallet parameter required' },
            { status: 400 }
        );
    }

    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress },
            include: {
                profile: true
            }
        });

        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                username: user.username,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('[Wallet Auth] Error:', error);
        return NextResponse.json(
            { error: 'Failed to resolve wallet' },
            { status: 500 }
        );
    }
}
