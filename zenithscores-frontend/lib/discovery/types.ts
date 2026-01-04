export type ChainType = 'SOLANA' | 'EVM';
export type TokenSource = 'RAYDIUM' | 'JUPITER' | 'DEXSCREENER';

export interface DiscoveredToken {
    chainType: ChainType;
    chainId: string;
    chain: string; // 'solana' | 'ethereum' | 'bsc' etc
    address: string;
    symbol: string;
    name: string;
    decimals?: number;
    logoURI?: string;
    priceUsd?: number;
    liquidityUsd: number;
    volume24hUsd: number;
    source: TokenSource;
}

// Legacy type alias for compatibility if needed
export type Token = DiscoveredToken;
