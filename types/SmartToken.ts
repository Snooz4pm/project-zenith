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
    valueInSOL?: number;      // How much SOL this token is worth
    priceImpactPct?: number;  // Price impact percentage
    hasRoute?: boolean;       // Whether a Jupiter route exists
    decimals?: number;        // Token decimals (needed for proper calculations)
};
