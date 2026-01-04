import { Connection, VersionedTransaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { SolanaQuote } from './quote';

/**
 * Solana Swap Execution
 * 
 * WRITE operation - requires connected wallet
 * Two-step process: 1) Get swap transaction, 2) Sign and send
 */

/**
 * Step 1: Get swap transaction via API route (which forwards to Railway proxy)
 */
export async function getSolanaSwapTransaction(
    quoteResponse: SolanaQuote,
    userPublicKey: string
): Promise<{ swapTransaction: string; lastValidBlockHeight?: number }> {
    console.log('[Solana Swap] Getting swap transaction');
    console.log('[Solana Swap] User:', userPublicKey);

    // Call our API route which forwards to Railway proxy
    const res = await fetch('/api/arena/solana/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            quoteResponse,
            userPublicKey,
            wrapAndUnwrapSol: true,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('[Solana Swap] API error:', data);
        throw new Error(data.error || 'Failed to build swap transaction');
    }

    if (!data.swapTransaction) {
        console.error('[Solana Swap] No swapTransaction in response:', data);
        throw new Error('No swap transaction returned');
    }

    console.log('[Solana Swap] Swap transaction received');
    return data;
}

/**
 * Step 2: Sign and execute Solana swap
 */
export async function executeSolanaSwap(
    swapTransactionBase64: string,
    wallet: WalletContextState,
    connection: Connection
): Promise<string> {
    console.log('[Solana Swap] Executing swap...');

    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing');
    }

    // Deserialize - MUST use VersionedTransaction
    const swapTransactionBuf = Buffer.from(swapTransactionBase64, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    console.log('[Solana Swap] Transaction deserialized, requesting signature...');

    // Sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);

    console.log('[Solana Swap] Transaction signed, sending to network...');

    // Send and confirm
    const rawTransaction = signedTransaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        maxRetries: 2,
    });

    console.log('[Solana Swap] Transaction sent:', txid);
    console.log('[Solana Swap] Waiting for confirmation...');

    // Wait for confirmation
    await connection.confirmTransaction(txid, 'confirmed');

    console.log('[Solana Swap] Transaction confirmed!');
    return txid;
}
