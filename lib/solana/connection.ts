'use client';

/**
 * Centralized Solana Connection
 * 
 * Single source of truth for Solana RPC connection.
 * Uses Helius with API key for reliable, rate-limit-free access.
 * 
 * ⚠️ NEVER use api.mainnet-beta.solana.com or random public RPCs
 */

import { Connection } from '@solana/web3.js';

// Helius RPC with API key (REQUIRED for production)
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

if (!HELIUS_API_KEY) {
    console.warn('[Solana Connection] NEXT_PUBLIC_HELIUS_API_KEY not set! Using fallback.');
}

const RPC_URL = HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    : 'https://api.mainnet-beta.solana.com'; // Fallback only for dev

// Singleton connection instance
let connectionInstance: Connection | null = null;

/**
 * Get the shared Solana connection instance
 * Uses Helius RPC with proper configuration
 */
export function getSolanaConnection(): Connection {
    if (!connectionInstance) {
        connectionInstance = new Connection(RPC_URL, {
            commitment: 'confirmed',
            disableRetryOnRateLimit: false,
        });
    }
    return connectionInstance;
}

// Export the singleton for direct import
export const connection = getSolanaConnection();

// Export the RPC URL for debugging
export const SOLANA_RPC_URL = RPC_URL;
