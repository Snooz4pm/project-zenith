import { WalletClient } from 'viem';

/**
 * EVM Swap Engine (0x Protocol)
 * 
 * Clean, read-only quote fetching + wallet-gated execution
 * No auto-connect, no prefetching, no magic
 */

export interface EvmQuoteParams {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    chainId: number;
    takerAddress?: string;
}

export interface EvmQuote {
    price: string;
    guaranteedPrice: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
    buyAmount: string;
    sellAmount: string;
    allowanceTarget?: string;
    estimatedPriceImpact?: string;
}

/**
 * Fetch quote from 0x (READ-ONLY)
 * Does NOT require wallet connection
 */
export async function getEvmQuote(params: EvmQuoteParams): Promise<EvmQuote> {
    const { sellToken, buyToken, sellAmount, chainId, takerAddress } = params;

    const queryParams = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        chainId: String(chainId),
    });

    if (takerAddress) {
        queryParams.append('takerAddress', takerAddress);
    }

    const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;
    if (!apiKey) {
        throw new Error('0x API key not configured');
    }

    const res = await fetch(
        `https://api.0x.org/swap/v1/quote?${queryParams.toString()}`,
        {
            headers: {
                '0x-api-key': apiKey,
            },
        }
    );

    if (!res.ok) {
        const error = await res.json().catch(() => ({ reason: 'Unknown error' }));
        throw new Error(error.reason || 'No route available');
    }

    return res.json();
}

/**
 * Execute EVM swap (WRITE)
 * Requires connected wallet
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
        value: BigInt(quote.value),
        gas: BigInt(quote.gas),
        account: walletClient.account,
        chain: walletClient.chain,
    });

    return txHash;
}

/**
 * Check if token approval is needed
 * Returns approval transaction if needed, null otherwise
 */
export async function checkEvmApproval(
    quote: EvmQuote,
    walletClient: WalletClient
): Promise<boolean> {
    // If allowanceTarget exists, approval is needed
    return !!quote.allowanceTarget;
}

/**
 * Execute token approval (if needed)
 */
export async function executeEvmApproval(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    walletClient: WalletClient
): Promise<string> {
    if (!walletClient.account) {
        throw new Error('Wallet not connected');
    }

    // ERC20 approve function signature
    const approveData = `0x095ea7b3${spenderAddress.slice(2).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}`;

    const txHash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data: approveData as `0x${string}`,
        account: walletClient.account,
        chain: walletClient.chain,
    });

    return txHash;
}
