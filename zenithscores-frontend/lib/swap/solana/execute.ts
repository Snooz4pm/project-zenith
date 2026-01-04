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
    console.log('[Solana Swap] Getting swap transaction from Jupiter');
    console.log('[Solana Swap] Input:', {
        inputMint: quote.inputMint,
        outputMint: quote.outputMint,
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        userPublicKey,
    });

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

    console.log('[Solana Swap] Jupiter swap response status:', res.status);

    if (!res.ok) {
        const text = await res.text();
        console.error('[Solana Swap] Jupiter error:', text);
        throw new Error(`Failed to build swap transaction: ${text}`);
    }

    const data = await res.json();

    if (!data.swapTransaction) {
        console.error('[Solana Swap] No swapTransaction in response:', data);
        throw new Error('No swap transaction returned from Jupiter');
    }

    console.log('[Solana Swap] Swap transaction received successfully');
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

    // Deserialize the transaction
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
