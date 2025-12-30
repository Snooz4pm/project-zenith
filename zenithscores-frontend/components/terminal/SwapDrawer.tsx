'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useConnect } from 'wagmi';
import { NormalizedToken } from '@/lib/dexscreener';
import { getZeroExQuote } from '@/lib/trading/zero-ex';
import { X, Loader2, ExternalLink, AlertCircle, Wallet } from 'lucide-react';
// @ts-ignore
import { parseUnits, formatUnits } from 'viem';

interface SwapDrawerProps {
    token: NormalizedToken | null;
    onClose: () => void;
}

const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const DEFAULT_AMOUNT = '100'; // $100 default

export default function SwapDrawer({ token, onClose }: SwapDrawerProps) {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending: isConnecting } = useConnect();
    const { sendTransaction, isPending: isSending } = useSendTransaction();

    const [amount, setAmount] = useState(DEFAULT_AMOUNT);
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch quote when token or amount changes
    useEffect(() => {
        if (!token || !isConnected || !address || !amount || parseFloat(amount) <= 0) {
            setQuote(null);
            return;
        }

        const fetchQuote = async () => {
            setLoading(true);
            setError(null);

            try {
                // Convert amount to USDC units (6 decimals)
                const amountInWei = parseUnits(amount, 6).toString();

                const data = await getZeroExQuote({
                    sellToken: USDC_ADDRESS,
                    buyToken: token.address,
                    sellAmount: amountInWei,
                    takerAddress: address,
                    slippagePercentage: 0.01
                });

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
    }, [token, amount, address, isConnected]);

    const handleSwap = () => {
        if (!quote || !quote.to) return;

        sendTransaction({
            to: quote.to,
            data: quote.data,
            value: BigInt(quote.value || 0),
        });
    };

    const handleConnect = () => {
        console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
        // Try injected first, then fall back to first available
        const injected = connectors.find(c => c.id === 'injected' || c.name === 'Injected');
        const connector = injected || connectors[0];
        if (connector) {
            console.log('Connecting with:', connector.id, connector.name);
            connect({ connector });
        } else {
            console.error('No connectors available');
        }
    };

    if (!token) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a0c10] border-l border-zinc-800 shadow-2xl z-50 flex flex-col">
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
                            disabled={isConnecting}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Pay Input */}
                        <div className="bg-[#080a0e] p-4 rounded-lg border border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-2">YOU PAY</div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="flex-1 bg-transparent text-2xl font-mono text-white outline-none"
                                    placeholder="100"
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

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-xs p-3 bg-red-500/10 rounded-lg">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        {/* Swap Button */}
                        <button
                            onClick={handleSwap}
                            disabled={!quote || loading || isSending}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${!quote || loading
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                }`}
                        >
                            {isSending ? 'Confirming...' : loading ? 'Loading...' : 'Swap Now'}
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
    );
}
