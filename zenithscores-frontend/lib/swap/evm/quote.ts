/**
 * EVM Quote Fetcher (0x Protocol)
 * 
 * READ-ONLY - No wallet required
 * Test this alone first before moving to execution
 */

export interface EvmQuoteParams {
    sellToken: string;
    buyToken: string;
    sellAmount: string; // in wei
    chainId: number;
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
    allowanceTarget?: string;
    approvalData?: string;
    estimatedPriceImpact?: string;
}

export async function getEvmQuote(params: EvmQuoteParams): Promise<EvmQuote> {
    const { sellToken, buyToken, sellAmount, chainId } = params;

    const queryParams = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        chainId: String(chainId),
    });

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
