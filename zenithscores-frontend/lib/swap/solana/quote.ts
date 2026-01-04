import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Solana Quote Fetcher (Jupiter API v6)
 * 
 * READ-ONLY - No wallet required
 * Uses Jupiter's direct API (no SDK needed for quotes)
 */

export interface SolanaQuoteParams {
    inputMint: string;
    outputMint: string;
    amount: number; // in lamports/smallest unit
    slippageBps?: number;
}

export interface SolanaQuote {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    priceImpactPct: string;
    routePlan: any[];
}

export async function getSolanaQuote(params: SolanaQuoteParams): Promise<SolanaQuote> {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;

    const queryParams = new URLSearchParams({
        inputMint,
        outputMint,
        amount: String(amount),
        slippageBps: String(slippageBps),
    });

    const res = await fetch(
        `https://quote-api.jup.ag/v6/quote?${queryParams.toString()}`
    );

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'No Solana route available');
    }

    return res.json();
}

/**
 * Helper: Convert token amount to lamports (with decimals)
 */
export function toSolanaAmount(amount: number, decimals: number): number {
    return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Helper: Convert lamports to token amount (with decimals)
 */
export function fromSolanaAmount(lamports: number, decimals: number): number {
    return lamports / Math.pow(10, decimals);
}
