// Trading Arena Types

export type PositionSide = 'long' | 'short';

export interface ArenaPosition {
    id: string;
    walletAddress: string;
    userId?: string | null;
    token: string;
    tokenAddress: string;
    chainId: number;
    side: PositionSide;
    entryPrice: number;
    sizeUSD: number;
    sizeTokens: number;
    txHash?: string | null;
    isOpen: boolean;
    openedAt: Date;
    closedAt?: Date | null;
    exitPrice?: number | null;
    realizedPnL?: number | null;
    closeTxHash?: string | null;
}

export interface OpenPositionRequest {
    token: string;
    tokenAddress: string;
    side: PositionSide;
    sizeUSD: number;
    walletAddress: string;
    chainId?: number;
    entryPrice: number;
    sizeTokens: number;
    txHash?: string;
    userId?: string;
}

export interface ClosePositionRequest {
    positionId: string;
    exitPrice: number;
    closeTxHash?: string;
}

export interface PositionWithPnL extends ArenaPosition {
    currentPrice: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
}

// Supported tokens for Arena trading
export const ARENA_TOKENS = [
    { symbol: 'ETH', name: 'Ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chainId: 1 },
    { symbol: 'SOL', name: 'Solana', address: '0xD31a59c85aE9D8edEFeC411D448f90841571b89c', chainId: 1 },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', chainId: 1 },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', chainId: 1 },
] as const;

export type ArenaToken = typeof ARENA_TOKENS[number];
