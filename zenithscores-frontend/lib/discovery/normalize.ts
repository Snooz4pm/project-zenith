/**
 * Global Token Model
 * 
 * Normalized token representation across all chains
 * Used for discovery - NO wallet logic here
 */

export type VM = 'EVM' | 'SOLANA';
export type ChainId = 'solana' | '1' | '56' | '8453' | '137' | '42161' | '10' | '43114';

export interface GlobalToken {
    id: string; // Unique identifier
    chainId: ChainId;
    chainType: VM;
    networkName: string; // Human-readable: "Ethereum", "BNB Chain", "Solana", etc.
    address: string; // Token contract address or mint
    symbol: string;
    name: string;
    logo?: string;
    liquidityUsd: number;
    volume24h: number;
    priceUsd: number;
    priceChange24h: number;
    dex: string; // Source DEX (Raydium, Uniswap, PancakeSwap, etc.)
}

/**
 * Chain metadata for display
 */
export const CHAIN_METADATA: Record<ChainId, { name: string; logo: string; color: string; vm: VM }> = {
    // Solana (NOT an EVM network)
    'solana': { name: 'Solana', logo: '◎', color: '#14F195', vm: 'SOLANA' },

    // EVM Networks (share same VM)
    '1': { name: 'Ethereum', logo: 'Ξ', color: '#627EEA', vm: 'EVM' },
    '56': { name: 'BNB Chain', logo: 'BNB', color: '#F3BA2F', vm: 'EVM' },
    '8453': { name: 'Base', logo: '🔵', color: '#0052FF', vm: 'EVM' },
    '137': { name: 'Polygon', logo: 'MATIC', color: '#8247E5', vm: 'EVM' },
    '42161': { name: 'Arbitrum', logo: 'ARB', color: '#28A0F0', vm: 'EVM' },
    '10': { name: 'Optimism', logo: 'OP', color: '#FF0420', vm: 'EVM' },
    '43114': { name: 'Avalanche', logo: 'AVAX', color: '#E84142', vm: 'EVM' },
};

/**
 * Determine VM from chain ID
 */
export function getVMFromChainId(chainId: ChainId): VM {
    return CHAIN_METADATA[chainId].vm;
}

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: ChainId): string {
    return CHAIN_METADATA[chainId].name;
}
