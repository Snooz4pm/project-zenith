export type ChainType = "SOLANA" | "EVM";

export const EVM_CHAIN_MAP: Record<number, {
    chainType: "EVM";
    name: string;
    nativeSymbol: string;
}> = {
    1: { chainType: "EVM", name: "Ethereum", nativeSymbol: "ETH" },
    56: { chainType: "EVM", name: "BNB Chain", nativeSymbol: "BNB" },
    8453: { chainType: "EVM", name: "Base", nativeSymbol: "ETH" },
    42161: { chainType: "EVM", name: "Arbitrum", nativeSymbol: "ETH" },
    137: { chainType: "EVM", name: "Polygon", nativeSymbol: "MATIC" },
    10: { chainType: "EVM", name: "Optimism", nativeSymbol: "ETH" },
    43114: { chainType: "EVM", name: "Avalanche", nativeSymbol: "AVAX" },
};

export const SOLANA_CHAIN = {
    chainType: "SOLANA" as const,
    name: "Solana",
    nativeSymbol: "SOL",
};

/**
 * Single source of truth for converting chainId (number) to ChainType
 */
export function chainIdToChainType(chainId?: number): ChainType | null {
    if (!chainId) return null;
    // If it's in our EVM map, it's EVM
    if (EVM_CHAIN_MAP[chainId]) return "EVM";
    return null;
}

/**
 * Get native symbol for display
 */
export function getNativeSymbol(chainType: ChainType, chainId?: number): string {
    if (chainType === "SOLANA") return SOLANA_CHAIN.nativeSymbol;
    if (chainId && EVM_CHAIN_MAP[chainId]) return EVM_CHAIN_MAP[chainId].nativeSymbol;
    return "ETH"; // Default fallback
}
