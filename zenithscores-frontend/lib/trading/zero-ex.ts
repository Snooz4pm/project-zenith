
const ZERO_EX_API_URL = 'https://api.0x.org/swap/v1/quote';

interface ZeroExQuoteParams {
    sellToken: string;
    buyToken: string;
    sellAmount: string; // In base units (wei)
    slippagePercentage?: number;
    takerAddress: string; // Needed for RFQ and to estimate gas properly
}

export async function getZeroExQuote(params: ZeroExQuoteParams) {
    const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;
    const feeRecipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT;
    const feeBps = process.env.NEXT_PUBLIC_AFFILIATE_FEE_BPS || '50';

    if (!apiKey) {
        throw new Error('Missing 0x API Key');
    }

    // Construct query params
    const searchParams = new URLSearchParams({
        sellToken: params.sellToken,
        buyToken: params.buyToken,
        sellAmount: params.sellAmount,
        takerAddress: params.takerAddress,
        slippagePercentage: (params.slippagePercentage || 0.01).toString(),

        // Monetization Params
        feeRecipient: feeRecipient || '',
        buyTokenPercentageFee: (parseInt(feeBps) / 10000).toString(), // 0x expects decimal (e.g. 0.01 for 1%)
    });

    if (!feeRecipient) {
        console.warn('⚠️ No Fee Recipient set. Affiliate fees will not be collected.');
        searchParams.delete('feeRecipient');
        searchParams.delete('buyTokenPercentageFee');
    }

    try {
        const response = await fetch(`${ZERO_EX_API_URL}?${searchParams.toString()}`, {
            headers: {
                '0x-api-key': apiKey
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.reason || 'Failed to fetch quote');
        }

        return await response.json();
    } catch (error) {
        console.error('0x Quote Error:', error);
        throw error;
    }
}
