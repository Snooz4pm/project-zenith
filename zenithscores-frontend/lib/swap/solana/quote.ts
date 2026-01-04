/**
 * Solana Quote Fetcher (Jupiter v6)
 * 
 * READ-ONLY - No wallet required
 * Routes through API proxy to avoid CORS
 */

export interface SolanaQuoteParams {
    inputMint: string;
    outputMint: string;
    amount: number; // In base units (lamports, smallest token unit)
    slippageBps?: number; // Default 50 = 0.5%
}

export interface JupiterQuote {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    platformFee: any;
    priceImpactPct: string;
    routePlan: any[];
    contextSlot?: number;
    timeTaken?: number;
}

/**
 * Convert SOL/token amount to smallest unit (lamports = 10^9)
 */
export function toSolanaAmount(amount: number, decimals: number = 9): number {
    return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Convert lamports to human-readable amount
 */
export function fromSolanaAmount(lamports: number, decimals: number = 9): number {
    return lamports / Math.pow(10, decimals);
}

/**
 * Get Solana swap quote from Jupiter (via our API proxy)
 */
export async function getSolanaQuote(params: SolanaQuoteParams): Promise<JupiterQuote> {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;

    // Build query params
    const queryParams = new URLSearchParams({
        inputMint,
        outputMint,
        amount: String(amount),
        slippageBps: String(slippageBps),
    });

    // Call OUR API proxy (not Jupiter directly - avoids CORS)
    const res = await fetch(`/api/arena/solana/quote?${queryParams.toString()}`);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'No Solana route available');
    }

    return res.json();
}
