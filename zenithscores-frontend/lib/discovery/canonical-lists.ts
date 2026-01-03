/**
 * Canonical Token Lists (PHASE 2)
 *
 * This is the BACKBONE of token discovery.
 * These lists are stable, curated, and ALWAYS work.
 *
 * Sources:
 * - Solana: Jupiter Aggregator token list
 * - EVM: Uniswap/1inch token lists + top tokens per chain
 *
 * DexScreener is used ONLY for enrichment (hot badges, trending)
 */

import { GlobalToken, ChainId } from './normalize';

// Jupiter Token List API (Solana's canonical source)
const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/all';

// Uniswap token lists per chain
const UNISWAP_TOKEN_LISTS: Record<string, string> = {
  '1': 'https://tokens.uniswap.org', // Ethereum
  '8453': 'https://tokens.uniswap.org', // Base
  '42161': 'https://tokens.uniswap.org', // Arbitrum
  '10': 'https://tokens.uniswap.org', // Optimism
  '137': 'https://tokens.uniswap.org', // Polygon
};

interface JupiterToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
  };
}

interface UniswapToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
}

/**
 * Fetch Solana canonical tokens from Jupiter
 * This is the SINGLE SOURCE OF TRUTH for Solana tokens
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - 5 second timeout to prevent slow API calls
 * - Limits to top 500 tokens after filtering (prevents massive arrays)
 * - Returns empty array on failure (graceful degradation)
 */
export async function fetchSolanaCanonicalTokens(): Promise<GlobalToken[]> {
  try {
    console.log('[Canonical] Fetching Solana tokens from Jupiter...');

    // Timeout wrapper: 5 seconds max for Jupiter API
    const fetchPromise = fetch(JUPITER_TOKEN_LIST_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZenithScores/1.0',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Jupiter API timeout after 5s')), 5000);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      console.error('[Canonical] Jupiter API error:', response.status);
      return [];
    }

    const tokens: JupiterToken[] = await response.json();
    console.log(`[Canonical] Jupiter returned ${tokens.length} Solana tokens`);

    // Convert to GlobalToken format with filtering
    const globalTokens: GlobalToken[] = tokens
      .filter(token => {
        // Filter out spam/test tokens
        if (!token.symbol || token.symbol.length > 12) return false;
        if (!token.name || token.name.length > 50) return false;
        if (token.symbol.includes('...') || token.symbol.includes('test')) return false;
        return true;
      })
      .slice(0, 500) // LIMIT to 500 tokens max (performance)
      .map(token => ({
        id: `solana-${token.address}`,
        chainId: 'solana' as ChainId,
        chainType: 'SOLANA' as const,
        networkName: 'Solana',
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        logo: token.logoURI,
        liquidityUsd: 0, // Will be enriched by DexScreener
        volume24h: 0, // Will be enriched by DexScreener
        priceUsd: 0, // Will be enriched by DexScreener
        priceChange24h: 0, // Will be enriched by DexScreener
        dex: 'Jupiter', // Source
      }));

    console.log(`[Canonical] Normalized ${globalTokens.length} Solana tokens (limited to 500)`);
    return globalTokens;
  } catch (error: any) {
    console.error('[Canonical] Failed to fetch Jupiter tokens:', error.message);
    // CRITICAL: Return empty array (not throwing error)
    // This allows EVM tokens to still work
    return [];
  }
}

/**
 * Fetch EVM canonical tokens from Uniswap/1inch lists
 */
export async function fetchEvmCanonicalTokens(chainId: ChainId): Promise<GlobalToken[]> {
  // For now, return top tokens per chain (hardcoded canonical list)
  // In production, fetch from Uniswap token list API

  const TOP_TOKENS: Record<ChainId, Array<Partial<GlobalToken>>> = {
    '1': [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    ],
    '56': [
      { symbol: 'BNB', name: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955' },
      { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' },
      { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
    ],
    '8453': [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
      { symbol: 'cbETH', name: 'Coinbase Wrapped ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' },
    ],
    '42161': [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
      { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548' },
    ],
    '10': [
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607' },
      { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042' },
    ],
    '137': [
      { symbol: 'MATIC', name: 'Polygon', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' },
    ],
    '43114': [
      { symbol: 'AVAX', name: 'Avalanche', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
      { symbol: 'WAVAX', name: 'Wrapped AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' },
    ],
    'solana': [], // Handled by Jupiter
  };

  const chainMeta = {
    '1': { name: 'Ethereum', vm: 'EVM' as const },
    '56': { name: 'BNB Chain', vm: 'EVM' as const },
    '8453': { name: 'Base', vm: 'EVM' as const },
    '42161': { name: 'Arbitrum', vm: 'EVM' as const },
    '10': { name: 'Optimism', vm: 'EVM' as const },
    '137': { name: 'Polygon', vm: 'EVM' as const },
    '43114': { name: 'Avalanche', vm: 'EVM' as const },
    'solana': { name: 'Solana', vm: 'SOLANA' as const },
  };

  const tokens = TOP_TOKENS[chainId] || [];
  const meta = chainMeta[chainId];

  return tokens.map(token => ({
    id: `${chainId}-${token.address}`,
    chainId,
    chainType: meta.vm,
    networkName: meta.name,
    address: token.address!,
    symbol: token.symbol!,
    name: token.name!,
    logo: token.logo,
    liquidityUsd: 0, // Will be enriched
    volume24h: 0, // Will be enriched
    priceUsd: 0, // Will be enriched
    priceChange24h: 0, // Will be enriched
    dex: 'Canonical',
  }));
}

/**
 * Fetch ALL canonical tokens (Solana + all EVM chains)
 * This is the BACKBONE - always returns tokens
 */
export async function fetchAllCanonicalTokens(): Promise<GlobalToken[]> {
  console.log('[Canonical] Fetching canonical token lists...');

  const allTokens: GlobalToken[] = [];

  // Fetch Solana tokens from Jupiter
  const solanaTokens = await fetchSolanaCanonicalTokens();
  allTokens.push(...solanaTokens);

  // Fetch top tokens from each EVM chain
  const evmChains: ChainId[] = ['1', '56', '8453', '42161', '10', '137', '43114'];
  for (const chainId of evmChains) {
    const chainTokens = await fetchEvmCanonicalTokens(chainId);
    allTokens.push(...chainTokens);
  }

  console.log(`[Canonical] Total canonical tokens: ${allTokens.length}`);
  return allTokens;
}

/**
 * Get canonical tokens for specific chain
 */
export async function fetchCanonicalTokensByChain(chainId: ChainId): Promise<GlobalToken[]> {
  if (chainId === 'solana') {
    return fetchSolanaCanonicalTokens();
  } else {
    return fetchEvmCanonicalTokens(chainId);
  }
}
