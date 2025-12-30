'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useBalance } from 'wagmi';
// @ts-ignore
import { parseUnits, formatUnits } from 'viem';
import { getZeroExQuote } from '@/lib/trading/zero-ex';
import { Loader2, RefreshCw, ArrowDown, Wallet, AlertCircle } from 'lucide-react';

const TOKENS = [
    { symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, name: 'Ethereum' },
    { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6, name: 'USD Coin' },
    { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6, name: 'Tether' },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8, name: 'Wrapped BTC' },
];

export default function ZeroExSwap() {
    const { address, isConnected } = useAccount();
    const { sendTransaction, data: txHash, isPending } = useSendTransaction();

    const [sellToken, setSellToken] = useState(TOKENS[0]); // ETH default
    const [buyToken, setBuyToken] = useState(TOKENS[1]); // USDC default
    const [sellAmount, setSellAmount] = useState('');
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Quote when amount changes
    useEffect(() => {
        const fetchQuote = async () => {
            if (!sellAmount || parseFloat(sellAmount) <= 0 || !isConnected || !address) return;

            setLoading(true);
            setError(null);

            try {
                const amountInWei = parseUnits(sellAmount, sellToken.decimals).toString();

                const data = await getZeroExQuote({
                    sellToken: sellToken.address,
                    buyToken: buyToken.address,
                    sellAmount: amountInWei,
                    takerAddress: address,
                    slippagePercentage: 0.01 // 1%
                });

                setQuote(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to fetch quote');
                setQuote(null);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchQuote, 600);
        return () => clearTimeout(debounce);
    }, [sellAmount, sellToken, buyToken, address, isConnected]);

    const handleSwap = () => {
        if (!quote || !quote.to) return;

        sendTransaction({
            to: quote.to,
            data: quote.data,
            value: BigInt(quote.value), // For ETH swaps
        });
    };

    if (!isConnected) {
        return (
            <div className="p-6 bg-[#0f1219] border border-zinc-800 rounded-xl text-center">
                <Wallet className="mx-auto text-zinc-600 mb-3" size={32} />
                <h3 className="text-zinc-300 font-bold mb-1">Connect Wallet</h3>
                <p className="text-xs text-zinc-500 mb-4">Connect your Web3 wallet to execute trades directly.</p>
                {/* Relying on global Web3Modal button usually handled by Layout/Header, or add a button here if needed */}
                <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-sm transition-colors">
                    Connect Wallet
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#0f1219] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-w-sm w-full">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <span className="font-bold text-zinc-200">SWAP</span>
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-zinc-900 rounded text-zinc-500">0.5% FEE</span>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* SELL INPUT */}
                <div className="bg-[#080a0f] p-3 rounded-lg border border-zinc-800">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs text-zinc-500">YOU PAY</span>
                        <span className="text-xs text-zinc-500">BALANCE: -</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={sellAmount}
                            onChange={(e) => setSellAmount(e.target.value)}
                            placeholder="0.0"
                            className="bg-transparent text-2xl font-mono text-white outline-none w-full"
                        />
                        <select
                            className="bg-zinc-800 text-zinc-200 text-sm font-bold px-2 py-1 rounded outline-none border border-zinc-700"
                            value={sellToken.symbol}
                            onChange={(e) => {
                                const token = TOKENS.find(t => t.symbol === e.target.value);
                                if (token) setSellToken(token);
                            }}
                        >
                            {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                    <button className="bg-zinc-800 p-1.5 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                        <ArrowDown size={16} />
                    </button>
                </div>

                {/* BUY OUTPUT */}
                <div className="bg-[#080a0f] p-3 rounded-lg border border-zinc-800">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs text-zinc-500">YOU RECEIVE</span>
                        {quote && <span className="text-[10px] text-emerald-500">BEST PRICE</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-mono text-zinc-300 w-full truncate">
                            {quote ? parseFloat(formatUnits(BigInt(quote.buyAmount), buyToken.decimals)).toFixed(6) : '0.0'}
                        </div>
                        <select
                            className="bg-zinc-800 text-zinc-200 text-sm font-bold px-2 py-1 rounded outline-none border border-zinc-700"
                            value={buyToken.symbol}
                            onChange={(e) => {
                                const token = TOKENS.find(t => t.symbol === e.target.value);
                                if (token) setBuyToken(token);
                            }}
                        >
                            {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                        </select>
                    </div>
                </div>

                {/* QUOTE DETAILS */}
                {quote && (
                    <div className="space-y-2 p-3 bg-zinc-900/50 rounded-lg text-xs border border-zinc-800/50">
                        <div className="flex justify-between text-zinc-400">
                            <span>Rate</span>
                            <span className="font-mono">1 {sellToken.symbol} ≈ {parseFloat(quote.price).toFixed(4)} {buyToken.symbol}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Network Cost</span>
                            <span className="font-mono flex items-center gap-1">
                                <span role="img" aria-label="gas">⛽</span> ${parseFloat(quote.estimatedPriceImpact || '0').toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Platform Fee (0.5%)</span>
                            <span className="text-emerald-500 font-mono">INCLUDED</span>
                        </div>
                    </div>
                )}

                {/* ACTION BUTTON */}
                <button
                    disabled={!quote || loading || isPending}
                    onClick={handleSwap}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                        ${!quote || loading
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        }`}
                >
                    {loading ? <Loader2 className="animate-spin" /> : isPending ? 'Confirming...' : 'Review Trade'}
                </button>

                {error && (
                    <div className="flex items-center gap-2 text-rose-500 text-xs justify-center bg-rose-500/10 p-2 rounded">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-600">Powering Zenith with 0x Protocol Liquidity</p>
            </div>
        </div>
    );
}
