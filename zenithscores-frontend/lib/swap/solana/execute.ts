import { Connection, VersionedTransaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { SolanaQuote } from './quote';

/**
 * Solana Swap Execution (Jupiter API v6)
 * 
 * WRITE operation - requires connected wallet
 * Two-step process: 1) Get swap transaction, 2) Sign and send
 */

/**
 * Step 1: Get swap transaction from Jupiter
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
 * Step 2: Sign and execute Solana swap
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
