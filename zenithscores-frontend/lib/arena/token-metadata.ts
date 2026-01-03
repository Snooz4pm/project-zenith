/**
 * Token Metadata System (Free, No API Costs)
 *
 * Uses:
 * 1. Local curated database (logos, descriptions)
 * 2. DexScreener data (already free)
 * 3. Fallback to generic metadata
 *
 * NO CoinGecko. NO expensive APIs.
 */

export interface TokenMetadata {
  symbol: string;
  name: string;
  logo?: string;
  description?: string;
  category?: string;
  tags?: string[];
  website?: string;
  twitter?: string;

  // Risk indicators
  isScam?: boolean;
  isVerified?: boolean;

  // Visual
  color?: string; // Brand color for UI
}

/**
 * CURATED TOKEN DATABASE
 * Add popular tokens here as you discover them
 * Logos use public CDN (no hosting costs)
 */
const CURATED_TOKENS: Record<string, TokenMetadata> = {
  // === TIER 1: Major Assets ===

  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
    description: 'Native currency of Ethereum blockchain',
    category: 'Layer 1',
    tags: ['platform', 'defi', 'smart-contracts'],
    isVerified: true,
    color: '#627EEA',
  },

  'WETH': {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
    description: 'ERC-20 wrapped version of ETH',
    category: 'Wrapped',
    tags: ['defi'],
    isVerified: true,
    color: '#627EEA',
  },

  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
    description: 'Digital gold, store of value',
    category: 'Layer 1',
    tags: ['store-of-value'],
    isVerified: true,
    color: '#F7931A',
  },

  'WBTC': {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg',
    description: 'ERC-20 wrapped version of BTC',
    category: 'Wrapped',
    tags: ['defi'],
    isVerified: true,
    color: '#F7931A',
  },

  'USDC': {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
    description: 'Regulated stablecoin by Circle',
    category: 'Stablecoin',
    tags: ['stablecoin', 'fiat-backed'],
    isVerified: true,
    color: '#2775CA',
  },

  'USDT': {
    symbol: 'USDT',
    name: 'Tether',
    logo: 'https://cryptologos.cc/logos/tether-usdt-logo.svg',
    description: 'Most liquid stablecoin',
    category: 'Stablecoin',
    tags: ['stablecoin', 'fiat-backed'],
    isVerified: true,
    color: '#26A17B',
  },

  'DAI': {
    symbol: 'DAI',
    name: 'Dai',
    logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg',
    description: 'Decentralized stablecoin by MakerDAO',
    category: 'Stablecoin',
    tags: ['stablecoin', 'algorithmic', 'defi'],
    isVerified: true,
    color: '#F5AC37',
  },

  // === TIER 2: DeFi Blue Chips ===

  'UNI': {
    symbol: 'UNI',
    name: 'Uniswap',
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg',
    description: 'Leading DEX protocol token',
    category: 'DeFi',
    tags: ['dex', 'governance'],
    isVerified: true,
    color: '#FF007A',
  },

  'AAVE': {
    symbol: 'AAVE',
    name: 'Aave',
    logo: 'https://cryptologos.cc/logos/aave-aave-logo.svg',
    description: 'Lending protocol token',
    category: 'DeFi',
    tags: ['lending', 'governance'],
    isVerified: true,
    color: '#B6509E',
  },

  'LINK': {
    symbol: 'LINK',
    name: 'Chainlink',
    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.svg',
    description: 'Decentralized oracle network',
    category: 'Infrastructure',
    tags: ['oracle', 'data'],
    isVerified: true,
    color: '#2A5ADA',
  },

  'MKR': {
    symbol: 'MKR',
    name: 'Maker',
    logo: 'https://cryptologos.cc/logos/maker-mkr-logo.svg',
    description: 'MakerDAO governance token',
    category: 'DeFi',
    tags: ['governance', 'stablecoin'],
    isVerified: true,
    color: '#1AAB9B',
  },

  'CRV': {
    symbol: 'CRV',
    name: 'Curve',
    logo: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.svg',
    description: 'Stablecoin exchange protocol',
    category: 'DeFi',
    tags: ['dex', 'stableswap'],
    isVerified: true,
    color: '#40649F',
  },

  // === TIER 3: Layer 2s ===

  'ARB': {
    symbol: 'ARB',
    name: 'Arbitrum',
    logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
    description: 'Ethereum L2 scaling solution',
    category: 'Layer 2',
    tags: ['scaling', 'ethereum'],
    isVerified: true,
    color: '#28A0F0',
  },

  'OP': {
    symbol: 'OP',
    name: 'Optimism',
    logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg',
    description: 'Ethereum L2 optimistic rollup',
    category: 'Layer 2',
    tags: ['scaling', 'ethereum'],
    isVerified: true,
    color: '#FF0420',
  },

  'MATIC': {
    symbol: 'MATIC',
    name: 'Polygon',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
    description: 'Ethereum sidechain network',
    category: 'Layer 2',
    tags: ['scaling', 'ethereum'],
    isVerified: true,
    color: '#8247E5',
  },

  // === TIER 4: Memecoins (Popular) ===

  'PEPE': {
    symbol: 'PEPE',
    name: 'Pepe',
    description: 'Frog-themed memecoin',
    category: 'Memecoin',
    tags: ['meme', 'community'],
    color: '#4CAF50',
  },

  'SHIB': {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    logo: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.svg',
    description: 'Dog-themed memecoin',
    category: 'Memecoin',
    tags: ['meme', 'community'],
    color: '#FFA409',
  },

  'DOGE': {
    symbol: 'DOGE',
    name: 'Dogecoin',
    logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg',
    description: 'Original memecoin',
    category: 'Memecoin',
    tags: ['meme', 'payments'],
    isVerified: true,
    color: '#C2A633',
  },

  'FLOKI': {
    symbol: 'FLOKI',
    name: 'Floki',
    description: 'Viking dog memecoin',
    category: 'Memecoin',
    tags: ['meme', 'community'],
    color: '#FF6B00',
  },
};

