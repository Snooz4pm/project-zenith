/**
 * Solana Token Types
 * 
 * Canonical token shape for all discovery sources.
 */

export type SolanaToken = {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;

  // Liquidity aggregated across all pools
  liquidityUsd: number;

  // Sources where this token has pools
  sources: ('raydium' | 'orca')[];

  // Pool addresses for debugging
  poolAddresses: string[];

  // Jupiter route validation
  isSwappable?: boolean;

  // Pool creation time (for "new pairs" filter)
  createdAt?: number;
};

export type TokenListResponse = {
  page: number;
  limit: number;
  total: number;
  tokens: SolanaToken[];
};

// SOL mint address (excluded from results - it's the base currency)
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Common stablecoins (for reference)
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
