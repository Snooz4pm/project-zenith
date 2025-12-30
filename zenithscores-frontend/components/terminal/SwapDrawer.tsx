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
            {/* Backdrop - Animated */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[90] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Premium Bottom Sheet with Glassmorphism */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#0a0c10] via-[#0f1219] to-[#0a0c10] border-t border-purple-500/20 rounded-t-3xl shadow-[0_-10px_80px_rgba(139,92,246,0.15)] z-[100] max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">

                {/* Glow Effect Top Border */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />

                {/* Header - Premium Style */}
                <div className="relative p-5 border-b border-zinc-800/50 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Token Info with Glow */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
                                <div className="relative bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-3 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                        {token.symbol}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="font-bold text-white text-lg">{token.name}</div>
                                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-zinc-800/50 text-zinc-300 rounded-full border border-zinc-700/50 backdrop-blur-sm mt-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    {token.chainName}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Price Display - Enhanced */}
                            <div className="text-right bg-zinc-900/40 px-4 py-2 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                                <div className="text-xl font-mono font-black bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                                    ${token.priceUsd.toFixed(token.priceUsd >= 1 ? 2 : 6)}
                                </div>
                                <div className={`text-sm font-bold flex items-center gap-1 ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {token.priceChange24h >= 0 ? '↗' : '↘'}
                                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                                </div>
                            </div>

                            {/* Close Button - Stylish */}
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-zinc-800/50 hover:bg-red-500/20 rounded-xl text-zinc-400 hover:text-red-400 transition-all duration-200 border border-zinc-700/50 hover:border-red-500/30"
                            >
                                <X size={22} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Swap Form - Premium Design */}
                <div className="p-5">
                    {!isConnected ? (
                        <div className="text-center py-8 px-4">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                                <div className="relative bg-gradient-to-br from-purple-600/10 to-blue-600/10 p-4 rounded-2xl border border-purple-500/20">
                                    <Wallet className="text-purple-400" size={32} />
                                </div>
                            </div>
                            <p className="text-zinc-300 mb-4 text-base font-medium">Connect wallet to start swapping</p>
                            <button
                                onClick={handleConnect}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25"
                            >
                                Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Pay Input - Premium Glass Card */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                                <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">You Pay</div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-zinc-500">Balance:</span>
                                            <span className="text-white font-mono">
                                                {usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'}
                                            </span>
                                            <button
                                                onClick={handleMax}
                                                className="px-2 py-0.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 font-bold rounded border border-purple-500/30 transition-all"
                                            >
                                                MAX
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className={`flex-1 bg-transparent text-2xl font-mono font-bold outline-none ${insufficientBalance ? 'text-red-400' : 'text-white'}`}
                                            placeholder="0.00"
                                        />
                                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
                                            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                $
                                            </div>
                                            <span className="text-white font-bold">USDC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Swap Arrow - Animated */}
                            <div className="flex justify-center -my-2 relative z-10">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-30" />
                                    <button className="relative bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-2.5 rounded-full border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all hover:scale-110 backdrop-blur-sm">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Receive Output - Premium Glass Card */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                                <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">You Receive</div>
                                        {quote && (
                                            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-semibold">
                                                Best Price
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 text-2xl font-mono font-bold text-emerald-400">
                                            {loading ? (
                                                <Loader2 className="animate-spin text-purple-400" size={24} />
                                            ) : quote ? (
                                                parseFloat(formatUnits(BigInt(quote.buyAmount), 18)).toFixed(4)
                                            ) : (
                                                <span className="text-zinc-600">0.0</span>
                                            )}
                                        </div>
                                        <div className="px-3 py-2 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
                                            <span className="text-white font-bold">{token.symbol}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Error Messages - Premium Style */}
                            {insufficientBalance && (
                                <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
                                    <AlertCircle size={16} />
                                    <span className="font-medium">Insufficient USDC balance</span>
                                </div>
                            )}

                            {error && !insufficientBalance && (
                                <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
                                    <AlertCircle size={16} />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {/* Success Message - Premium */}
                            {hash && (
                                <div className="relative p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-cyan-400/5 rounded-xl blur-xl" />
                                    <div className="relative">
                                        <div className="text-emerald-400 text-sm font-bold mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                            Transaction Sent!
                                        </div>
                                        <a
                                            href={`${token.chainId === 'base' ? 'https://basescan.org' : token.chainId === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'}/tx/${hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors group"
                                        >
                                            View on Explorer
                                            <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Swap Button - Ultra Premium */}
                            <div className="relative group">
                                {!isConnected || isWrongNetwork || insufficientBalance || !quote || loading ? null : (
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-all" />
                                )}
                                <button
                                    onClick={handleSwap}
                                    disabled={!isConnected || isWrongNetwork || insufficientBalance || !quote || loading || isSending}
                                    className={`relative w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                                        !isConnected || isWrongNetwork || insufficientBalance || !quote || loading
                                            ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]'
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
                                        <>
                                            <AlertCircle size={20} /> Insufficient USDC
                                        </>
                                    ) : isSending ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} /> Confirm in Wallet
                                        </>
                                    ) : loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} /> Getting Quote...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Swap Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Premium Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-zinc-800/50">
                    <a
                        href={token.dexUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-purple-400 transition-colors group"
                    >
                        <span>View on DexScreener</span>
                        <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                    <div className="text-center mt-2 text-[10px] text-zinc-600">
                        Powered by 0x Protocol
                    </div>
                </div>
            </div>
        </>
    );
}
