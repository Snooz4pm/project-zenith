import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

/**
 * Solana Swap Engine (Jupiter Protocol)
 * 
 * Clean, deterministic routing + wallet-gated execution
 * No auto-connect, no prefetching, no assumptions
 */

export interface SolanaQuoteParams {
    inputMint: string;
    outputMint: string;
    amount: number;
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

/**
 * Fetch quote from Jupiter (READ-ONLY)
 * Does NOT require wallet connection
 */
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
        throw new Error(error.error || 'No route available');
    }

    return res.json();
}

/**
 * Get swap transaction from Jupiter
 * Requires user's public key but NOT signature yet
 */
export async function getSolanaSwapTransaction(
    quote: SolanaQuote,
    userPublicKey: string
): Promise<{ swapTransaction: string }> {
    const res = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey,
            wrapAndUnwrapSol: true,
            // feeAccount: 'YOUR_FEE_ACCOUNT_HERE', // Optional: for revenue
        }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to build swap transaction');
    }

    return res.json();
}

/**
 * Execute Solana swap (WRITE)
 * Requires connected wallet with signing capability
 */
export async function executeSolanaSwap(
    swapTransactionBase64: string,
    wallet: WalletContextState,
    connection: Connection
): Promise<string> {
    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing');
    }

    // Deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransactionBase64, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);

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
