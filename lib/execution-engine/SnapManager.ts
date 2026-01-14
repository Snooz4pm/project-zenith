import { getJupiterQuote } from '@/lib/solana/jupiter';

export interface SnapCandidate {
    mint: string;
    symbol: string;
    decimals: number;
    priceUSD: number;
    liquidityUSD: number;
    riskScore: number;
    isWhitelisted: boolean;

    // Execution readiness
    routeReady: boolean;
    lastQuoteTs: number;
    expectedOutSOL: number;
    routeSummary?: string;
    quote?: any;
}

export interface SnapPool {
    candidates: SnapCandidate[];
    lastRefresh: number;
    bestCandidate?: SnapCandidate;
}

/**
 * SnapManager 
 * 
 * Pre-arms the survival engine by identifying and caching escape routes
 * BEFORE critical failure hits.
 */
export class SnapManager {

    /**
     * Build or refresh the SNAP pool from available market data
     */
    static async refreshSNAP(
        currentPool: SnapPool | undefined,
        evaluationData: any[],
        positionValueUSD: number,
        solPrice: number,
        uiLogs: string[]
    ): Promise<SnapPool> {
        const now = Date.now();

        if (evaluationData.length === 0) {
            uiLogs.push(`[!! BUG] SnapManager: No market data available for SNAP refresh.`);
            return currentPool || { candidates: [], lastRefresh: now };
        }

        // 1. Brutal Filtering: Find candidate survivors
        const survivors = evaluationData
            .filter(t => {
                const isSafe = this.isBrutallySafe(t, positionValueUSD);
                if (!isSafe && t.liquidityUSD > 50000) {
                    // Log why a semi-liquid token was rejected to help debugging
                    // uiLogs.push(`[SNAP] Skip ${t.symbol}: Brutal filter failed (Liq: $${Math.round(t.liquidityUSD/1000)}k)`);
                }
                return isSafe;
            })
            .sort((a, b) => (b.liquidityUSD || 0) - (a.liquidityUSD || 0))
            .slice(0, 3); // Only track top 3 for SNAP performance

        const newCandidates: SnapCandidate[] = [];

        for (const s of survivors) {
            // Check if we already have a valid quote in current pool
            const existing = currentPool?.candidates.find(c => c.mint === s.mint);

            // If quote is fresh (< 20s) and route is ready, keep it to save API calls
            if (existing && existing.routeReady && (now - existing.lastQuoteTs < 20_000)) {
                newCandidates.push(existing);
                continue;
            }

            // Otherwise, fetch fresh route
            try {
                newCandidates.push({
                    mint: s.mint,
                    symbol: s.symbol,
                    decimals: s.decimals || 6,
                    priceUSD: s.price || 0,
                    liquidityUSD: s.liquidityUSD || 0,
                    riskScore: s.riskLevel === 'LOW' ? 10 : 50,
                    isWhitelisted: ['USDC', 'USDT', 'SOL', 'JUP'].includes(s.symbol),
                    routeReady: false,
                    lastQuoteTs: 0,
                    expectedOutSOL: 0
                });
            } catch (err) {
                uiLogs.push(`[!! BUG] SNAP: Failed to initialize candidate ${s.symbol}`);
            }
        }

        if (newCandidates.length === 0) {
            uiLogs.push(`[SNAP] ⚠ No survivors passed brutal filters (PosSize: $${Math.round(positionValueUSD)})`);
        }

        const pool: SnapPool = {
            candidates: newCandidates,
            lastRefresh: now,
            bestCandidate: newCandidates[0]
        };

        return pool;
    }

    /**
     * Brutal Safety Filter
     * Only the strongest enters the SNAP.
     */
    private static isBrutallySafe(token: any, positionValueUSD: number): boolean {
        const liquidity = token.liquidityUSD || 0;
        const volume = token.volume5m || 0;

        // Hard limits
        if (liquidity < 100_000) return false;      // Min $100k liquidity
        if (liquidity < positionValueUSD * 10) return false; // Depth check (10x size)
        if (token.riskLevel === 'HIGH') return false; // No high risk symbols

        // Whitelist bypasses some checks but still needs liquidity
        const isWhitelisted = ['USDC', 'USDT', 'SOL', 'JUP'].includes(token.symbol);

        return isWhitelisted || (liquidity > 250_000 && volume > 5_000);
    }

    /**
     * Pre-fetch quotes for SNAP candidates
     * This makes execution "ruthless" (deterministic)
     */
    static async preFetchQuotes(
        pool: SnapPool,
        sourceMint: string,
        sourceAmount: number,
        sourceDecimals: number,
        solPrice: number,
        uiLogs: string[]
    ): Promise<void> {
        const now = Date.now();
        const amountRaw = Math.floor(sourceAmount * Math.pow(10, sourceDecimals)).toString();

        for (const candidate of pool.candidates) {
            // Already have a fresh quote? Skip.
            if (candidate.routeReady && (now - candidate.lastQuoteTs < 15_000)) continue;

            try {
                const quote = await getJupiterQuote({
                    inputMint: sourceMint,
                    outputMint: candidate.mint,
                    amount: amountRaw,
                    slippageBps: 100 // Conservative slippage for SNAP
                });

                if (quote) {
                    const grossOut = parseFloat(quote.outAmount) / Math.pow(10, candidate.decimals);
                    const outValueUSD = grossOut * candidate.priceUSD;

                    candidate.quote = quote;
                    candidate.routeReady = true;
                    candidate.lastQuoteTs = now;
                    candidate.expectedOutSOL = outValueUSD / solPrice;
                    candidate.routeSummary = `${quote.routePlan.length} hops to ${candidate.symbol}`;
                } else {
                    uiLogs.push(`[!! BUG] SNAP: Jupiter returned null route for ${candidate.symbol}`);
                }
            } catch (err: any) {
                candidate.routeReady = false;
                uiLogs.push(`[!! BUG] SNAP: Quote failed for ${candidate.symbol} | ${err.message}`);
            }
        }

        // Re-rank best candidate based on expected output
        pool.candidates.sort((a, b) => (b.expectedOutSOL || 0) - (a.expectedOutSOL || 0));
        pool.bestCandidate = pool.candidates.find(c => c.routeReady);
    }
}
