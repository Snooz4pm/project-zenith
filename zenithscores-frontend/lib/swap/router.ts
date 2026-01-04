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

    // BSC USDC address (ONLY BSC supported for EVM)
    const usdcAddresses: Record<number, string> = {
        56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC
    };

    // Default to BSC (56)
    return usdcAddresses[chainId || 56] || usdcAddresses[56];
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

    // Route to 0x API (BSC only)
    return fetch('/api/swap/0x/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chainId: params.chainId || 56, // Default to BSC
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
