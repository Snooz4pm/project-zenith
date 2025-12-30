import { NextRequest, NextResponse } from 'next/server';
import {
    DexPair,
    NormalizedToken,
    EXECUTION_CHAINS,
    ExecutionChain,
    searchPairs,
    getBoostedTokens,
} from '@/lib/dexscreener';

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest';

// ========== FLOW-SPECIFIC TYPES ==========

interface FlowSection {
    hotNow: NormalizedToken[];
    memeFlow: NormalizedToken[];
    tradeSetups: NormalizedToken[];
}

// ========== MEME DETECTION ==========

const MEME_KEYWORDS = [
    'inu', 'dog', 'doge', 'pepe', 'frog', 'cat', 'wojak', 'shib', 'elon', 'bonk',
    'based', 'mog', 'chad', 'meme', 'moon', 'rocket', 'baby', 'safe', 'floki', 'shiba'
];

function isMemeToken(pair: DexPair): boolean {
    const name = pair.baseToken.name.toLowerCase();
    const symbol = pair.baseToken.symbol.toLowerCase();
    return MEME_KEYWORDS.some(k => name.includes(k) || symbol.includes(k));
}

// ========== CHAIN DISPLAY MAPPING ==========

const CHAIN_DISPLAY: Record<string, string> = {
    ethereum: 'Ethereum',
    base: 'Base',
    arbitrum: 'Arbitrum',
    solana: 'Solana',
    bsc: 'BSC',
};

// ========== NORMALIZATION ==========

function normalizePair(pair: DexPair): NormalizedToken {
    return {
        id: `${pair.chainId}-${pair.pairAddress}`,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        chainId: pair.chainId,
        chainName: CHAIN_DISPLAY[pair.chainId] || pair.chainId.toUpperCase(),
        address: pair.baseToken.address,
        priceUsd: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24hUsd: pair.volume?.h24 || 0,
        pairAddress: pair.pairAddress,
        dexUrl: pair.url,
        isMeme: isMemeToken(pair),
    };
}

// ========== VALIDATION FUNCTIONS (RELAXED FOR FLOW) ==========

/**
 * MINIMAL safety check - only exclude obvious scams
 */
function isObviousHoneypot(pair: DexPair): boolean {
    const buys = pair.txns?.h24?.buys || 0;
    const sells = pair.txns?.h24?.sells || 0;
    // Only flag if there are many buys but ZERO sells
    return buys > 10 && sells === 0;
}

/**
 * Check if token has ANY data at all
 */
function hasMinimalData(pair: DexPair): boolean {
    return !!(
        pair.baseToken?.address &&
        pair.pairAddress &&
        (pair.priceUsd || pair.priceNative)
    );
}

/**
 * HOT NOW - High velocity, recent activity (REVENUE OPTIMIZED)
 */
function isHotNow(pair: DexPair): boolean {
    if (isObviousHoneypot(pair) || !hasMinimalData(pair)) return false;

    const vol1h = pair.volume?.h1 || 0;
    const txns1h = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0);
    const liq = pair.liquidity?.usd || 0;

    // ULTRA LOW thresholds for maximum swaps
    return vol1h > 100 && txns1h > 2 && liq > 1000;
}

/**
 * MEME FLOW - Meme tokens with activity (REVENUE OPTIMIZED)
 */
function isMemeFlowCandidate(pair: DexPair): boolean {
    if (isObviousHoneypot(pair) || !hasMinimalData(pair)) return false;
    if (!isMemeToken(pair)) return false;

    const liq = pair.liquidity?.usd || 0;
    const vol24h = pair.volume?.h24 || 0;

    // ULTRA permissive for meme trading
    return liq > 500 && vol24h > 500;
}

/**
 * TRADE SETUPS - Rising liquidity + momentum (REVENUE OPTIMIZED)
 */
function isTradeSetup(pair: DexPair): boolean {
    if (isObviousHoneypot(pair) || !hasMinimalData(pair)) return false;

    const liq = pair.liquidity?.usd || 0;
    const vol24h = pair.volume?.h24 || 0;
    const change1h = pair.priceChange?.h1 || 0;
    const txns1h = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0);

    // Lower thresholds for more trading opportunities
    return liq > 2000 && vol24h > 1000 && Math.abs(change1h) > 0.5 && txns1h > 3;
}

// ========== SCORING FUNCTIONS ==========

function calculateHotScore(pair: DexPair): number {
    const vol1h = pair.volume?.h1 || 0;
    const txns5m = (pair.txns?.m5?.buys || 0) + (pair.txns?.m5?.sells || 0);
    const change5m = Math.abs(pair.priceChange?.m5 || 0);
    return (vol1h * 10) + (txns5m * 100) + (change5m * 50);
}

function calculateMemeScore(pair: DexPair): number {
    const vol24h = pair.volume?.h24 || 0;
    const txns1h = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0);
    return vol24h + (txns1h * 1000);
}

function calculateTradeScore(pair: DexPair): number {
    const liq = pair.liquidity?.usd || 0;
    const vol1h = pair.volume?.h1 || 0;
    const change1h = Math.abs(pair.priceChange?.h1 || 0);
    return Math.log10(liq + 1) * vol1h * (1 + change1h);
}

// ========== MULTI-CHAIN FETCH WITH FALLBACKS ==========

