/**
 * SPL Token Metadata Database
 *
 * Free metadata system for Solana tokens
 * - No CoinGecko needed
 * - Curated list of popular SPL tokens
 * - Trust Wallet CDN for logos
 * - Auto-categorization
 */

export interface SolanaTokenMetadata {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logo: string;
  category: string;
  isVerified: boolean;
  color?: string;
}

/**
 * Curated SPL Token Database
 * Top Solana tokens with metadata
 */
export const SOLANA_TOKENS: Record<string, SolanaTokenMetadata> = {
  // Native SOL
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    category: 'Layer 1',
    isVerified: true,
    color: '#14F195',
  },

  // Stablecoins
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    category: 'Stablecoin',
    isVerified: true,
    color: '#2775CA',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    category: 'Stablecoin',
    isVerified: true,
    color: '#26A17B',
  },
  PYUSD: {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo/logo.png',
    category: 'Stablecoin',
    isVerified: true,
    color: '#0070E0',
  },

  // Memecoins
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    category: 'Memecoin',
    isVerified: true,
    color: '#F5A623',
  },
  WIF: {
    symbol: 'WIF',
    name: 'dogwifhat',
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    decimals: 6,
    logo: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link',
    category: 'Memecoin',
    isVerified: true,
    color: '#F5A623',
  },
  POPCAT: {
    symbol: 'POPCAT',
    name: 'Popcat',
    mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    decimals: 9,
    logo: 'https://bafkreidlxpp5oj5d7aa4uyd2yacuwfxgvpevo5p7emq3knrscndhn5eoty.ipfs.nftstorage.link',
    category: 'Memecoin',
    isVerified: true,
    color: '#FFD700',
  },
  MEW: {
    symbol: 'MEW',
    name: 'cat in a dogs world',
    mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',
    decimals: 5,
    logo: 'https://bafkreicfvdywtkthrqr4eigjfvcilsrmzw4etwagl46ruvyueu3cnq4e44.ipfs.nftstorage.link',
    category: 'Memecoin',
    isVerified: true,
    color: '#FF6B9D',
  },

  // DeFi Tokens
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    logo: 'https://static.jup.ag/jup/icon.png',
    category: 'DeFi',
    isVerified: true,
    color: '#FCC00A',
  },
  RAY: {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
    category: 'DeFi',
    isVerified: true,
    color: '#8C4FFF',
  },
  ORCA: {
    symbol: 'ORCA',
    name: 'Orca',
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
    category: 'DeFi',
    isVerified: true,
    color: '#FF7C5A',
  },
  MNGO: {
    symbol: 'MNGO',
    name: 'Mango',
    mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac/logo.svg',
    category: 'DeFi',
    isVerified: true,
    color: '#FF6154',
  },

  // Liquid Staking
  mSOL: {
    symbol: 'mSOL',
    name: 'Marinade Staked SOL',
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
    category: 'Liquid Staking',
    isVerified: true,
    color: '#6F82FF',
  },
  jitoSOL: {
    symbol: 'jitoSOL',
    name: 'Jito Staked SOL',
    mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    decimals: 9,
    logo: 'https://storage.googleapis.com/token-metadata/JitoSOL-256.png',
    category: 'Liquid Staking',
    isVerified: true,
    color: '#87E0A8',
  },
  bSOL: {
    symbol: 'bSOL',
    name: 'BlazeStake Staked SOL',
    mint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1/logo.png',
    category: 'Liquid Staking',
    isVerified: true,
    color: '#FF6B35',
  },

  // Gaming & NFT
  RENDER: {
    symbol: 'RENDER',
    name: 'Render Token',
    mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
    decimals: 8,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png',
    category: 'Infrastructure',
    isVerified: true,
    color: '#E6007A',
  },
  PYTH: {
    symbol: 'PYTH',
    name: 'Pyth Network',
    mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png',
    category: 'Oracle',
    isVerified: true,
    color: '#6F4FF0',
  },
};

/**
 * Get token metadata by symbol or mint address
 */
export function getSolanaTokenMetadata(
  symbolOrMint: string
): SolanaTokenMetadata | null {
  // Try by symbol first (case insensitive)
  const bySymbol = Object.values(SOLANA_TOKENS).find(
    (token) => token.symbol.toLowerCase() === symbolOrMint.toLowerCase()
  );
  if (bySymbol) return bySymbol;

  // Try by mint address
  const byMint = Object.values(SOLANA_TOKENS).find(
    (token) => token.mint === symbolOrMint
  );
  if (byMint) return byMint;

  return null;
}

/**
 * Get fallback logo for unknown tokens
 */
export function getSolanaFallbackLogo(symbol: string, color?: string): string {
  const bgColor = color || getColorFromSymbol(symbol);
  const initial = symbol.charAt(0).toUpperCase();

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="${bgColor}" rx="16"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">${initial}</text>
    </svg>
  `)}`;
}

/**
 * Generate color from token symbol
 */
function getColorFromSymbol(symbol: string): string {
  const colors = [
    '#14F195', // Solana green
    '#8C4FFF', // Purple
    '#FF7C5A', // Orange
    '#FCC00A', // Yellow
    '#6F82FF', // Blue
    '#FF6154', // Red
    '#87E0A8', // Mint
    '#FF6B9D', // Pink
  ];

  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Get all tokens by category
 */
export function getSolanaTokensByCategory(category: string): SolanaTokenMetadata[] {
  return Object.values(SOLANA_TOKENS).filter(
    (token) => token.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all verified tokens
 */
export function getVerifiedSolanaTokens(): SolanaTokenMetadata[] {
  return Object.values(SOLANA_TOKENS).filter((token) => token.isVerified);
}

/**
 * Format token amount with decimals
 */
export function formatSolanaTokenAmount(
  amount: string | number,
  decimals: number
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  return (num / divisor).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/**
 * Parse token amount to lamports/smallest unit
 */
export function parseSolanaTokenAmount(
  amount: string | number,
  decimals: number
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const multiplier = Math.pow(10, decimals);
  return Math.floor(num * multiplier).toString();
}
