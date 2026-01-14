/**
 * Jupiter Token Cache (Singleton)
 * 
 * Prevents redundant fetches and 404 spam.
 * Fetch once per process, reuse forever.
 */

import { JupiterToken } from '@/lib/market-observer/JupiterDexMerger';

const JUP_TOKEN_LIST_URL = 'https://token.jup.ag/all';
const JUPITER_PROXY_URL = 'https://jupiter-proxy-production.up.railway.app';

let cachedTokens: JupiterToken[] | null = null;
let lastFetchTs = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Primary fetcher for Jupiter token list
 */
async function fetchPrimaryJupiterList(): Promise<JupiterToken[]> {
    const res = await fetch(JUP_TOKEN_LIST_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Jupiter Primary failed with status ${res.status}`);

    const data = await res.json();
    const tokensArray = Array.isArray(data) ? data : (data.tokens || []);

    return tokensArray.map((t: any) => ({
        mint: t.address || t.mint,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals || 6
    }));
}

/**
 * Fallback fetcher via Railway Proxy
 */
async function fetchProxyJupiterList(): Promise<JupiterToken[]> {
    const res = await fetch(`${JUPITER_PROXY_URL}/tokens`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Jupiter Proxy failed with status ${res.status}`);

    const data = await res.json();
    const tokensArray = Array.isArray(data) ? data : (data.tokens || []);

    return tokensArray.map((t: any) => ({
        mint: t.address || t.mint,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals || 6
    }));
}

/**
 * Public Singleton Accessor
 */
export async function getJupiterTokens(uiLogs?: string[]): Promise<JupiterToken[]> {
    const now = Date.now();

    if (cachedTokens && (now - lastFetchTs < CACHE_TTL_MS)) {
        // Return from memory
        return cachedTokens;
    }

    try {
        const tokens = await fetchPrimaryJupiterList();
        cachedTokens = tokens;
        lastFetchTs = now;
        uiLogs?.push(`[INFRA] Jupiter: Loaded ${tokens.length} tokens from primary API.`);
        return tokens;
    } catch (err: any) {
        uiLogs?.push(`[INFRA] Jupiter primary failed (${err.message}). Using proxy fallback...`);

        try {
            const tokens = await fetchProxyJupiterList();
            cachedTokens = tokens;
            lastFetchTs = now;
            uiLogs?.push(`[INFRA] Jupiter Proxy: Loaded ${tokens.length} tokens.`);
            return tokens;
        } catch (proxyErr: any) {
            uiLogs?.push(`[!! BUG] INFRA: Total Jupiter failure: ${proxyErr.message}`);
            return cachedTokens || []; // Return stale if we have it, else empty
        }
    }
}
