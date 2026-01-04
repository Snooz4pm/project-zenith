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
 * Chain metadata for display (real logos from TrustWallet CDN)
 */
export const CHAIN_METADATA: Record<ChainId, { name: string; logo: string; color: string; vm: VM }> = {
    // Solana (NOT an EVM network)
    'solana': {
        name: 'Solana',
        logo: 'https://assets.trustwalletapp.com/blockchains/solana/info/logo.png',
        color: '#14F195',
        vm: 'SOLANA'
    },

    // EVM Networks
    '1': {
        name: 'Ethereum',
        logo: 'https://assets.trustwalletapp.com/blockchains/ethereum/info/logo.png',
        color: '#627EEA',
        vm: 'EVM'
    },
    '56': {
        name: 'BNB Chain',
        logo: 'https://assets.trustwalletapp.com/blockchains/binance/info/logo.png',
        color: '#F3BA2F',
        vm: 'EVM'
    },
    '8453': {
        name: 'Base',
        logo: 'https://assets.trustwalletapp.com/blockchains/base/info/logo.png',
        color: '#0052FF',
        vm: 'EVM'
    },
    '137': {
        name: 'Polygon',
        logo: 'https://assets.trustwalletapp.com/blockchains/polygon/info/logo.png',
        color: '#8247E5',
        vm: 'EVM'
    },
    '42161': {
        name: 'Arbitrum',
        logo: 'https://assets.trustwalletapp.com/blockchains/arbitrum/info/logo.png',
        color: '#28A0F0',
        vm: 'EVM'
    },
    '10': {
        name: 'Optimism',
        logo: 'https://assets.trustwalletapp.com/blockchains/optimism/info/logo.png',
        color: '#FF0420',
        vm: 'EVM'
    },
    '43114': {
        name: 'Avalanche',
        logo: 'https://assets.trustwalletapp.com/blockchains/avalanchec/info/logo.png',
        color: '#e95959ff',
        vm: 'EVM'
    },
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

/**
 * Convert DexScreener chainId string to ChainId
 */
export function normalizeChainId(dexChainId: string): ChainId {
    const mapping: Record<string, ChainId> = {
        'ethereum': '1',
        'base': '8453',
        'arbitrum': '42161',
        'optimism': '10',
        'polygon': '137',
        'bsc': '56',
        'avalanche': '43114',
        'solana': 'solana',
    };
    return mapping[dexChainId.toLowerCase()] || '1';
}

/**
 * Convert DiscoveredToken (from DexScreener) to GlobalToken
 */
export function discoveredToGlobalToken(discovered: any): GlobalToken {
    const chainId = normalizeChainId(discovered.chainId);
    const chainMeta = CHAIN_METADATA[chainId];

    return {
        id: `${chainId}-${discovered.address}`,
        chainId,
        chainType: chainMeta.vm,
        networkName: chainMeta.name,
        address: discovered.address,
        symbol: discovered.symbol,
        name: discovered.name,
        logo: discovered.metadata?.logo || undefined,
        liquidityUsd: discovered.liquidity || 0,
        volume24h: discovered.volume24h || 0,
        priceUsd: discovered.priceUSD || 0,
        priceChange24h: discovered.priceAction || 0,
        dex: discovered.dexId || 'Unknown',
    };
}
