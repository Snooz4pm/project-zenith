/**
 * Wallet Auth Helpers for API Routes
 * 
 * Simple utilities to resolve wallet address to user in API routes.
 * No NextAuth. No sessions. Just wallet address verification.
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const prisma = new PrismaClient();

interface AuthResult {
    user: {
        id: string;
        walletAddress: string;
        username: string | null;
    } | null;
    error?: string;
}

/**
 * Get wallet address from request header
 */
export function getWalletFromHeader(req: NextRequest): string | null {
    return req.headers.get('x-wallet-address');
}

/**
 * Resolve wallet address to user (does not create user)
 */
export async function resolveWallet(walletAddress: string | null): Promise<AuthResult> {
    if (!walletAddress) {
        return { user: null, error: 'No wallet address provided' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress },
            select: {
                id: true,
                walletAddress: true,
                username: true
            }
        });

        if (!user) {
            return { user: null, error: 'User not found' };
        }

        return { user };
    } catch (error) {
        console.error('[Auth] Failed to resolve wallet:', error);
        return { user: null, error: 'Database error' };
    }
}

/**
 * Require authenticated user - returns user or throws
 */
export async function requireUser(req: NextRequest): Promise<AuthResult> {
    const walletAddress = getWalletFromHeader(req);
    return resolveWallet(walletAddress);
}

/**
 * Verify a wallet signature (for sensitive operations)
 */
export function verifySignature(
    walletAddress: string,
    signature: string,
    message: string
): boolean {
    try {
        const publicKey = new PublicKey(walletAddress);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);

        return nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKey.toBytes()
        );
    } catch {
        return false;
    }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string) {
    return prisma.user.findUnique({
        where: { walletAddress },
        include: { profile: true }
    });
}

export { prisma };
