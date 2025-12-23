// Jupiter Ultra API Integration for Solana Swaps
// API Docs: https://station.jup.ag/docs/apis/swap-api
// Ultra Endpoint: https://api.jup.ag/ultra

const JUPITER_ULTRA_API = 'https://api.jup.ag/ultra';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';

export interface JupiterQuote {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    priceImpactPct: number;
    routePlan: any[];
}

export interface JupiterSwapInstructions {
    tokenLedgerInstruction: any;
    computeBudgetInstructions: any[];
    setupInstructions: any[];
    swapInstruction: any;
    cleanupInstruction: any;
    addressLookupTableAddresses: string[];
}

/**
 * Get swap quote from Jupiter
 */
export async function getJupiterQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 100 // 1% = 100 bps
): Promise<JupiterQuote | null> {
    try {
        const params = new URLSearchParams({
            inputMint,
            outputMint,
            amount,
            slippageBps: slippageBps.toString(),
            onlyDirectRoutes: 'false',
            asLegacyTransaction: 'false',
        });

        const response = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`);

        if (!response.ok) {
            console.error('Jupiter quote error:', response.status);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Jupiter getQuote error:', error);
        return null;
    }
}

/**
 * Get swap instructions from Jupiter
 */
export async function getJupiterSwapInstructions(
    quoteResponse: JupiterQuote,
    userPublicKey: string,
    wrapUnwrapSOL: boolean = true,
    feeAccount?: string
): Promise<JupiterSwapInstructions | null> {
    try {
        const response = await fetch(`${JUPITER_QUOTE_API}/swap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol: wrapUnwrapSOL,
                ...(feeAccount && { feeAccount }),
            }),
        });

        if (!response.ok) {
            console.error('Jupiter swap instructions error:', response.status);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Jupiter getSwapInstructions error:', error);
        return null;
    }
}

/**
 * Get list of all tokens on Solana
 */
export async function getJupiterTokens(): Promise<any[]> {
    try {
        const response = await fetch('https://token.jup.ag/all');

        if (!response.ok) {
            console.error('Jupiter tokens error:', response.status);
            return [];
        }

        const tokens = await response.json();
        return tokens;
    } catch (error) {
        console.error('Jupiter getTokens error:', error);
        return [];
    }
}

/**
 * Get price for a token in USDC
 */
export async function getJupiterPrice(mintAddress: string): Promise<number | null> {
    try {
        const response = await fetch(
            `https://price.jup.ag/v4/price?ids=${mintAddress}`
        );

        if (!response.ok) {
            console.error('Jupiter price error:', response.status);
            return null;
        }

        const data = await response.json();
        return data.data[mintAddress]?.price || null;
    } catch (error) {
        console.error('Jupiter getPrice error:', error);
        return null;
    }
}

/**
 * Popular Solana token addresses
 */
export const SOLANA_TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
} as const;

/**
 * Helper: Format Solana amount (9 decimals for SOL)
 */
export function formatSolanaAmount(amount: string, decimals: number = 9): string {
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
 * Helper: Parse Solana amount to lamports
 */
export function parseSolanaAmount(amount: string, decimals: number = 9): string {
    const [whole, fraction = '0'] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return (BigInt(whole + paddedFraction)).toString();
}
