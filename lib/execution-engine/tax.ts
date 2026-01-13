
/**
 * Smart Swap Tax Detective 🕵️‍♂️
 * 
 * Estimates potential transfer taxes (Buy/Sell) based on 
 * observed Round Trip Loss (RTL) vs expected slippage.
 */

export interface TaxEstimate {
    hasTax: boolean;
    buyTaxBps: number;
    sellTaxBps: number;
    totalTaxBps: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Estimates tax from Round Trip Loss
 * @param roundTripLossPct Total loss % from SOL -> Token -> SOL (e.g. 15.5 for 15.5%)
 * @param baseSlippagePct Expected normal slippage + spread (default 2.0%)
 */
export function estimateTokenTax(roundTripLossPct: number, baseSlippagePct: number = 2.0): TaxEstimate {
    // If loss is within normal bounds (e.g. < 2%), assume 0 tax
    if (roundTripLossPct <= baseSlippagePct) {
        return {
            hasTax: false,
            buyTaxBps: 0,
            sellTaxBps: 0,
            totalTaxBps: 0,
            confidence: 'HIGH'
        };
    }

    // Excess loss is attributed to Tax
    const excessLossPct = roundTripLossPct - baseSlippagePct;
    const totalTaxBps = Math.round(excessLossPct * 100);

    // We assume tax is symmetric (Buy = Sell) unless proved otherwise
    // Many shitcoins have 5/5 or 10/10 taxes.
    const splitTaxBps = Math.round(totalTaxBps / 2);

    return {
        hasTax: true,
        buyTaxBps: splitTaxBps,
        sellTaxBps: splitTaxBps,
        totalTaxBps: totalTaxBps,
        // If exact integer-ish tax (e.g. 5.0% excess), higher confidence
        confidence: isRoughlyInteger(excessLossPct) ? 'HIGH' : 'MEDIUM'
    };
}

function isRoughlyInteger(num: number): boolean {
    const decimal = num % 1;
    return decimal < 0.2 || decimal > 0.8;
}

/**
 * Adjusts Effective Upside based on Tax
 * @param rawUpsidePct The potential upside (e.g. 20%)
 * @param taxBps Total tax (buy + sell) in BPS
 */
export function adjustEffectiveUpside(rawUpsidePct: number, taxBps: number): number {
    const taxPct = taxBps / 100;
    // Effective = Raw * (1 - tax) ?
    // Actually, tax eats into entry and exit.
    // If I buy $100, tax 5% -> $95 invested.
    // Price goes up 20% -> $114 value.
    // Sell, tax 5% -> $108.3.
    // Net profit = $8.3.
    // Without tax: $100 -> $120. Net $20.
    // Real Return % = (1 + Raw) * (1 - buy) * (1 - sell) - 1

    const decimalUpside = rawUpsidePct / 100; // 0.2
    const buyTax = (taxBps / 2) / 10000;
    const sellTax = (taxBps / 2) / 10000;

    const multiplier = (1 + decimalUpside) * (1 - buyTax) * (1 - sellTax);
    const effectiveReturn = multiplier - 1;

    return effectiveReturn * 100; // Back to %
}
