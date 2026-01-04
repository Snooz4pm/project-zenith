/**
 * Chain Configuration for Trading Arena
 *
 * BSC ONLY - 0x Swap API with affiliate fee monetization
 * Revenue model: Earn fees on EVERY swap
 * 
 * Supported: Solana (Jupiter) + BSC (0x)
 * ❌ NO Ethereum, Base, Arbitrum, Polygon, Avalanche, etc.
 */

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

  // 0x Swap API endpoint for this chain
  zeroExApiUrl: string;

  // Common stablecoins on this chain (for swapping)
  stablecoins: {
    [key: string]: string;
  };

  // Default "sell token" (what users swap FROM)
  defaultSellToken: {
    symbol: string;
    address: string;
    decimals: number;
  };

  // Chain tier (prioritization)
  tier: 1 | 2; // Tier 1 = primary revenue, Tier 2 = expandable

  // DexScreener support
  dexScreenerSupported: boolean;
}

/**
 * ZenithScores Fee Wallet
 * This wallet receives ALL swap fees
 */
export const AFFILIATE_WALLET = process.env.ZENITH_FEE_RECIPIENT || 
                                process.env.ZENITH_EVM_FEE_RECIPIENT ||
                                process.env.NEXT_PUBLIC_AFFILIATE_WALLET || 
                                '0xd54c82c9fe252acafbbd2375e6678f4848e78afe';

/**
 * Affiliate fee configuration
 * 50 bps = 0.5% per swap
 */
export const AFFILIATE_FEE_BPS = parseInt(process.env.ZENITH_FEE_BPS || '50');
export const AFFILIATE_FEE_TOKEN = 'buyToken'; // Take fee in the token user is buying

/**
 * SUPPORTED CHAINS - BSC ONLY
 * ❌ NO Ethereum, Base, Arbitrum, Polygon, Avalanche, Optimism, Blast, Scroll
 */
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // BNB Smart Chain - THE ONLY SUPPORTED EVM CHAIN
  56: {
    chainId: 56,
    name: 'BNB Chain',
    shortName: 'BSC',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    zeroExApiUrl: 'https://bsc.api.0x.org',
    stablecoins: {
      USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    },
    defaultSellToken: {
      symbol: 'BNB',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 1,
    dexScreenerSupported: true,
  },
};

/**
 * Get chain configuration by ID
 */
export function getChainConfig(chainId: number): ChainConfig | null {
  return SUPPORTED_CHAINS[chainId] || null;
}

/**
 * Check if chain is supported (BSC only)
 */
export function isChainSupported(chainId: number): boolean {
  return chainId === 56; // Only BSC
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = getChainConfig(chainId);
  if (!chain) return `https://bscscan.com/tx/${txHash}`; // Default to BSC
  return `${chain.blockExplorerUrls[0]}/tx/${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const chain = getChainConfig(chainId);
  if (!chain) return `https://bscscan.com/address/${address}`; // Default to BSC
  return `${chain.blockExplorerUrls[0]}/address/${address}`;
}

/**
 * Get all Tier 1 chains (BSC only)
 */
export function getTier1Chains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.tier === 1);
}

/**
 * Get all chains that support DexScreener
 */
export function getDexScreenerChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.dexScreenerSupported);
}

/**
 * Chain priority score - BSC only
 */
export function getChainPriority(chainId: number): number {
  // Only BSC is supported
  return chainId === 56 ? 100 : 0;
}
