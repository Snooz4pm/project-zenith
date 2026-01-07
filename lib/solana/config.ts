/**
 * Solana Configuration for Jupiter Swaps
 *
 * REVENUE MODEL: 1% platform fee + 0.1% Jupiter referral = 1.1% TOTAL
 * This is 2.75x MORE than EVM chains!
 */

// Jupiter API Configuration
export const JUPITER_API_KEY = '9734e999-cc55-46e5-ba68-f7def92483aa';
export const JUPITER_API_URL = 'https://api.jup.ag/ultra';

/**
 * YOUR SOLANA WALLET (RECEIVES ALL FEES)
 *
 * CRITICAL: Replace with your actual Solana wallet
 * This wallet receives 1.1% of EVERY swap
 */
export const SOLANA_FEE_WALLET = process.env.NEXT_PUBLIC_SOLANA_FEE_WALLET || 'YOUR_SOLANA_WALLET_ADDRESS';

/**
 * PLATFORM FEE CONFIGURATION
 *
 * Jupiter allows up to 1% platform fee (100 bps)
 * We're maxing it out for maximum revenue!
 */
export const PLATFORM_FEE_BPS = 100; // 1% fee (MAXIMUM allowed)

/**
 * Jupiter also gives referral commission on top of platform fee
 * This is AUTOMATIC - you get ~0.1% extra
 *
 * TOTAL REVENUE: 1% (platform) + 0.1% (referral) = 1.1% per swap
 */

/**
 * Solana RPC Endpoints (Free)
 */
export const SOLANA_RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
};

/**
 * Solana Explorer URLs
 */
export const SOLANA_EXPLORER_URL = 'https://solscan.io';

/**
 * Get explorer URL for transaction
 */
export function getSolanaExplorerTxUrl(signature: string, network: 'mainnet' | 'devnet' = 'mainnet'): string {
  return `${SOLANA_EXPLORER_URL}/tx/${signature}${network === 'devnet' ? '?cluster=devnet' : ''}`;
}

/**
 * Get explorer URL for token
 */
export function getSolanaExplorerTokenUrl(address: string): string {
  return `${SOLANA_EXPLORER_URL}/token/${address}`;
}

/**
 * Native SOL token
 */
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Common Solana tokens (for swapping)
 */
export const COMMON_SOL_TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: SOL_MINT,
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  },
  WIF: {
    symbol: 'WIF',
    name: 'dogwifhat',
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    decimals: 6,
    logo: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link',
  },
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    logo: 'https://static.jup.ag/jup/icon.png',
  },
};

/**
 * Slippage configuration
 */
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5% slippage

/**
 * Minimum SOL balance to keep (for rent + fees)
 */
export const MIN_SOL_BALANCE = 0.01; // Keep 0.01 SOL for fees
