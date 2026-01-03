// 0x Swap Execution for Trading Arena
// This module handles the swap execution via 0x API

const ZEROX_API_URL = 'https://api.0x.org';

export interface SwapQuote {
    buyTokenAddress: string;
    sellTokenAddress: string;
    buyAmount: string;
    sellAmount: string;
    price: string;
    guaranteedPrice: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
    estimatedGas: string;
}

export interface SwapParams {
    sellToken: string;
    buyToken: string;
    sellAmount?: string;
    buyAmount?: string;
    takerAddress: string;
    slippagePercentage?: number;
}

// USDC address on Ethereum mainnet
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

/**
 * Get a swap quote from 0x API
 */
export async function getSwapQuote(params: SwapParams): Promise<SwapQuote | null> {
    try {
        const queryParams = new URLSearchParams({
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            takerAddress: params.takerAddress,
            slippagePercentage: (params.slippagePercentage || 0.01).toString(),
        });

        if (params.sellAmount) {
            queryParams.set('sellAmount', params.sellAmount);
        } else if (params.buyAmount) {
            queryParams.set('buyAmount', params.buyAmount);
        }

        const response = await fetch(`${ZEROX_API_URL}/swap/v1/quote?${queryParams}`, {
            headers: {
                '0x-api-key': process.env.ZEROX_API_KEY || '',
            },
        });

        if (!response.ok) {
            console.error('0x API error:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to get swap quote:', error);
        return null;
    }
}

/**
 * Get a price quote (no transaction data) from 0x API
 */
export async function getPriceQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string
): Promise<{ price: string; buyAmount: string } | null> {
    try {
        const queryParams = new URLSearchParams({
            sellToken,
            buyToken,
            sellAmount,
        });

        const response = await fetch(`${ZEROX_API_URL}/swap/v1/price?${queryParams}`, {
            headers: {
                '0x-api-key': process.env.ZEROX_API_KEY || '',
            },
        });

        if (!response.ok) {
            console.error('0x API price error:', await response.text());
            return null;
        }

        const data = await response.json();
        return {
            price: data.price,
            buyAmount: data.buyAmount,
        };
    } catch (error) {
        console.error('Failed to get price quote:', error);
        return null;
    }
}

/**
 * Build swap transaction data for a long position (USDC -> Token)
 */
export async function buildLongSwap(
    tokenAddress: string,
    usdcAmount: string,
    takerAddress: string
): Promise<SwapQuote | null> {
    return getSwapQuote({
        sellToken: USDC_ADDRESS,
        buyToken: tokenAddress,
        sellAmount: usdcAmount,
        takerAddress,
        slippagePercentage: 0.01, // 1%
    });
}

/**
 * Build swap transaction data for closing a long position (Token -> USDC)
 */
export async function buildCloseLongSwap(
    tokenAddress: string,
    tokenAmount: string,
    takerAddress: string
): Promise<SwapQuote | null> {
    return getSwapQuote({
        sellToken: tokenAddress,
        buyToken: USDC_ADDRESS,
        sellAmount: tokenAmount,
        takerAddress,
        slippagePercentage: 0.01,
    });
}
