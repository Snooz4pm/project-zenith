const SOL_MINT = 'So11111111111111111111111111111111111111112';
const FEE_BUFFER = BigInt(5_000_000); // ~0.005 SOL

/**
 * Get maximum swappable amount (fee-safe for SOL, full balance for SPL)
 * Returns base units as bigint
 */
export function getMaxSwappable(token: {
    address: string;
    balanceBase: bigint;
}): bigint {
    if (token.address === SOL_MINT) {
        return token.balanceBase > FEE_BUFFER
            ? token.balanceBase - FEE_BUFFER
            : BigInt(0);
    }
    return token.balanceBase;
}

/**
 * Convert UI amount to base units (works for ALL tokens)
 */
export function uiToBase(amountUi: number, decimals: number): bigint {
    return BigInt(Math.floor(amountUi * Math.pow(10, decimals)));
}

/**
 * Convert base units to UI amount (works for ALL tokens)
 */
export function baseToUi(amountBase: bigint, decimals: number): number {
    return Number(amountBase) / Math.pow(10, decimals);
}

/**
 * Auto-calculate slippage based on amount
 */
export function autoSlippage(amountUi: number): number {
    if (amountUi < 10) return 50;     // 0.5%
    if (amountUi < 1_000) return 75;  // 0.75%
    return 100;                       // 1%
}
