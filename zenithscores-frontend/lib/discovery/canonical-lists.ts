import { ChainId, GlobalToken } from './normalize';

const SOLANA_REGISTRY_URL = 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json';
const RAYDIUM_AMM_URL = 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';
const RAYDIUM_CLMM_URL = 'https://api.raydium.io/v2/sdk/clmm/mainnet.json';
const UNISWAP_LIST_URL = 'https://tokens.uniswap.org';

// Cache results briefly to prevent rate limits
let cachedTokens: GlobalToken[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchAllCanonicalTokens(): Promise<GlobalToken[]> {
  const now = Date.now();
  if (cachedTokens.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return cachedTokens;
  }

  try {
    const [solanaTokens, evmTokens] = await Promise.all([
      fetchSolanaCanonicalTokens(),
      fetchEvmCanonicalTokens()
    ]);

    cachedTokens = [...solanaTokens, ...evmTokens];
    lastFetchTime = now;
    return cachedTokens;
  } catch (error) {
    console.error('Failed to fetch canonical tokens:', error);
    return [];
  }
}

export async function fetchCanonicalTokensByChain(chainId: ChainId): Promise<GlobalToken[]> {
  const all = await fetchAllCanonicalTokens();
  return all.filter(t => t.chainId === chainId);
}

async function fetchSolanaCanonicalTokens(): Promise<GlobalToken[]> {
  try {
    const [registryRes, ammRes, clmmRes] = await Promise.all([
      fetch(SOLANA_REGISTRY_URL).catch(() => null),
      fetch(RAYDIUM_AMM_URL).catch(() => null),
      fetch(RAYDIUM_CLMM_URL).catch(() => null)
    ]);

    const registryJson = registryRes ? await registryRes.json() : { tokens: [] };
    const ammJson = ammRes ? await ammRes.json() : {};
    const clmmJson = clmmRes ? await clmmRes.json() : {};

    // Extract Raydium mints (Liquidity Truth)
    const raydiumMints = new Set<string>();
    const extractMints = (pools: any) => {
      if (!pools) return;
      const list = Array.isArray(pools) ? pools : Object.values(pools);
      list.forEach((p: any) => {
        if (p.baseMint) raydiumMints.add(p.baseMint);
        if (p.quoteMint) raydiumMints.add(p.quoteMint);
      });
    };

    extractMints(ammJson.official);
    extractMints(ammJson.unOfficial);
    extractMints(clmmJson.official);
    extractMints(clmmJson.unOfficial);

    // Filter registry tokens by Raydium existence
    // This ensures we only show tokens with actual liquidity pools
    const validTokens = registryJson.tokens
      .filter((t: any) => t.chainId === 101 && raydiumMints.has(t.address)) // 101 is Solana Mainnet
      .map((t: any) => ({
        id: `solana-${t.address}`,
        chainId: 'solana' as ChainId,
        chainType: 'SOLANA' as const,
        networkName: 'Solana',
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        logo: t.logoURI,
        decimals: t.decimals,
        // Placeholders - enriched later
        liquidityUsd: 0,
        volume24h: 0,
        priceUsd: 0,
        priceChange24h: 0,
        dex: 'Raydium',
      }));

    return validTokens;
  } catch (e) {
    console.error('Solana discovery failed:', e);
    return [];
  }
}

async function fetchEvmCanonicalTokens(): Promise<GlobalToken[]> {
  try {
    const res = await fetch(UNISWAP_LIST_URL);
    const json = await res.json();

    // Map chainId to our supported chains
    const supportedChains = new Set([1, 56, 8453, 42161]);

    const evmTokens = json.tokens
      .filter((t: any) => supportedChains.has(t.chainId))
      .map((t: any) => {
        let networkName = 'Ethereum';
        if (t.chainId === 56) networkName = 'BNB Chain';
        if (t.chainId === 8453) networkName = 'Base';
        if (t.chainId === 42161) networkName = 'Arbitrum';

        return {
          id: `${t.chainId}-${t.address}`,
          chainId: t.chainId.toString() as ChainId,
          chainType: 'EVM' as const,
          networkName,
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          logo: t.logoURI,
          decimals: t.decimals,
          // Placeholders - enriched later
          liquidityUsd: 0,
          volume24h: 0,
          priceUsd: 0,
          priceChange24h: 0,
          dex: 'Uniswap',
        };
      });

    return evmTokens;
  } catch (e) {
    console.error('EVM discovery failed:', e);
    return [];
  }
}
