/**
 * Normalize Tokens
 * 
 * Converts ANY raw API data into safe TokenUI array.
 * NEVER throws. Always returns valid array.
 * 
 * - No address
 * - No mint  
 * - No assumptions
 * - Index-based ID (crash-proof)
 */

import { TokenUI } from './tokenUI';

export function normalizeTokens(raw: any): TokenUI[] {
    if (!Array.isArray(raw)) return [];

    const out: TokenUI[] = [];

    for (let i = 0; i < raw.length; i++) {
        const t = raw[i];

        // Skip null, undefined, primitives
        if (!t || typeof t !== 'object') continue;

        const symbol = typeof t.symbol === 'string' ? t.symbol : 'UNKNOWN';
        const name = typeof t.name === 'string' ? t.name : 'Unknown token';

        out.push({
            id: `${symbol}-${i}`, // Index-based, CRASH-PROOF
            symbol,
            name,
        });
    }

    return out;
}
