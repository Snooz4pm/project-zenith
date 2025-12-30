
const CHAIN_API_URLS: Record<number, string> = {
    1: 'https://api.0x.org',
    8453: 'https://base.api.0x.org',
    42161: 'https://arbitrum.api.0x.org'
};

const USDC_ADDRESSES: Record<number, string> = {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
};

export interface QuoteParams {
    buyToken: string; // Address
    sellToken?: string; // Address, defaults to USDC if not provided
    amount: number; // Raw number (e.g. 41)
    takerAddress: string;
    chainId: number;
    isSell?: boolean; // If true, we are selling buyToken for USDC
}

export async function get0xQuote({
    buyToken,
    sellToken,
    amount,
    takerAddress,
    chainId,
    isSell = false
}: QuoteParams) {

    // Default to USDC for the "other" side of the trade
    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) throw new Error(`Unsupported chain ID: ${chainId}`);

    const effectiveSellToken = sellToken || usdcAddress;
    const effectiveBuyToken = buyToken || usdcAddress; // If we are selling, buyToken in param is what we sell, so we buy USDC ?? Wait.

    // RE-LOGIC: 
    // If buying X: Sell USDC, Buy X. sellAmount = amount of USDC.
    // If selling X: Sell X, Buy USDC. sellAmount = amount of X.

    // Assuming standard "Buy X with USDC" flow for now based on user context
    // The user input 41 USDC to buy Token.

    const apiBaseUrl = CHAIN_API_URLS[chainId];
    if (!apiBaseUrl) throw new Error(`No 0x API URL for chain ${chainId}`);

    // USDC has 6 decimals on all these chains
    const sellAmountBase = Math.floor(amount * 1000000).toString();

    const params = new URLSearchParams({
        chainId: chainId.toString(),
        sellToken: usdcAddress, // Always paying with USDC for now based on UI
        buyToken: buyToken,     // The token we want
        sellAmount: sellAmountBase,
        takerAddress,
        affiliateAddress: process.env.NEXT_PUBLIC_FEE_RECIPIENT || '',
        buyTokenPercentageFee: '0.005', // 0.5%
        slippagePercentage: '0.01' // 1%
    });

    // Remove empty affiliate if missing
    if (!params.get('affiliateAddress')) {
        params.delete('affiliateAddress');
        params.delete('buyTokenPercentageFee');
    }

    const url = `${apiBaseUrl}/swap/v1/quote?${params.toString()}`;

    console.log('fetching quote:', url);

    const res = await fetch(url, {
        headers: {
            '0x-api-key': process.env.NEXT_PUBLIC_0X_API_KEY!,
            'Accept': 'application/json',
        }
    });

    if (!res.ok) {
        const errText = await res.text();
        let errMsg = errText;
        try {
            const jsonErr = JSON.parse(errText);
            errMsg = jsonErr.reason || jsonErr.message || errText;
        } catch { }

        console.error('0x Quote Failed:', errMsg);
        throw new Error(errMsg);
    }

    return await res.json();
}
