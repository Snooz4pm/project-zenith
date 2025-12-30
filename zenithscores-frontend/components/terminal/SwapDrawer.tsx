'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useSwitchChain, useBalance, usePublicClient } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { NormalizedToken } from '@/lib/dexscreener';
import { get0xQuote } from '@/lib/trading/zero-ex';
import { X, Loader2, ExternalLink, AlertCircle, Wallet, RefreshCw } from 'lucide-react';
// @ts-ignore
import { formatUnits } from 'viem';

interface SwapDrawerProps {
    token: NormalizedToken | null;
    onClose: () => void;
}

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
};

const CHAIN_SLUG_TO_ID: Record<string, number> = {
    'ethereum': 1,
    'base': 8453,
    'arbitrum': 42161
};

export default function SwapDrawer({ token, onClose }: SwapDrawerProps) {
    const { address, isConnected, chainId: connectedChainId } = useAccount();
    const { open } = useWeb3Modal();
    const { sendTransaction, isPending: isSending, data: hash } = useSendTransaction();
    const { switchChain } = useSwitchChain();
    const publicClient = usePublicClient();

    const [amount, setAmount] = useState('100');
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived State
    const targetChainId = CHAIN_SLUG_TO_ID[token?.chainId?.toLowerCase() || 'ethereum'] || 1;
    const isWrongNetwork = isConnected && connectedChainId !== targetChainId;
    const usdcAddress = USDC_ADDRESSES[targetChainId];

    // Balance Fetching
    const { data: usdcBalance, refetch: refetchBalance } = useBalance({
        address,
        token: usdcAddress,
        chainId: targetChainId, // Fetch balance on the target chain (even if wrong network connected, shows correct potential) - wait, useBalance might rely on connected provider? 
        // Actually best to rely on connected chain if it matches target, otherwise might fail or show 0.
        // Wagmi v2 query options
        query: {
            enabled: !!address && !isWrongNetwork && !!usdcAddress,
            refetchInterval: 10000
        }
    });

    // Auto-refetch balance after swap
    useEffect(() => {
        if (hash && publicClient) {
            publicClient.waitForTransactionReceipt({ hash }).then(() => {
                refetchBalance();
            });
        }
    }, [hash, publicClient, refetchBalance]);

    // Fetch quote
    useEffect(() => {
        if (!token || !isConnected || !address || !amount || parseFloat(amount) <= 0 || isWrongNetwork) {
            setQuote(null);
            return;
        }

        const fetchQuote = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await get0xQuote({
                    buyToken: token.address,
                    amount: parseFloat(amount),
                    takerAddress: address,
                    chainId: targetChainId
                });

                if (data.validationErrors && data.validationErrors.length > 0) {
                    throw new Error(data.validationErrors[0].reason);
                }

                setQuote(data);
            } catch (err: any) {
                console.error('Quote error:', err);
                // Nice user-friendly error for insufficient balance from API if it happens, though we handle it in UI too
                setError(err.message || 'Failed to get quote');
                setQuote(null);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchQuote, 500);
        return () => clearTimeout(debounce);
    }, [token, amount, address, isConnected, targetChainId, isWrongNetwork]);


    const handleSwap = () => {
        if (!isConnected) return handleConnect();
        if (isWrongNetwork) return switchChain({ chainId: targetChainId });
        if (!quote || !quote.to) return;

        console.log('Executing 0x swap on chain:', targetChainId);
        sendTransaction({
            to: quote.to,
            data: quote.data,
            value: BigInt(quote.value || 0),
        });
    };

    const handleConnect = () => open();

    const handleMax = () => {
        if (usdcBalance) {
            // Leave a tiny bit for gas if native token? No, USDC is ERC20. 
            // 0x quote takes amount in base units.
            // Just set exact formatted balance.
            setAmount(usdcBalance.formatted);
        }
    };

    if (!token) return null;

    const insufficientBalance = usdcBalance && parseFloat(amount) > parseFloat(usdcBalance.formatted);

    return (
        <>
            {/* Backdrop - High Z-index to cover Navbar (z-50) */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                onClick={onClose}
            />

            {/* Drawer Panel - Even higher Z-index */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a0c10] border-l border-zinc-800 shadow-2xl z-[100] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="font-bold text-white">{token.symbol}</div>
                            <div className="text-xs text-zinc-500">{token.name}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                            {token.chainName}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Price Context */}
                <div className="p-4 border-b border-zinc-800">
                    <div className="text-2xl font-mono font-bold text-white">
                        ${token.priceUsd.toFixed(token.priceUsd >= 1 ? 2 : 6)}
                    </div>
                    <div className={`text-sm font-bold ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}% (24h)
                    </div>
                </div>

                {/* Swap Form */}
                <div className="flex-1 p-4 overflow-auto">
                    {!isConnected ? (
                        <div className="text-center py-8">
                            <Wallet className="mx-auto text-zinc-600 mb-3" size={32} />
                            <p className="text-zinc-400 mb-4">Connect wallet to swap</p>
                            <button
                                onClick={handleConnect}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors"
                            >
                                Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Pay Input */}
                            <div className="bg-[#080a0e] p-4 rounded-lg border border-zinc-800">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs text-zinc-500">YOU PAY</div>
                                    <div className="text-xs text-zinc-400">
                                        Balance: {usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'}
                                        <button
                                            onClick={handleMax}
                                            className="ml-2 text-emerald-500 hover:text-emerald-400 font-bold"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={`flex-1 bg-transparent text-2xl font-mono outline-none ${insufficientBalance ? 'text-red-500' : 'text-white'}`}
                                        placeholder="0.00"
                                    />
                                    <span className="text-zinc-400 font-bold">USDC</span>
                                </div>
                            </div>

                            {/* Receive Output */}
                            <div className="bg-[#080a0e] p-4 rounded-lg border border-zinc-800">
                                <div className="text-xs text-zinc-500 mb-2">YOU RECEIVE</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 text-2xl font-mono text-zinc-300">
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : quote ? (
                                            parseFloat(formatUnits(BigInt(quote.buyAmount), 18)).toFixed(4)
                                        ) : (
                                            '0.0'
                                        )}
                                    </div>
                                    <span className="text-zinc-400 font-bold">{token.symbol}</span>
                                </div>
                            </div>

                            {/* Quote Details */}
                            {quote && (
                                <div className="p-3 bg-zinc-900/50 rounded-lg space-y-2 text-xs">
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Rate</span>
                                        <span className="font-mono">1 USDC ≈ {parseFloat(quote.price || '0').toFixed(6)} {token.symbol}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Platform Fee</span>
                                        <span className="text-emerald-500 font-bold">0.5%</span>
                                    </div>
                                </div>
                            )}

                            {/* Insufficient Balance Checking */}
                            {insufficientBalance && (
                                <div className="flex items-center gap-2 text-red-500 text-xs p-3 bg-red-500/10 rounded-lg">
                                    <AlertCircle size={14} />
                                    Insufficient USDC balance
                                </div>
                            )}

                            {/* API Error */}
                            {error && !insufficientBalance && (
                                <div className="flex items-center gap-2 text-red-500 text-xs p-3 bg-red-500/10 rounded-lg">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            {/* Success Message */}
                            {hash && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <div className="text-emerald-400 text-xs font-bold mb-1">Transaction Sent!</div>
                                    <a
                                        href={`${token.chainId === 'base' ? 'https://basescan.org' : token.chainId === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'}/tx/${hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 underline underline-offset-2"
                                    >
                                        View on Explorer <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}

                            {/* Swap Button */}
                            <button
                                onClick={handleSwap}
                                disabled={!isConnected || isWrongNetwork || insufficientBalance || !quote || loading || isSending}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${(!isConnected || isWrongNetwork || insufficientBalance || !quote || loading)
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                    }`}
                            >
                                {!isConnected ? (
                                    <>
                                        <Wallet size={20} /> Connect Wallet
                                    </>
                                ) : isWrongNetwork ? (
                                    <>
                                        <RefreshCw size={20} /> Switch to {token.chainName}
                                    </>
                                ) : insufficientBalance ? (
                                    'Insufficient USDC'
                                ) : isSending ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} /> Confirm in Wallet
                                    </>
                                ) : loading ? (
                                    'Getting Quote...'
                                ) : (
                                    'Swap Now'
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800">
                    <a
                        href={token.dexUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        View on DexScreener <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </>
    );
}
