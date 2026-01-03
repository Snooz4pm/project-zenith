/**
 * Multi-Chain Configuration for Trading Arena
 *
 * ALL 0x Swap API supported chains with affiliate fee monetization
 * Revenue model: Earn fees on EVERY swap across ALL chains
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
 * ZenithScores Affiliate Wallet
 * This wallet receives ALL swap fees across ALL chains
 *
 * CRITICAL: Replace with your production wallet before deployment
 */
export const AFFILIATE_WALLET = process.env.NEXT_PUBLIC_AFFILIATE_WALLET || '0x0000000000000000000000000000000000000000';

/**
 * Affiliate fee configuration
 * 30-50 bps = 0.3%-0.5% per swap
 * This is REVENUE. Do not reduce below 25 bps.
 */
export const AFFILIATE_FEE_BPS = 40; // 0.4% per swap
export const AFFILIATE_FEE_TOKEN = 'buyToken'; // Take fee in the token user is buying

/**
 * ALL SUPPORTED CHAINS
 * Auto-detects and handles any 0x-supported chain
 */
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // ==================== TIER 1 (PRIMARY REVENUE) ====================

  // Ethereum Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://eth.llamarpc.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    zeroExApiUrl: 'https://api.0x.org',
    stablecoins: {
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
    defaultSellToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
      decimals: 18,
    },
    tier: 1,
    dexScreenerSupported: true,
  },

  // Base (Coinbase L2)
  8453: {
    chainId: 8453,
    name: 'Base',
    shortName: 'BASE',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    zeroExApiUrl: 'https://base.api.0x.org',
    stablecoins: {
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // Bridged USDC
    },
    defaultSellToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 1,
    dexScreenerSupported: true,
  },

  // Arbitrum One
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    shortName: 'ARB',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    zeroExApiUrl: 'https://arbitrum.api.0x.org',
    stablecoins: {
      USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
    defaultSellToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 1,
    dexScreenerSupported: true,
  },

  // ==================== TIER 2 (EXPANDABLE) ====================

  // Optimism
  10: {
    chainId: 10,
    name: 'Optimism',
    shortName: 'OP',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    zeroExApiUrl: 'https://optimism.api.0x.org',
    stablecoins: {
      USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    },
    defaultSellToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 2,
    dexScreenerSupported: true,
  },

  // Polygon
  137: {
    chainId: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    zeroExApiUrl: 'https://polygon.api.0x.org',
    stablecoins: {
      USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
    defaultSellToken: {
      symbol: 'MATIC',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 2,
    dexScreenerSupported: true,
  },

  // BNB Smart Chain
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
    },
    defaultSellToken: {
      symbol: 'BNB',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 2,
    dexScreenerSupported: true,
  },

  // Avalanche C-Chain
  43114: {
    chainId: 43114,
    name: 'Avalanche',
    shortName: 'AVAX',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    zeroExApiUrl: 'https://avalanche.api.0x.org',
    stablecoins: {
      USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    },
    defaultSellToken: {
      symbol: 'AVAX',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 2,
    dexScreenerSupported: true,
  },

  // Blast
  81457: {
    chainId: 81457,
    name: 'Blast',
    shortName: 'BLAST',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.blast.io'],
    blockExplorerUrls: ['https://blastscan.io'],
    zeroExApiUrl: 'https://blast.api.0x.org',
    stablecoins: {
      USDB: '0x4300000000000000000000000000000000000003',
    },
    defaultSellToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 2,
    dexScreenerSupported: true,
  },

  // Scroll
  534352: {
    chainId: 534352,
    name: 'Scroll',
    shortName: 'SCROLL',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.scroll.io'],
    blockExplorerUrls: ['https://scrollscan.com'],
    zeroExApiUrl: 'https://scroll.api.0x.org',
    stablecoins: {
      USDC: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    },
    defaultSellToken: {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    tier: 2,
    dexScreenerSupported: false,
  },
};

/**
 * Get chain configuration by ID
 */
export function getChainConfig(chainId: number): ChainConfig | null {
  return SUPPORTED_CHAINS[chainId] || null;
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in SUPPORTED_CHAINS;
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = getChainConfig(chainId);
  if (!chain) return '';
  return `${chain.blockExplorerUrls[0]}/tx/${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const chain = getChainConfig(chainId);
  if (!chain) return '';
  return `${chain.blockExplorerUrls[0]}/address/${address}`;
}

/**
 * Get all Tier 1 chains (primary revenue)
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
 * Chain priority score for discovery feed
 * Base > Arbitrum > Ethereum > others
 */
export function getChainPriority(chainId: number): number {
  const priority: Record<number, number> = {
    8453: 100,   // Base (highest priority - lots of new tokens)
    42161: 90,   // Arbitrum
    1: 80,       // Ethereum
    10: 70,      // Optimism
    137: 60,     // Polygon
    56: 50,      // BSC
    43114: 40,   // Avalanche
    81457: 30,   // Blast
    534352: 20,  // Scroll
  };
  return priority[chainId] || 0;
}
