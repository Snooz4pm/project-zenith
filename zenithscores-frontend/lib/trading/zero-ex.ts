
// BSC ONLY - no other EVM chains supported
const CHAIN_API_URLS: Record<number, string> = {
    56: 'https://bsc.api.0x.org'
};

const USDC_ADDRESSES: Record<number, string> = {
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' // BSC USDC
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
    chainId
}: QuoteParams) {

    // Default to USDC for the "other" side of the trade
    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) throw new Error(`Unsupported chain ID: ${chainId}`);

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

// Wrapper function with simplified parameters for general swap components
export interface SimpleQuoteParams {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    takerAddress: string;
    slippagePercentage?: number;
    chainId?: number;
}

export async function getZeroExQuote(params: SimpleQuoteParams) {
    const chainId = params.chainId || 56; // Default to BSC (only supported EVM chain)

    // Convert sellAmount from wei string to number for amount
    // For ETH/WETH, 18 decimals; for USDC/USDT, 6 decimals
    // We'll pass the raw string amount to the API directly

    const apiParams = new URLSearchParams({
        chainId: chainId.toString(),
        sellToken: params.sellToken,
        buyToken: params.buyToken,
        sellAmount: params.sellAmount,
        takerAddress: params.takerAddress,
        slippagePercentage: (params.slippagePercentage || 0.01).toString()
    });

    const apiBaseUrl = CHAIN_API_URLS[chainId];
    if (!apiBaseUrl) throw new Error(`No 0x API URL for chain ${chainId}`);

    const url = `${apiBaseUrl}/swap/v1/quote?${apiParams.toString()}`;

    const res = await fetch(url, {
        headers: {
            '0x-api-key': process.env.NEXT_PUBLIC_0X_API_KEY || '',
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
