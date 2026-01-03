import { ChainType } from './types';

/**
 * Swap Router
 * 
 * Auto-routes swaps to the correct aggregator based on chain type
 * Solana → Jupiter
 * EVM → 0x
 */

export type SwapProvider = 'jupiter' | '0x';

/**
 * Determine which swap provider to use based on chainType
 */
export function getSwapProvider(chainType: ChainType): SwapProvider {
    return chainType === 'SOLANA' ? 'jupiter' : '0x';
}

/**
 * Get appropriate native token address for chain
 */
export function getNativeTokenAddress(chainType: ChainType, chainId?: number): string {
    if (chainType === 'SOLANA') {
        // Wrapped SOL
        return 'So11111111111111111111111111111111111111112';
    }

    // EVM chains use ETH placeholder
    return '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
}

/**
 * Get USDC address for chain
 */
export function getUSDCAddress(chainType: ChainType, chainId?: number): string {
    if (chainType === 'SOLANA') {
        // USDC on Solana
        return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    }

    // EVM USDC addresses by chain
    const usdcAddresses: Record<number, string> = {
        1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
        56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC
        137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
        8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
        42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
        10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
    };

    return usdcAddresses[chainId || 1] || usdcAddresses[1];
}

/**
 * Route quote request to appropriate aggregator
 */
export async function routeQuoteRequest(params: {
    chainType: ChainType;
    chainId?: number;
    sellToken: string;
    buyToken: string;
    amount: string;
    userAddress: string;
}): Promise<any> {
    const provider = getSwapProvider(params.chainType);

    if (provider === 'jupiter') {
        // Route to Jupiter API
        return fetch('/api/swap/jupiter/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputMint: params.sellToken,
                outputMint: params.buyToken,
                amount: params.amount,
                slippageBps: 50,
            }),
        }).then(res => res.json());
    }

    // Route to 0x API
    return fetch('/api/swap/0x/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chainId: params.chainId || 1,
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            sellAmount: params.amount,
            takerAddress: params.userAddress,
        }),
    }).then(res => res.json());
}

/**
 * Route swap execution to appropriate aggregator
 */
export async function routeSwapExecution(params: {
    chainType: ChainType;
    quote: any;
    userAddress: string;
}): Promise<any> {
    const provider = getSwapProvider(params.chainType);

    if (provider === 'jupiter') {
        return fetch('/api/swap/jupiter/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse: params.quote,
                userPublicKey: params.userAddress,
            }),
        }).then(res => res.json());
    }

    // 0x returns transaction payload directly in quote
    return Promise.resolve({
        to: params.quote.to,
        data: params.quote.data,
        value: params.quote.value || '0',
    });
}
