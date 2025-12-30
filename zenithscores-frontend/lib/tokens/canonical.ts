export const CANONICAL_TOKENS: Record<number, { symbol: string, address: string, decimals: number }[]> = {
    1: [
        { symbol: 'ETH', address: 'ETH', decimals: 18 },
        { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    ],
    8453: [
        { symbol: 'ETH', address: 'ETH', decimals: 18 },
        { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    ],
    42161: [ // Arbitrum
        { symbol: 'ETH', address: 'ETH', decimals: 18 },
        { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    ]
};
