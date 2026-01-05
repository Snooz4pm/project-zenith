/**
 * Chain Configuration for Trading Arena
 *
 * SOLANA ONLY - Jupiter Swap API
 * 
 * ❌ NO EVM chains (Ethereum, BSC, Base, Arbitrum, Polygon, etc.)
 * ✅ Solana via Jupiter aggregator
 */

/**
 * Solana Chain Configuration
 */
export const SOLANA_CONFIG = {
  chainId: 'solana',
  name: 'Solana',
  shortName: 'SOL',
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  // PRODUCTION RPC - Helius for reliability
  // ❌ DO NOT use api.mainnet-beta.solana.com (rate limited, unreliable)
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  blockExplorerUrl: 'https://solscan.io',
  
  // Jupiter API
  jupiterApiUrl: 'https://quote-api.jup.ag/v6',
  
  // Common tokens
  tokens: {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  },
  
  // Default sell token (SOL)
  defaultSellToken: {
    symbol: 'SOL',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
};

/**
 * ZenithScores Fee Wallet (Solana)
 */
export const SOLANA_FEE_WALLET = process.env.ZENITH_SOL_FEE_RECIPIENT || 
                                  process.env.NEXT_PUBLIC_SOL_FEE_WALLET || 
                                  '';

/**
 * Affiliate fee configuration
 * 50 bps = 0.5% per swap
 */
export const AFFILIATE_FEE_BPS = parseInt(process.env.ZENITH_FEE_BPS || '50');

/**
 * Get Solscan transaction URL
 */
export function getSolscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}

/**
 * Get Solscan address URL
 */
export function getSolscanAddressUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}

/**
 * Check if a chain is supported
 * Only Solana is supported
 */
export function isChainSupported(chainId: string | number): boolean {
  return chainId === 'solana' || chainId === 101; // Solana mainnet
}

// ============================================================
// DEPRECATED EVM CODE BELOW - KEPT FOR REFERENCE ONLY
// ============================================================

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  zeroExApiUrl: string;
  stablecoins: { [key: string]: string };
  defaultSellToken: { symbol: string; address: string; decimals: number };
  tier: 1 | 2;
  dexScreenerSupported: boolean;
}

// Empty - no EVM chains supported
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {};

export function getChainConfig(chainId: number): ChainConfig | null {
  return null; // No EVM chains
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  return ''; // No EVM
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  return ''; // No EVM
}

export function getTier1Chains(): ChainConfig[] {
  return []; // No EVM
}

export function getDexScreenerChains(): ChainConfig[] {
  return []; // No EVM
}

export function getChainPriority(chainId: number): number {
  return 0; // No EVM
}
