/**
 * AlphaScan Ingestion - SAFE, READ-ONLY
 *
 * Extracts ONLY mint addresses from AlphaScan.
 * Never trusts names, logos, or ROI numbers.
 * Aggressively guards against malformed data.
 *
 * Hard Rules:
 * - Fetch every 3 minutes max (throttled)
 * - Max 150 candidates per refresh
 * - Deduplicate by mint
 * - Never throw, only return fewer candidates
 */

import { AlphaCandidate, AlphaScanRawToken } from '@/types/AlphaCandidate';

const ALPHASCAN_URL = 'https://cache.jup.ag/tokens/alphascan';
const FETCH_INTERVAL = 3 * 60 * 1000; // 3 minutes (conservative)
const MAX_CANDIDATES = 150; // Hard limit per refresh
const FETCH_TIMEOUT = 5000; // 5 seconds

// In-memory cache (simple, no dependencies)
let lastFetch = 0;
let cachedCandidates: AlphaCandidate[] = [];

/**
 * Validate mint address format (basic Base58 check)
 */
function isValidMint(mint: string): boolean {
    if (typeof mint !== 'string') return false;
    if (mint.length < 32 || mint.length > 44) return false;
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(mint)) return false; // Base58
    return true;
}

/**
 * Extract mint from raw AlphaScan token
 * Returns null if invalid/missing
 */
function extractMint(raw: AlphaScanRawToken): string | null {
    const mint = raw.address || raw.mint;
    if (!mint || !isValidMint(mint)) return null;
    return mint;
}

/**
 * Fetch AlphaScan candidates (with throttling and guards)
 * NEVER throws - returns cached data on error
 */
export async function fetchAlphaCandidates(): Promise<AlphaCandidate[]> {
    const now = Date.now();

    // Throttle: return cached if fetched recently
    if (now - lastFetch < FETCH_INTERVAL) {
        console.log(`[AlphaScan] Using cached candidates (${cachedCandidates.length}), ${Math.floor((FETCH_INTERVAL - (now - lastFetch)) / 1000)}s until refresh`);
        return cachedCandidates;
    }

    try {
        console.log('[AlphaScan] Fetching new candidates...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(ALPHASCAN_URL, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[AlphaScan] HTTP ${response.status} - using cached data`);
            return cachedCandidates; // Return stale cache on error
        }

        const data = await response.json();
        const rawTokens = Array.isArray(data) ? data : [];

        // Extract mints, deduplicate, limit
        const candidates: AlphaCandidate[] = [];
        const seenMints = new Set<string>();

        for (const raw of rawTokens) {
            if (candidates.length >= MAX_CANDIDATES) break;

            const mint = extractMint(raw);
            if (!mint) continue; // Drop silently if invalid
            if (seenMints.has(mint)) continue; // Deduplicate

            seenMints.add(mint);
            candidates.push({
                mint,
                source: 'alphascan',
                discoveredAt: now,
            });
        }

        // Update cache
        lastFetch = now;
        cachedCandidates = candidates;

        console.log(`[AlphaScan] Fetched ${candidates.length} valid candidates (${rawTokens.length} raw tokens)`);
        return candidates;
    } catch (error: any) {
        console.error('[AlphaScan] Fetch error:', error.message || 'Unknown');
        return cachedCandidates; // Return stale cache on error
    }
}

/**
 * Get cached candidates (no network call)
 */
export function getCachedAlphaCandidates(): AlphaCandidate[] {
    return cachedCandidates;
}

/**
 * Merge AlphaScan candidates with existing token list
 * Returns unique mints (existing + new)
 */
export function mergeAlphaCandidates(
    existingMints: string[],
    alphaCandidates: AlphaCandidate[]
): string[] {
    const uniqueMints = new Set(existingMints);

    for (const candidate of alphaCandidates) {
        uniqueMints.add(candidate.mint);
    }

    return Array.from(uniqueMints);
}

/**
 * Get statistics about AlphaScan contribution
 */
export function getAlphaStats(existingMints: string[]): {
    total: number;
    alphaContribution: number;
    cacheAge: number;
} {
    const now = Date.now();
    const alphaMintsSet = new Set(cachedCandidates.map(c => c.mint));
    const alphaContribution = Array.from(alphaMintsSet).filter(
        m => !existingMints.includes(m)
    ).length;

    return {
        total: cachedCandidates.length,
        alphaContribution,
        cacheAge: lastFetch > 0 ? now - lastFetch : 0,
    };
}
