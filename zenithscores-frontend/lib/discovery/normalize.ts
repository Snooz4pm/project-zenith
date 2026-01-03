/**
 * Global Token Model
 * 
 * Normalized token representation across all chains
 * Used for discovery - NO wallet logic here
 */

export type ChainId = 'solana' | '1' | '56' | '8453' | '137' | '42161' | '10' | '43114' | '250' | '100';

export interface GlobalToken {
    id: string; // Unique identifier
    chainId: ChainId;
    chainType: 'SOLANA' | 'EVM';
    address: string; // Token contract address or mint
    symbol: string;
    name: string;
    logo?: string;
    liquidityUsd: number;
    volume24h: number;
    priceUsd: number;
    priceChange24h: number;
    dex: string; // Source DEX (Raydium, Uniswap, etc.)
}

/**
 * Chain metadata for display
 */
export const CHAIN_METADATA: Record<ChainId, { name: string; logo: string; color: string }> = {
    'solana': { name: 'Solana', logo: '◎', color: '#14F195' },
    '1': { name: 'Ethereum', logo: 'Ξ', color: '#627EEA' },
    '56': { name: 'BNB Chain', logo: 'BNB', color: '#F3BA2F' },
    '8453': { name: 'Base', logo: '🔵', color: '#0052FF' },
    '137': { name: 'Polygon', logo: 'MATIC', color: '#8247E5' },
    '42161': { name: 'Arbitrum', logo: 'ARB', color: '#28A0F0' },
    '10': { name: 'Optimism', logo: 'OP', color: '#FF0420' },
    '43114': { name: 'Avalanche', logo: 'AVAX', color: '#E84142' },
    '250': { name: 'Fantom', logo: 'FTM', color: '#1969FF' },
    '100': { name: 'Gnosis', logo: 'GNO', color: '#04795B' },
};

/**
 * Determine chain type from chain ID
 */
export function getChainType(chainId: ChainId): 'SOLANA' | 'EVM' {
    return chainId === 'solana' ? 'SOLANA' : 'EVM';
}