async function fetchAllChains(): Promise<DexPair[]> {
    const allChains = ['ethereum', 'base', 'arbitrum', 'solana', 'bsc'];
    const allPairs: DexPair[] = [];

    for (const chain of allChains) {
        try {
            const response = await fetch(
                `${DEXSCREENER_BASE_URL}/dex/search?q=${chain}`,
                { next: { revalidate: 30 } }
            );

            if (response.ok) {
                const data = await response.json();
                const pairs = data.pairs || [];
                allPairs.push(...pairs);
            }
        } catch (error) {
            console.error(`Failed to fetch ${chain}:`, error);
        }
    }

    return allPairs;
}

/**
 * Fallback: Get boosted tokens and convert to pairs
 */
async function fetchBoostedAsFallback(): Promise<DexPair[]> {
    try {
        const boosted = await getBoostedTokens();
        const pairs: DexPair[] = [];

        for (const boost of boosted.slice(0, 20)) {
            if (boost.chainId && boost.tokenAddress) {
                try {
                    const searchResults = await searchPairs(boost.tokenAddress);
                    if (searchResults.length > 0) {
                        pairs.push(...searchResults.slice(0, 2));
                    }
                } catch (e) {
                    console.error('Failed to fetch boosted token pair:', e);
                }
            }
        }

        return pairs;
    } catch (error) {
        console.error('Failed to fetch boosted tokens:', error);
        return [];
    }
}

/**
 * Last resort: Get newest pairs from trending
 */
async function fetchNewestPairs(): Promise<DexPair[]> {
    try {
        const response = await fetch(
            `${DEXSCREENER_BASE_URL}/dex/search?q=base`,
            { cache: 'no-store' }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const pairs = data.pairs || [];

        // Sort by creation time (newest first)
        return pairs
            .filter((p: DexPair) => p.pairCreatedAt)
            .sort((a: DexPair, b: DexPair) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))
            .slice(0, 30);
    } catch (error) {
        console.error('Failed to fetch newest pairs:', error);
        return [];
    }
}

// ========== MAIN FLOW ENGINE ==========

async function getFlowTokens(): Promise<FlowSection> {
    let allPairs: DexPair[] = [];

    // STEP 1: Try main source
    console.log('[Flow] Step 1: Fetching from all chains...');
    allPairs = await fetchAllChains();

    // STEP 2: If empty, try boosted tokens
    if (allPairs.length === 0) {
        console.log('[Flow] Step 2: Main source empty, trying boosted tokens...');
        allPairs = await fetchBoostedAsFallback();
    }

    // STEP 3: If still empty, get newest pairs
    if (allPairs.length === 0) {
        console.log('[Flow] Step 3: Still empty, fetching newest pairs...');
        allPairs = await fetchNewestPairs();
    }

    // Filter out duplicates by pair address
    const seenPairs = new Set<string>();
    const uniquePairs = allPairs.filter(p => {
        if (seenPairs.has(p.pairAddress)) return false;
        seenPairs.add(p.pairAddress);
        return true;
    });

    console.log(`[Flow] Total unique pairs: ${uniquePairs.length}`);

    // Categorize tokens
    let hotNowCandidates = uniquePairs.filter(isHotNow);
    let memeFlowCandidates = uniquePairs.filter(isMemeFlowCandidate);
    let tradeSetupCandidates = uniquePairs.filter(isTradeSetup);

    // AGGRESSIVE FALLBACK: If any section is empty, relax filters
    if (hotNowCandidates.length === 0) {
        console.log('[Flow] Hot Now empty, relaxing filters...');
        hotNowCandidates = uniquePairs
            .filter(p => !isObviousHoneypot(p) && hasMinimalData(p))
            .slice(0, 15);
    }

    if (memeFlowCandidates.length === 0) {
        console.log('[Flow] Meme Flow empty, showing any memes...');
        memeFlowCandidates = uniquePairs
            .filter(p => !isObviousHoneypot(p) && hasMinimalData(p) && isMemeToken(p))
            .slice(0, 15);
    }

    if (tradeSetupCandidates.length === 0) {
        console.log('[Flow] Trade Setups empty, showing high volume tokens...');
        tradeSetupCandidates = uniquePairs
            .filter(p => !isObviousHoneypot(p) && hasMinimalData(p) && (p.volume?.h24 || 0) > 1000)
            .slice(0, 15);
    }

    // Sort and limit
    const hotNow = hotNowCandidates
        .sort((a, b) => calculateHotScore(b) - calculateHotScore(a))
        .slice(0, 12)
        .map(normalizePair);

    const memeFlow = memeFlowCandidates
        .sort((a, b) => calculateMemeScore(b) - calculateMemeScore(a))
        .slice(0, 12)
        .map(normalizePair);

    const tradeSetups = tradeSetupCandidates
        .sort((a, b) => calculateTradeScore(b) - calculateTradeScore(a))
        .slice(0, 12)
        .map(normalizePair);

    console.log(`[Flow] Final counts - Hot: ${hotNow.length}, Meme: ${memeFlow.length}, Trade: ${tradeSetups.length}`);

    return { hotNow, memeFlow, tradeSetups };
}

// ========== API ROUTE HANDLER ==========

export async function GET(request: NextRequest) {
    try {
        const flowData = await getFlowTokens();

        return NextResponse.json(flowData, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        console.error('[Flow API] Error:', error);

        // Even on error, return empty arrays (never crash)
        return NextResponse.json({
            hotNow: [],
            memeFlow: [],
            tradeSetups: [],
        });
    }
}
