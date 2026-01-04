import { WalletClient } from 'viem';
import { EvmQuote } from './quote';

/**
 * EVM Swap Execution
 * 
 * WRITE operation - requires connected wallet
 * Only call after quote + optional approval
 */

export async function executeEvmSwap(
    quote: EvmQuote,
    walletClient: WalletClient
): Promise<string> {
    if (!walletClient.account) {
        throw new Error('Wallet not connected');
    }

    // Send the swap transaction
    const txHash = await walletClient.sendTransaction({
        to: quote.to as `0x${string}`,
        data: quote.data as `0x${string}`,
        value: BigInt(quote.value || '0'),
        gas: BigInt(quote.gas),
        account: walletClient.account,
        chain: walletClient.chain,
    });

    return txHash;
}
