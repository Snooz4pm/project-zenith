/**
 * SERVER-ONLY Solana Connection
 * 
 * ⚠️ NEVER import this file in client components
 * ⚠️ This file should ONLY be used in API routes
 * 
 * The RPC URL is NOT prefixed with NEXT_PUBLIC_ so it stays server-side only.
 */

import { Connection } from '@solana/web3.js';

// Server-side only RPC URL (not exposed to browser)
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL
    || (process.env.HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}` : undefined);


// Singleton connection for server-side use
let _serverConnection: Connection | null = null;

export function getServerConnection(): Connection {
    if (!_serverConnection) {
        _serverConnection = new Connection(HELIUS_RPC_URL, {
            commitment: 'confirmed',
        });
    }
    return _serverConnection;
}

export const serverConnection = getServerConnection();
