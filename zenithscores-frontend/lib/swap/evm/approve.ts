import { WalletClient } from 'viem';
import { EvmQuote } from './quote';

/**
 * EVM Token Approval Handler
 * 
 * ONLY call this after user clicks "Swap"
 * Never auto-approve
 */

export async function approveEvmIfNeeded(
    quote: EvmQuote,
    walletClient: WalletClient
): Promise<void> {
    // If no approval needed, skip
    if (!quote.allowanceTarget || !quote.approvalData) {
        return;
    }

    if (!walletClient.account) {
        throw new Error('Wallet not connected');
    }

    // Send approval transaction
    await walletClient.sendTransaction({
        to: quote.allowanceTarget as `0x${string}`,
        data: quote.approvalData as `0x${string}`,
        account: walletClient.account,
        chain: walletClient.chain,
    });
}
