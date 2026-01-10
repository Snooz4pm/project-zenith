/**
 * Smart Swap Brain - Pathfinding Engine
 *
 * Discovers executable trading roadmaps through deterministic graph search.
 * Prime Directive: If a path cannot be simulated end-to-end right now, it does not exist.
 */

import { SmartToken } from '@/types/SmartToken';
import { RoadmapCandidate, RoadmapHop, PathfindingConfig } from '@/types/Roadmap';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_PROXY_QUOTE = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL
    ? `${process.env.NEXT_PUBLIC_JUPITER_PROXY_URL}/quote`
    : 'https://jupiter-proxy-production.up.railway.app/quote';

const DEFAULT_CONFIG: PathfindingConfig = {
    maxHops: 3, // SOL → A → B → SOL
    maxSlippagePerHop: 20,
    maxTotalSlippage: 40,
    maxRoundTripLoss: 30,
    topKNeighbors: 5,
    minInputSOL: 0.01, // 0.01 SOL minimum
    validityTTL: 20, // 20 seconds
};

/**
 * Simulate a swap quote via Jupiter
 */
async function simulateSwap(
    fromMint: string,
    toMint: string,
    amount: string
): Promise<any | null> {
    try {
        const params = new URLSearchParams({
            inputMint: fromMint,
            outputMint: toMint,
            amount,
            slippageBps: '50',
        });

        const url = `${JUPITER_PROXY_QUOTE}?${params.toString()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
        });

        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const quote = await response.json();
        if (!quote || !quote.outAmount || quote.outAmount === '0') return null;
        if (!quote.routePlan || quote.routePlan.length === 0) return null;

        return quote;
    } catch {
        return null;
    }
}

/**
 * Calculate Risk-Adjusted Execution ROI (RAROI)
 */
function calculateRAROI(
    inputSOL: number,
    outputSOL: number,
    totalSlippage: number,
    hops: number,
    maxSlippage: number
): { roi: number; confidence: number; riskLevel: 'low' | 'medium' | 'high' } {
    // Raw ROI
    const roi = ((outputSOL - inputSOL) / inputSOL) * 100;

    // Confidence penalties
    let confidence = 1.0;

    // Slippage penalty (0-40% slippage → 0-0.4 penalty)
    const slippagePenalty = Math.min(totalSlippage / 100, 0.4);
    confidence -= slippagePenalty;

    // Hop penalty (each hop beyond 1 reduces confidence by 0.1)
    const hopPenalty = (hops - 1) * 0.1;
    confidence -= hopPenalty;

    // Route fragility penalty (high max slippage = fragile)
    const fragilityPenalty = Math.min(maxSlippage / 50, 0.2);
    confidence -= fragilityPenalty;

    confidence = Math.max(0, Math.min(1, confidence));

    // Risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalSlippage > 25 || hops > 2 || confidence < 0.6) {
        riskLevel = 'high';
    } else if (totalSlippage > 15 || hops > 1 || confidence < 0.8) {
        riskLevel = 'medium';
    }

    return { roi, confidence, riskLevel };
}

/**
 * STEP 1 - Anchor on SOL
 * Find all SAFE tokens reachable from SOL
 */
async function findFirstHopCandidates(
    tokens: SmartToken[],
    inputSOL: number,
    config: PathfindingConfig
): Promise<Array<{ token: SmartToken; quote: any; score: number }>> {
    const inputLamports = Math.floor(inputSOL * 1e9);
    const candidates: Array<{ token: SmartToken; quote: any; score: number }> = [];

    // Only consider SAFE tokens for first hop
    const safeTokens = tokens.filter(t => t.safeTier === 'SAFE' && t.mint !== SOL_MINT);

    console.log(`[Pathfinder] Probing ${safeTokens.length} SAFE tokens from SOL...`);

    for (const token of safeTokens) {
        const quote = await simulateSwap(SOL_MINT, token.mint, inputLamports.toString());
        if (!quote) continue;

        const slippage = quote.priceImpactPct ? Math.abs(parseFloat(quote.priceImpactPct)) : 0;
        if (slippage > config.maxSlippagePerHop) continue;

        // Score: lower slippage = better
        const score = 100 - slippage;
        candidates.push({ token, quote, score });
    }

    // Return top K candidates
    return candidates.sort((a, b) => b.score - a.score).slice(0, config.topKNeighbors);
}

/**
 * STEP 2 - Second Hop Exploration
 * For each candidate A, find tokens reachable from A
 */
async function findSecondHopCandidates(
    fromToken: SmartToken,
    fromQuote: any,
    tokens: SmartToken[],
    config: PathfindingConfig
): Promise<Array<{ token: SmartToken; quote: any; score: number }>> {
    const candidates: Array<{ token: SmartToken; quote: any; score: number }> = [];

    // Consider both SAFE and RANKABLE for second hop
    const eligibleTokens = tokens.filter(
        t =>
            (t.safeTier === 'SAFE' || t.safeTier === 'RANKABLE') &&
            t.mint !== fromToken.mint &&
            t.mint !== SOL_MINT
    );

    const inputAmount = fromQuote.outAmount;

    for (const token of eligibleTokens) {
        const quote = await simulateSwap(fromToken.mint, token.mint, inputAmount);
        if (!quote) continue;

        const slippage = quote.priceImpactPct ? Math.abs(parseFloat(quote.priceImpactPct)) : 0;
        if (slippage > config.maxSlippagePerHop) continue;

        const score = 100 - slippage;
        candidates.push({ token, quote, score });
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, config.topKNeighbors);
}

/**
 * STEP 3 - Close the Loop
 * Simulate final hop back to SOL
 */
async function closeLoop(
    secondHopQuote: any,
    secondToken: SmartToken,
    config: PathfindingConfig
): Promise<any | null> {
    const quote = await simulateSwap(secondToken.mint, SOL_MINT, secondHopQuote.outAmount);
    if (!quote) return null;

    const slippage = quote.priceImpactPct ? Math.abs(parseFloat(quote.priceImpactPct)) : 0;
    if (slippage > config.maxSlippagePerHop) return null;

    return quote;
}

/**
 * MAIN PATHFINDING FUNCTION
 * Discovers all executable roadmaps from SOL → A → B → SOL
 */
export async function findRoadmaps(
    tokens: SmartToken[],
    inputSOL: number = 0.1,
    config: PathfindingConfig = DEFAULT_CONFIG
): Promise<RoadmapCandidate[]> {
    console.log(`[Pathfinder] Starting roadmap discovery with ${inputSOL} SOL`);

    const roadmaps: RoadmapCandidate[] = [];

    // STEP 1: Find first hop candidates (SOL → A)
    const firstHops = await findFirstHopCandidates(tokens, inputSOL, config);
    console.log(`[Pathfinder] Found ${firstHops.length} viable first hops`);

    for (const { token: tokenA, quote: quoteA, score: scoreA } of firstHops) {
        console.log(`[Pathfinder] Exploring ${tokenA.symbol} (score: ${scoreA.toFixed(1)})...`);

        // STEP 2: Find second hop candidates (A → B)
        const secondHops = await findSecondHopCandidates(tokenA, quoteA, tokens, config);
        console.log(`[Pathfinder]   Found ${secondHops.length} second hops from ${tokenA.symbol}`);

        for (const { token: tokenB, quote: quoteB, score: scoreB } of secondHops) {
            // STEP 3: Close the loop (B → SOL)
            const quoteC = await closeLoop(quoteB, tokenB, config);
            if (!quoteC) continue;

            // Calculate metrics
            const outputLamports = parseInt(quoteC.outAmount);
            const outputSOL = outputLamports / 1e9;

            const slippageA = quoteA.priceImpactPct ? Math.abs(parseFloat(quoteA.priceImpactPct)) : 0;
            const slippageB = quoteB.priceImpactPct ? Math.abs(parseFloat(quoteB.priceImpactPct)) : 0;
            const slippageC = quoteC.priceImpactPct ? Math.abs(parseFloat(quoteC.priceImpactPct)) : 0;

            const totalSlippage = slippageA + slippageB + slippageC;
            const maxHopSlippage = Math.max(slippageA, slippageB, slippageC);

            // Safety filters
            if (totalSlippage > config.maxTotalSlippage) continue;

            const roundTripLoss = ((inputSOL - outputSOL) / inputSOL) * 100;
            if (roundTripLoss > config.maxRoundTripLoss && roundTripLoss > 0) continue;

            // Calculate RAROI
            const { roi, confidence, riskLevel } = calculateRAROI(
                inputSOL,
                outputSOL,
                totalSlippage,
                3,
                maxHopSlippage
            );

            // Build hops
            const hops: RoadmapHop[] = [
                {
                    from: 'SOL',
                    to: tokenA.symbol,
                    fromMint: SOL_MINT,
                    toMint: tokenA.mint,
                    inputAmount: (inputSOL * 1e9).toString(),
                    outputAmount: quoteA.outAmount,
                    slippage: slippageA,
                    priceImpact: slippageA,
                    routePlan: quoteA.routePlan,
                },
                {
                    from: tokenA.symbol,
                    to: tokenB.symbol,
                    fromMint: tokenA.mint,
                    toMint: tokenB.mint,
                    inputAmount: quoteA.outAmount,
                    outputAmount: quoteB.outAmount,
                    slippage: slippageB,
                    priceImpact: slippageB,
                    routePlan: quoteB.routePlan,
                },
                {
                    from: tokenB.symbol,
                    to: 'SOL',
                    fromMint: tokenB.mint,
                    toMint: SOL_MINT,
                    inputAmount: quoteB.outAmount,
                    outputAmount: quoteC.outAmount,
                    slippage: slippageC,
                    priceImpact: slippageC,
                    routePlan: quoteC.routePlan,
                },
            ];

            const roadmap: RoadmapCandidate = {
                path: ['SOL', tokenA.symbol, tokenB.symbol, 'SOL'],
                mints: [SOL_MINT, tokenA.mint, tokenB.mint, SOL_MINT],
                simulatedROI: roi,
                confidence,
                riskLevel,
                validFor: config.validityTTL,
                executionReady: true,
                hops,
                totalSlippage,
                maxHopSlippage,
                totalFees: 0, // TODO: extract from route plans
            };

            roadmaps.push(roadmap);

            console.log(
                `[Pathfinder]   ✓ ${roadmap.path.join(' → ')} | ROI: ${roi.toFixed(2)}% | Confidence: ${(confidence * 100).toFixed(0)}%`
            );
        }
    }

    // Sort by risk-adjusted ROI (roi * confidence)
    return roadmaps.sort((a, b) => {
        const scoreA = a.simulatedROI * a.confidence;
        const scoreB = b.simulatedROI * b.confidence;
        return scoreB - scoreA;
    });
}