/**
 * SCAM/RUG DATABASE
 * Manually curated list of known scams
 * Prevents users from swapping dangerous tokens
 */
const KNOWN_SCAMS: Set<string> = new Set([
  // Add known scam contract addresses here (lowercase)
  // Example: '0x123abc...'
]);

/**
 * Get metadata for a token
 * Priority: Curated DB > DexScreener > Generic fallback
 */
export function getTokenMetadata(
  symbol: string,
  address?: string,
  dexScreenerData?: any
): TokenMetadata {
  // Check if scam
  const isScam = address ? KNOWN_SCAMS.has(address.toLowerCase()) : false;

  // 1. Try curated database first
  const curated = CURATED_TOKENS[symbol.toUpperCase()];
  if (curated) {
    return { ...curated, isScam };
  }

  // 2. Use DexScreener data if available
  if (dexScreenerData) {
    return {
      symbol,
      name: dexScreenerData.baseToken?.name || symbol,
      logo: dexScreenerData.info?.imageUrl,
      description: dexScreenerData.info?.description || `${symbol} token`,
      website: dexScreenerData.info?.websites?.[0]?.url,
      twitter: dexScreenerData.info?.socials?.find((s: any) => s.type === 'twitter')?.url,
      category: inferCategory(symbol, dexScreenerData),
      tags: inferTags(symbol, dexScreenerData),
      isScam,
    };
  }

  // 3. Generic fallback
  return {
    symbol,
    name: symbol,
    description: `${symbol} token discovered on-chain`,
    category: 'Unknown',
    tags: ['new'],
    isScam,
  };
}

/**
 * Infer category from token data
 */
function inferCategory(symbol: string, data: any): string {
  const name = data.baseToken?.name?.toLowerCase() || '';
  const desc = data.info?.description?.toLowerCase() || '';

  // Stablecoins
  if (symbol.includes('USD') || name.includes('dollar') || name.includes('usd')) {
    return 'Stablecoin';
  }

  // Wrapped tokens
  if (symbol.startsWith('W') && symbol.length <= 5) {
    return 'Wrapped';
  }

  // Memecoins
  const memeKeywords = ['meme', 'dog', 'cat', 'frog', 'pepe', 'shiba', 'doge', 'inu'];
  if (memeKeywords.some(kw => name.includes(kw) || desc.includes(kw))) {
    return 'Memecoin';
  }

  // DeFi
  const defiKeywords = ['defi', 'swap', 'dex', 'lending', 'yield', 'stake'];
  if (defiKeywords.some(kw => name.includes(kw) || desc.includes(kw))) {
    return 'DeFi';
  }

  // Gaming
  const gamingKeywords = ['game', 'gaming', 'play', 'nft'];
  if (gamingKeywords.some(kw => name.includes(kw) || desc.includes(kw))) {
    return 'Gaming';
  }

  return 'New Token';
}

/**
 * Infer tags from token data
 */
function inferTags(symbol: string, data: any): string[] {
  const tags: string[] = [];
  const name = data.baseToken?.name?.toLowerCase() || '';
  const desc = data.info?.description?.toLowerCase() || '';

  // Age-based
  const ageMinutes = data.pairCreatedAt
    ? (Date.now() - data.pairCreatedAt) / 1000 / 60
    : 0;

  if (ageMinutes < 60) tags.push('brand-new');
  else if (ageMinutes < 1440) tags.push('fresh');

  // Liquidity-based
  const liquidity = data.liquidity?.usd || 0;
  if (liquidity < 10000) tags.push('micro-cap');
  else if (liquidity < 50000) tags.push('low-cap');

  // Activity-based
  const buys5m = data.txns?.m5?.buys || 0;
  if (buys5m > 20) tags.push('high-activity');

  return tags;
}

/**
 * Get fallback logo for unknown tokens
 * Uses a generic token icon with first letter
 */
export function getFallbackLogo(symbol: string, color?: string): string {
  // Generate a deterministic color from symbol if not provided
  if (!color) {
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    color = `hsl(${hue}, 70%, 60%)`;
  }

  // Return SVG data URL
  const letter = symbol.charAt(0).toUpperCase();
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${color}"/>
      <text x="20" y="28" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${letter}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Add token to curated database (manual curation)
 * Call this when you discover a good token and want to save metadata
 */
export function curateToken(metadata: TokenMetadata): void {
  console.log(`💾 Curating token: ${metadata.symbol}`);
  console.log('Add this to CURATED_TOKENS in token-metadata.ts:');
  console.log(JSON.stringify(metadata, null, 2));

  // In production, you could save this to a database or file
  // For now, just log it for manual addition
}

/**
 * Mark token as scam
 */
export function markAsScam(address: string): void {
  KNOWN_SCAMS.add(address.toLowerCase());
  console.warn(`⚠️ Token ${address} marked as scam`);
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Layer 1': '#6366F1',
    'Layer 2': '#8B5CF6',
    'DeFi': '#10B981',
    'Memecoin': '#F59E0B',
    'Stablecoin': '#3B82F6',
    'Gaming': '#EC4899',
    'Infrastructure': '#6B7280',
    'Wrapped': '#8B5CF6',
    'New Token': '#6B7280',
    'Unknown': '#6B7280',
  };

  return colors[category] || '#6B7280';
}

/**
 * Export curated tokens for manual editing
 */
export function exportCuratedTokens(): string {
  return JSON.stringify(CURATED_TOKENS, null, 2);
}
