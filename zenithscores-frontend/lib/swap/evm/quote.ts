/**
 * EVM Quote Fetcher (0x Protocol)
 * 
 * READ-ONLY - No wallet required
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

    if (takerAddress) {
        queryParams.append('takerAddress', takerAddress);
    }

    if (slippagePercentage !== undefined) {
        queryParams.append('slippagePercentage', String(slippagePercentage));
    }

    // Platform fee capture (revenue)
    if (affiliateAddress && buyTokenPercentageFee) {
        queryParams.append('affiliateAddress', affiliateAddress);
        queryParams.append('feeRecipient', affiliateAddress);
        queryParams.append('buyTokenPercentageFee', buyTokenPercentageFee);
    }

    const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;
    if (!apiKey) {
        throw new Error('0x API key not configured');
    }

    const res = await fetch(
        `https://api.0x.org/swap/v1/quote?${queryParams.toString()}`,
        {
            headers: {
                '0x-api-key': apiKey,
            },
        }
    );

    if (!res.ok) {
        const error = await res.json().catch(() => ({ reason: 'Unknown error' }));
        throw new Error(error.reason || 'No EVM route available');
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
