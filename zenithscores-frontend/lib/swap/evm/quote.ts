/**
 * EVM Quote Fetcher (0x Protocol)
 * 
 * READ-ONLY - No wallet required
 * Routes through API proxy to avoid CORS
 * Supports slippage and platform fee capture
 */

export interface EvmQuoteParams {
    sellToken: string;
    buyToken: string;
    sellAmount: string; // in wei
    chainId: number;
    takerAddress?: string;
    slippagePercentage?: number; // 0.005 = 0.5%
    affiliateAddress?: string; // Your fee wallet
    buyTokenPercentageFee?: string; // "0.005" = 0.5%
}

export interface EvmQuote {
    price: string;
    guaranteedPrice: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
    buyAmount: string;
    sellAmount: string;
    minBuyAmount?: string; // Minimum output with slippage
    allowanceTarget?: string;
    approvalData?: string;
    estimatedPriceImpact?: string;
    sources?: any[];
}

export async function getEvmQuote(params: EvmQuoteParams): Promise<EvmQuote> {
    const {
        sellToken,
        buyToken,
        sellAmount,
        chainId,
        takerAddress,
        slippagePercentage,
        affiliateAddress,
        buyTokenPercentageFee
    } = params;

    const queryParams = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        chainId: String(chainId),
    });

    if (takerAddress) queryParams.append('takerAddress', takerAddress);
    if (slippagePercentage !== undefined) queryParams.append('slippagePercentage', String(slippagePercentage));
    if (affiliateAddress) queryParams.append('affiliateAddress', affiliateAddress);
    if (buyTokenPercentageFee) queryParams.append('buyTokenPercentageFee', buyTokenPercentageFee);

    // Call OUR API proxy (not 0x directly - avoids CORS)
    const res = await fetch(`/api/arena/evm/quote?${queryParams.toString()}`);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'No EVM route available');
    }

    return res.json();
}

/**
 * Calculate gas cost in ETH
 */
export function calculateGasCost(quote: EvmQuote): number {
    const gasEth = BigInt(quote.gas) * BigInt(quote.gasPrice);
    return Number(gasEth) / 1e18;
}
