
const CHAIN_CONFIG: Record<string, { url: string }> = {
    'ethereum': { url: 'https://api.0x.org' },
    'base': { url: 'https://base.api.0x.org' },
    'arbitrum': { url: 'https://arbitrum.api.0x.org' },
};

interface ZeroExQuoteParams {
    sellToken: string;
    buyToken: string;
    sellAmount: string; // In base units (wei)
    slippagePercentage?: number;
    takerAddress: string; // Needed for RFQ and to estimate gas properly
    chainId?: string;
}

export async function getZeroExQuote(params: ZeroExQuoteParams) {
    const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;
    const feeRecipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT;
    const feeBps = process.env.NEXT_PUBLIC_AFFILIATE_FEE_BPS || '50';

    if (!apiKey) {
        throw new Error('Missing 0x API Key');
    }

    const chain = params.chainId?.toLowerCase() || 'ethereum';
    const config = CHAIN_CONFIG[chain] || CHAIN_CONFIG['ethereum'];
    const baseUrl = `${config.url}/swap/v1/quote`;

    // Construct query params
    const searchParams = new URLSearchParams({
        sellToken: params.sellToken,
        buyToken: params.buyToken,
        sellAmount: params.sellAmount,
        takerAddress: params.takerAddress,
        slippagePercentage: (params.slippagePercentage || 0.01).toString(),

        // Monetization Params (affiliateAddress is the correct field for 0x v1 quote)
        affiliateAddress: feeRecipient || '',
        buyTokenPercentageFee: (parseInt(feeBps) / 10000).toString(), // 0x expects decimal (e.g. 0.01 for 1%)
    });

    if (!feeRecipient) {
        console.warn('⚠️ No Affiliate Wallet set. Fees will not be collected.');
        searchParams.delete('affiliateAddress');
        searchParams.delete('buyTokenPercentageFee');
    }

    try {
        const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
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
