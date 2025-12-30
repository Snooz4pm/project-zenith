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
        chainId: targetChainId,
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
            setAmount(usdcBalance.formatted);
        }
    };

    if (!token) return null;

    const insufficientBalance = usdcBalance && parseFloat(amount) > parseFloat(usdcBalance.formatted);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                onClick={onClose}
            />

            {/* Right Side Panel - Medium Width, Dark Green Theme */}
            <div className="fixed top-20 right-4 bottom-4 w-80 bg-emerald-950/95 border border-emerald-500/20 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden">

                {/* Subtle Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative p-4 border-b border-emerald-500/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                <span className="text-emerald-400 font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{token.symbol}</div>
                                <div className="text-[10px] text-emerald-400/60">{token.chainName}</div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-mono font-bold text-white">
                            ${token.priceUsd.toFixed(token.priceUsd >= 1 ? 2 : 6)}
                        </span>
                        <span className={`text-xs font-bold ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </span>
                    </div>
                </div>

                {/* Swap Form */}
                <div className="relative flex-1 p-4 overflow-auto">
                    {!isConnected ? (
                        <div className="text-center py-8">
                            <Wallet className="mx-auto text-emerald-500/40 mb-3" size={28} />
                            <p className="text-zinc-400 mb-4 text-sm">Connect wallet to swap</p>
                            <button
                                onClick={handleConnect}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-lg transition-colors"
                            >
                                Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Pay Input */}
                            <div className="bg-black/30 p-3 rounded-xl border border-emerald-500/10">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">You Pay</span>
                                    <div className="text-[10px] text-zinc-400">
                                        Bal: {usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00'}
                                        <button
                                            onClick={handleMax}
                                            className="ml-1.5 text-emerald-400 hover:text-emerald-300 font-bold"
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
                                        className={`flex-1 bg-transparent text-lg font-mono font-bold outline-none ${insufficientBalance ? 'text-red-400' : 'text-white'}`}
                                        placeholder="0.00"
                                    />
                                    <span className="text-emerald-400/60 font-bold text-sm">USDC</span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center">
                                <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400/60">
                                    ↓
                                </div>
                            </div>

                            {/* Receive Output */}
                            <div className="bg-black/30 p-3 rounded-xl border border-emerald-500/10">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">You Receive</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 text-lg font-mono font-bold text-emerald-400">
                                        {loading ? (
                                            <Loader2 className="animate-spin text-emerald-400/50" size={18} />
                                        ) : quote ? (
                                            parseFloat(formatUnits(BigInt(quote.buyAmount), 18)).toFixed(4)
                                        ) : (
                                            <span className="text-zinc-600">0.0</span>
                                        )}
                                    </div>
                                    <span className="text-emerald-400/60 font-bold text-sm">{token.symbol}</span>
                                </div>
                            </div>

                            {/* Errors */}
                            {insufficientBalance && (
                                <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <AlertCircle size={12} />
                                    Insufficient balance
                                </div>
                            )}

                            {error && !insufficientBalance && (
                                <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <AlertCircle size={12} />
                                    {error}
                                </div>
                            )}

                            {/* Success */}
                            {hash && (
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <div className="text-emerald-400 text-xs font-bold mb-1">Transaction Sent</div>
                                    <a
                                        href={`${token.chainId === 'base' ? 'https://basescan.org' : token.chainId === 'arbitrum' ? 'https://arbiscan.io' : 'https://etherscan.io'}/tx/${hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                                    >
                                        View on Explorer <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}

                            {/* Swap Button */}
                            <button
                                onClick={handleSwap}
                                disabled={!isConnected || isWrongNetwork || insufficientBalance || !quote || loading || isSending}
                                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${!isConnected || isWrongNetwork || insufficientBalance || !quote || loading
                                        ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                    }`}
                            >
                                {!isConnected ? (
                                    <><Wallet size={16} /> Connect</>
                                ) : isWrongNetwork ? (
                                    <><RefreshCw size={16} /> Switch Network</>
                                ) : insufficientBalance ? (
                                    'Insufficient USDC'
                                ) : isSending ? (
                                    <><Loader2 className="animate-spin" size={16} /> Confirming...</>
                                ) : loading ? (
                                    'Getting Quote...'
                                ) : (
                                    'Swap'
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="relative px-4 py-3 border-t border-emerald-500/10">
                    <a
                        href={token.dexUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors"
                    >
                        DexScreener <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </>
    );
}
