export type ChainType = 'SOLANA' | 'EVM';
export type TokenSource = 'RAYDIUM' | 'JUPITER' | 'DEXSCREENER';

export interface DiscoveredToken {
    chainType: ChainType;
    chainId: string;
    chain: string; // 'solana' | 'ethereum' | 'bsc' etc
    networkName?: string; // Human-readable network name (e.g. "Solana", "Ethereum")
    address: string;
    symbol: string;
    name: string;
    decimals?: number;
    logoURI?: string;
    priceUsd?: number;
    liquidityUsd: number;
    volume24hUsd: number;
    pairCreatedAt?: number; // Timestamp (ms)
    source: TokenSource;
    swappable?: boolean; // false for LP tokens, wrapped assets, etc.
    tags?: string[]; // e.g. ['lp-token', 'perps', 'vault']
}

// Legacy type alias for compatibility if needed
export type Token = DiscoveredToken;
