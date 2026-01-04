/**
 * Well-known Solana Token Mints
 * Critical: SOL is wrapped automatically by Jupiter
 */

export const SOLANA_MINTS = {
    // Native SOL (wrapped SOL mint)
    SOL: 'So11111111111111111111111111111111111111112',

    // Stablecoins
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',

    // Note: Use these exact mint addresses for Solana tokens
    // Jupiter will handle wrapping/unwrapping SOL automatically when:
    // - wrapAndUnwrapSol: true is set in swap request
} as const;

export type SolanaMintSymbol = keyof typeof SOLANA_MINTS;
