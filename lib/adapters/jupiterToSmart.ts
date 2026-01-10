/**
 * Jupiter to Smart Token Adapter
 * 
 * This is the most important file in the whole feature.
 * Converts raw Jupiter token to SmartToken.
 * 
 * - No logo
 * - No IPFS
 * - No optional chaining in UI
 * - If token is invalid → dropped
 */

import { SmartToken } from '@/types/SmartToken';

export function jupiterToSmart(raw: any, index: number): SmartToken | null {
    if (!raw || typeof raw !== 'object') return null;

    // Get mint/address - either field name works
    const mint =
        typeof raw.address === 'string'
            ? raw.address
            : typeof raw.mint === 'string'
                ? raw.mint
                : null;

    if (!mint) return null;

    return {
        id: mint, // stable, no index keys
        symbol: typeof raw.symbol === 'string' ? raw.symbol : 'UNKNOWN',
        name: typeof raw.name === 'string' ? raw.name : 'Unknown token',
        mint,
    };
}

/**
 * Batch convert array of raw tokens
 */
export function jupiterArrayToSmart(rawTokens: any[]): SmartToken[] {
    if (!Array.isArray(rawTokens)) return [];

    return rawTokens
        .map((t, i) => jupiterToSmart(t, i))
        .filter((t): t is SmartToken => t !== null);
}
