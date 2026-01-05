/**
 * Solana Swap Helpers
 * 
 * Re-exports and adapters for Jupiter swap functionality.
 * Used by SolanaSwapDrawer.
 */

import { Connection, VersionedTransaction } from '@solana/web3.js';

export interface SolanaQuoteParams {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
}

export interface SolanaQuoteResponse {
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

/**
 * Fetch quote from Jupiter API
 */
export async function getSolanaQuote(params: SolanaQuoteParams): Promise<SolanaQuoteResponse> {
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
        throw new Error(error.error || 'No route available');
    }

    return res.json();
}

/**
 * Get swap transaction from Jupiter
 */
export async function getSolanaSwapTransaction(params: {
    quoteResponse: SolanaQuoteResponse;
    userPublicKey: string;
}): Promise<string> {
    const { quoteResponse, userPublicKey } = params;

    const res = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quoteResponse,
            userPublicKey,
            wrapAndUnwrapSol: true,
        }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to build swap transaction');
    }

    const data = await res.json();
    return data.swapTransaction;
}

/**
 * Execute Solana swap via wallet signing
 */
export async function executeSolanaSwap(params: {
    swapTransaction: string;
    connection: Connection;
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
}): Promise<string> {
    const { swapTransaction, connection, signTransaction } = params;

    // Deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Sign the transaction
    const signedTransaction = await signTransaction(transaction);

    // Send and confirm
    const rawTransaction = signedTransaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        maxRetries: 2,
    });

    // Wait for confirmation
    await connection.confirmTransaction(txid, 'confirmed');

    return txid;
}
