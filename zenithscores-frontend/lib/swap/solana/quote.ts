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

export interface SolanaQuote {
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
export async function getSolanaQuote(params: SolanaQuoteParams): Promise<SolanaQuote> {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;

    // Ensure amount is stringified integer (lamports) - CRITICAL for Jupiter
    const amountStr = String(Math.floor(amount));

    // Validation: amount must be positive integer (no floats, no decimals)
    if (!/^\d+$/.test(amountStr) || Number(amountStr) < 1) {
        throw new Error('Invalid swap amount - must be at least 1 lamport');
    }

    // Jupiter minimum: 0.001 SOL = 1,000,000 lamports (prevents "no route" for dust amounts)
    const MIN_AMOUNT_LAMPORTS = 1_000_000;
    if (Number(amountStr) < MIN_AMOUNT_LAMPORTS) {
        throw new Error('Amount too small - minimum 0.001 SOL required');
    }

    // Build query params
    const queryParams = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amountStr, // CRITICAL: Must be stringified integer
        slippageBps: String(slippageBps),
    });

    console.log('[getSolanaQuote] Requesting quote:', {
        inputMint,
        outputMint,
        amount: amountStr,
        slippageBps
    });

    // Call OUR API proxy (not Jupiter directly - avoids CORS)
    const res = await fetch(`/api/arena/solana/quote?${queryParams.toString()}`);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[getSolanaQuote] API error:', error);
        throw new Error(error.error || error.details || 'No Solana route available');
    }

    return res.json();
}
