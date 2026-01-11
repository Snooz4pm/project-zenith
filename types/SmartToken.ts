/**
 * SmartToken - Smart Swap's internal token model
 * 
 * This is NOT Jupiter's model.
 * This is Smart Swap's own model.
 * 
 * - id: stable UI key
 * - symbol: display name
 * - name: full name
 * - mint: used ONLY for execution later
 */

export type SmartToken = {
    id: string;
    symbol: string;
    name: string;
    mint: string;
    // SOL valuation data (optional - only present after valuation)
    valueInSOL?: number;      // How much SOL this token is worth (Token → SOL)
    priceImpactPct?: number;  // Price impact percentage (forward)
    hasRoute?: boolean;       // Whether a Jupiter route exists
    decimals?: number;        // Token decimals (needed for proper calculations)
    // Bidirectional safety metrics (STEP 2A/2B)
    canReverse?: boolean;     // Whether SOL → Token → SOL round-trip works
    roundTripLoss?: number;   // Loss percentage on round-trip (e.g., 8 = 8%)
    isSafe?: boolean;         // Passed all safety filters
    safeTier?: 'SAFE' | 'RANKABLE' | 'REJECTED'; // Three-tier system
    // Ranking data (only for RANKABLE tokens)
    alphaRank?: number;       // Relative ranking within RANKABLE tier
    alphaScore?: number;      // Composite score for ranking
    riskReason?: string;      // Why token is risky (for RANKABLE)
    // Phase 3: Tax Detection
    buyTaxBps?: number;       // Estimated buy tax in Basis Points
    sellTaxBps?: number;      // Estimated sell tax in Basis Points
};
