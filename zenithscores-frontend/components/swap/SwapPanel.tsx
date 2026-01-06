'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useTradeSelection } from '@/lib/store/useTradeSelection';
import { fetchWalletBalances, detectBestFromToken } from '@/lib/wallet/balance';

const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

export default function SwapPanel() {
    const selectedToken = useTradeSelection(s => s.selectedToken);
    const { connection } = useConnection();
    const { publicKey, signTransaction, sendTransaction, connected } = useWallet();

    const [fromToken, setFromToken] = useState<any>(null);
    const [balance, setBalance] = useState<number>(0);
    const [amount, setAmount] = useState<string>('');
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAutoSelected, setIsAutoSelected] = useState(false);

    // 1. AUTO-SELECT FROM TOKEN (Runs once on connect)
    useEffect(() => {
        if (!connected || !publicKey) {
            setBalance(0);
            return;
        }

        fetchWalletBalances(connection, publicKey).then(balances => {
            // Setup simple enrichment for detection
            const candidates = balances.map(b => ({
                address: b.mint,
                symbol: b.mint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'Unknown',
                balance: b.amount,
                decimals: b.decimals, // Capture actual decimals
                usdValue: b.amount,
            }));

            const best = detectBestFromToken(candidates);
            if (best) {
                setFromToken({
                    address: best.address,
                    symbol: best.symbol === 'Unknown' ? 'SOL' : best.symbol,
                    decimals: best.decimals, // Use actual decimals
                    logoURI: best.symbol === 'SOL' ? "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" : undefined
                });
                setBalance(best.balance);
                setIsAutoSelected(true);
            }
        });
    }, [connected, publicKey, connection]);

    // 2. FETCH QUOTE (Debounced)
    useEffect(() => {
        if (!fromToken || !selectedToken || !amount || Number(amount) <= 0) {
            setQuote(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                // Convert to atomic units
                const atomicAmount = Math.floor(Number(amount) * Math.pow(10, fromToken.decimals || 9)); // Default to 9 for SOL

                const params = new URLSearchParams({
                    inputMint: fromToken.address,
                    outputMint: selectedToken.address,
                    amount: atomicAmount.toString(),
                    slippageBps: '50' // 0.5%
                });

                const res = await fetch(`${API_URL}/quote?${params}`);
                const data = await res.json();

                if (data.error) throw new Error(data.error);
                if (!data.outAmount) throw new Error("No route found");

                setQuote(data);
            } catch (err: any) {
                console.error("Quote failed", err);
                setError("No Route Found");
                setQuote(null);
            } finally {
                setLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [amount, fromToken, selectedToken]);

    // 3. EXECUTE SWAP
    const handleSwap = async () => {
        if (!publicKey || !quote) return;

        setExecuting(true);
        setError(null);

        try {
            // A. Get Transaction from Proxy
            const swapRes = await fetch(`${API_URL}/swap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true
                })
            });

            const swapData = await swapRes.json();
            if (!swapData.swapTransaction) throw new Error("Failed to build swap transaction");

            // B. Deserialize & Sign
            const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            // C. Send via Wallet Adapter (It handles signing + sending usually)
            const signature = await sendTransaction(transaction, connection);

            // D. Wait for confirmation (Optional: Show Toast)
            console.log("Swap Sent:", signature);
            await connection.confirmTransaction(signature, 'confirmed');

            // Reset
            setAmount('');
            setQuote(null);
            // Re-fetch balance logic would go here ideally

        } catch (err: any) {
            console.error("Swap Failed", err);
            setError("Swap Failed: " + (err.message || "Unknown error"));
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-white/5 bg-[#0B0E15] p-6 shadow-2xl backdrop-blur-xl">
            <header className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Swap</h2>
                {isAutoSelected && (
                    <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                        ⚡ Smart Default
                    </span>
                )}
            </header>

            {/* FROM */}
            <div className="mb-2 space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs text-zinc-400 font-medium ml-1">From</label>
                    <span className="text-xs text-zinc-500">
                        Bal: <span className="text-zinc-300 font-mono">{balance > 0 ? balance.toFixed(4) : '0.00'}</span>
                    </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-zinc-900/50 border border-white/5 px-4 py-3 hover:bg-zinc-900/80 transition-colors focus-within:border-emerald-500/30 focus-within:ring-1 focus-within:ring-emerald-500/20">
                    <div className="flex items-center gap-3 shrink-0">
                        {fromToken ? (
                            <>
                                {fromToken.logoURI && <img src={fromToken.logoURI} className="w-6 h-6 rounded-full" alt={fromToken.symbol} />}
                                <span className="text-white font-bold">{fromToken.symbol}</span>
                            </>
                        ) : (
                            <>
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white font-bold">?</div>
                                <span className="text-zinc-500 font-medium">Select</span>
                            </>
                        )}
                    </div>
                    {/* INPUT AMOUNT */}
                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-transparent text-right text-white font-mono text-lg outline-none w-full placeholder-zinc-700"
                    />
                </div>

                {/* Quick MAX button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setAmount(balance.toString())}
                        disabled={!balance}
                        className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold tracking-wide disabled:opacity-50"
                    >
                        MAX
                    </button>
                </div>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center -my-3 relative z-10 pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-[#0B0E15] border border-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* TO (Reactive State) */}
            <div className="mb-6 space-y-2 pt-2">
                <label className="text-xs text-zinc-400 font-medium ml-1">To</label>
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${selectedToken ? 'bg-zinc-900/50 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-zinc-900/30 border-white/5'}`}>
                    {selectedToken ? (
                        <>
                            <div className="flex items-center gap-3">
                                {selectedToken.logoURI ? (
                                    <img src={selectedToken.logoURI} className="w-6 h-6 rounded-full" alt={selectedToken.symbol} />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-zinc-800" />
                                )}
                                <div className="flex flex-col">
                                    <span className="text-white font-bold tracking-wide">{selectedToken.symbol}</span>
                                </div>
                            </div>
                            {/* QUOTE OUTPUT */}
                            <div className="text-right">
                                {loading ? (
                                    <span className="text-xs text-zinc-500 animate-pulse">Fetching best price...</span>
                                ) : quote ? (
                                    <span className="text-white font-mono text-lg">
                                        {(Number(quote.outAmount) / Math.pow(10, selectedToken.decimals || 6)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                    </span>
                                ) : (
                                    <span className="text-zinc-600 font-mono">-</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <span className="text-zinc-500 italic text-sm">Select a token on the right...</span>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono text-center">
                    {error}
                </div>
            )}

            <button
                disabled={!selectedToken || !amount || executing || loading || !!error}
                onClick={handleSwap}
                className="w-full rounded-xl bg-emerald-500 py-4 text-black font-bold tracking-wide transition-all hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
            >
                {executing ? 'Confirming...' :
                    loading ? 'Finding Route...' :
                        !selectedToken ? 'Select Token' :
                            Number(amount) > balance ? 'Insufficient Balance' :
                                'SWAP NOW'}
            </button>
        </div>
    );
}
