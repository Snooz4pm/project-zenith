// 1inch Fusion+ API Integration
// API Docs: https://portal.1inch.dev/documentation/apis/swap

const ONEINCH_BASE_URL = 'https://api.1inch.dev';
const API_KEY = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

if (!API_KEY) {
    console.error('⚠️ NEXT_PUBLIC_ONEINCH_API_KEY not set! Add to .env.local');
}

// Chain IDs for 1inch
export const ONEINCH_CHAIN_IDS: Record<string, number> = {
    'ethereum': 1,
    'polygon': 137,
    'arbitrum': 42161,
    'base': 8453,
    'optimism': 10,
    'avalanche': 43114,
    'bsc': 56,
};

export interface SwapQuote {
    fromToken: {
        address: string;
        symbol: string;
        decimals: number;
    };
    toToken: {
        address: string;
        symbol: string;
        decimals: number;
    };
    fromAmount: string;
    toAmount: string;
    protocols: any[][];
    estimatedGas: number;
}

export interface SwapTransaction {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
}

/**
 * Get swap quote from 1inch
 */
export async function getSwapQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress?: string,
    slippage: number = 1
): Promise<SwapQuote | null> {
    try {
        const params = new URLSearchParams({
            src: fromTokenAddress,
            dst: toTokenAddress,
            amount: amount,
            ...(fromAddress && { from: fromAddress }),
            slippage: slippage.toString(),
            disableEstimate: 'false',
            allowPartialFill: 'false',
        });

        const response = await fetch(
            `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/quote?${params}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('1inch quote error:', error);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('1inch getSwapQuote error:', error);
        return null;
    }
}

/**
 * Build swap transaction
 */
export async function buildSwapTransaction(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1,
    referrer?: string
): Promise<SwapTransaction | null> {
    try {
        const params = new URLSearchParams({
            src: fromTokenAddress,
            dst: toTokenAddress,
            amount: amount,
            from: fromAddress,
            slippage: slippage.toString(),
            disableEstimate: 'false',
            allowPartialFill: 'false',
            ...(referrer && { referrer }),
        });

        const response = await fetch(
            `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/swap?${params}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('1inch swap build error:', error);
            return null;
        }

        const data = await response.json();
        return data.tx;
    } catch (error) {
        console.error('1inch buildSwapTransaction error:', error);
        return null;
    }
}

/**
 * Get list of supported tokens for a chain
 */
export async function getSupportedTokens(chainId: number): Promise<any> {
    try {
        const response = await fetch(
            `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/tokens`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('1inch tokens error:', response.status);
            return {};
        }

        const data = await response.json();
        return data.tokens || {};
    } catch (error) {
        console.error('1inch getSupportedTokens error:', error);
        return {};
    }
}

/**
 * Get spender address for token approvals
 */
export async function getSpenderAddress(chainId: number): Promise<string | null> {
    try {
        const response = await fetch(
            `${ONEINCH_BASE_URL}/swap/v6.0/${chainId}/approve/spender`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data.address;
    } catch (error) {
        console.error('1inch getSpenderAddress error:', error);
        return null;
    }
}

/**
 * Helper: Format token amount with decimals
 */
export function formatTokenAmount(amount: string, decimals: number): string {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholePart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === BigInt(0)) {
        return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    return `${wholePart}.${fractionalStr}`.replace(/\.?0+$/, '');
}

/**
 * Helper: Parse token amount to wei
 */
export function parseTokenAmount(amount: string, decimals: number): string {
    const [whole, fraction = '0'] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return (BigInt(whole + paddedFraction)).toString();
}
