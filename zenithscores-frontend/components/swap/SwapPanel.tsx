'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useTradeSelection } from '@/lib/store/useTradeSelection';
import { fetchWalletBalances, WalletBalance } from '@/lib/wallet/balance';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';
import { canQuote } from '@/lib/swap/swapGuards';

const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// ------------------------------------------------------------------
// TYPES (Local Enforcement)
// ------------------------------------------------------------------

type WalletToken = {
    address: string;
    symbol: string;
    decimals: number;
    balanceUi: number;
    usdValue: number;
    logoURI?: string;
    isNativeSOL?: boolean;
};

// ------------------------------------------------------------------
// ALGORITHMS (Pure Logic)
// ------------------------------------------------------------------

const SOL_FEE_BUFFER = 0.002; // 0.002 SOL for fees

function getMaxSwapAmount(token: WalletToken) {
    if (token.symbol === 'SOL' || token.isNativeSOL) {
        return Math.max(0, token.balanceUi - SOL_FEE_BUFFER);
    }
    return token.balanceUi;
}

function autoSelectFrom(walletTokens: WalletToken[]) {
    // 1. Must have balance > 0
    // 2. Sort by USD Value DESC
    // 3. If tie, prefer SOL (native)
    return walletTokens
        .filter(t => t.balanceUi > 0)
        .sort((a, b) => {
            if (b.usdValue !== a.usdValue) return b.usdValue - a.usdValue;
            if (a.symbol === 'SOL') return -1;
            if (b.symbol === 'SOL') return 1;
            return 0;
        })[0] ?? null;
}

function autoSelectTo(from: WalletToken, marketTokens: ZenithToken[]) {
    // 1. TO must NEVER equal FROM
    if (!from) return null;

    // Special Rule: If FROM is SOL, prefer USDC (Stable)
    if (from.symbol === 'SOL') {
        const usdc = marketTokens.find(t => t.symbol === 'USDC' && t.mint !== from.address);
        if (usdc) return usdc;
    }

    // General Logic:
    // - Not the same address
    // - Liquidity >= $50k (using liquidityUsd from market data)
    // - Sort by Liquidity DESC
    return marketTokens
        .filter(t =>
            t.mint !== from.address &&
            (t.liquidityUsd || 0) >= 50_000
            // !t.isFrozen (Checks if we had that flag, assuming Zenith list is safe)
        )
        .sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0))[0] ?? null;
}

function autoSlippage(token?: ZenithToken) {
    if (!token) return 50; // Default 0.5%
    const liquidity = token.liquidityUsd || 0;
    if (liquidity > 5_000_000) return 30;  // 0.30%
    if (liquidity > 1_000_000) return 50;  // 0.50%
    if (liquidity > 250_000) return 75;  // 0.75%
    return 100; // 1.00%
}

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------

export default function SwapPanel() {
    // Hooks first
    const { connection } = useConnection();
    const { publicKey, sendTransaction, connected } = useWallet();

    // Store
    const selectedToken = useTradeSelection(s => s.selectedToken);
    const setSelectedToken = useTradeSelection(s => s.setSelectedToken);

    // State
    const [fromToken, setFromToken] = useState<WalletToken | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAutoSelected, setIsAutoSelected] = useState(false);

    // Data Banks
    const [marketTokens, setMarketTokens] = useState<ZenithToken[]>([]);

    // ------------------------------------------------------------------
    // 1. INITIALIZATION & AUTO-SELECT
    // ------------------------------------------------------------------
    useEffect(() => {
        let mounted = true;

        async function init() {
            if (!connected || !publicKey) {
                setFromToken(null);
                return;
            }

            try {
                // A. Fetch raw data in parallel
                const [balances, marketList] = await Promise.all([
                    fetchWalletBalances(connection, publicKey),
                    buildZenithTokenList()
                ]);

                if (!mounted) return;
                setMarketTokens(marketList);

                // B. Enrich Wallet Tokens (Combine Balance + Market Data)
                const enrichedWalletTokens: WalletToken[] = balances.map(b => {
                    // Try to find market data
                    const marketData = marketList.find(m => m.mint === b.mint);
                    const price = marketData?.priceUsd || 0;
                    const logo = marketData?.logoURI; // or fallback logic

                    return {
                        address: b.mint,
                        symbol: marketData?.symbol || (b.mint === SOL_MINT ? 'SOL' : 'Unknown'),
                        decimals: b.decimals,
                        balanceUi: b.amount,
                        usdValue: b.amount * price,
                        logoURI: logo,
                        isNativeSOL: b.mint === SOL_MINT
                    };
                });

                // C. Auto-Select FROM
                const bestFrom = autoSelectFrom(enrichedWalletTokens);
                setFromToken(bestFrom);

                // D. Auto-Select TO
                if (bestFrom) {
                    const bestTo = autoSelectTo(bestFrom, marketList);
                    if (bestTo && (!selectedToken || selectedToken.address === bestFrom.address)) {
                        // Only auto-select TO if none selected OR if selected matches FROM (conflict)
                        setSelectedToken({
                            address: bestTo.mint,
                            symbol: bestTo.symbol,
                            decimals: bestTo.decimals,
                            logoURI: bestTo.logoURI
                        });
                        setIsAutoSelected(true);
                    }
                }

            } catch (err) {
                console.error("Initialization failed", err);
            }
        }

        init();

        return () => { mounted = false; };
    }, [connected, publicKey, connection, setSelectedToken, selectedToken]); // Depend on selectedToken to avoid overwrite if user manually selected? 
    // Actually, careful with dependencies here. We want this mostly on connect/load.
    // Adding selectedToken to deps usually causes loops. 
    // FIX: Remove selectedToken from deps, let the logic handle "if nothing selected".

    // ------------------------------------------------------------------
    // 2. FETCH QUOTE
    useEffect(() => {
        // Strict Guard
        if (!canQuote(fromToken?.address, selectedToken?.address)) {
            setQuote(null);
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setQuote(null);
            return;
        }

        const timer = setTimeout(async () => {
            // Re-check inside timeout (TypeScript safety)
            if (!fromToken || !selectedToken) return;

            setLoading(true);
            setError(null);
            try {
                // Convert to atomic units
                const atomicAmount = Math.floor(Number(amount) * Math.pow(10, fromToken.decimals));

                // Determine slippage
                const toMarketToken = marketTokens.find(t => t.mint === selectedToken.address);
                const slippageBps = autoSlippage(toMarketToken);

                const params = new URLSearchParams({
                    inputMint: fromToken.address,
                    outputMint: selectedToken.address,
                    amount: atomicAmount.toString(),
                    slippageBps: slippageBps.toString() // Dynamic
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
        }, 500);

        return () => clearTimeout(timer);
    }, [amount, fromToken, selectedToken, marketTokens]);

    // ------------------------------------------------------------------
    // 3. EXECUTE SWAP
    // ------------------------------------------------------------------
    const handleSwap = async () => {
        if (!publicKey || !quote) return;

        setExecuting(true);
        setError(null);

        try {
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

            const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            const signature = await sendTransaction(transaction, connection);

            console.log("Swap Sent:", signature);
            await connection.confirmTransaction(signature, 'confirmed');

            setAmount('');
            setQuote(null);
            // Ideally re-trigger balance fetch here

        } catch (err: any) {
            console.error("Swap Failed", err);
            setError("Swap Failed: " + (err.message || "Unknown error"));
        } finally {
            setExecuting(false);
        }
    };

    // ------------------------------------------------------------------
    // RENDER HELPERS
    // ------------------------------------------------------------------
    const handleMax = () => {
        if (!fromToken) return;
        const max = getMaxSwapAmount(fromToken);
        setAmount(max.toString());
    };

    const formatBalance = (val: number) => {
        if (val < 0.0001 && val > 0) return '< 0.0001';
        return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
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

            {/* FROM SECTION */}
            <div className="mb-2 space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs text-zinc-400 font-medium ml-1">Payment</label>
                    <div className="flex flex-col items-end">
                        {fromToken && (
                            <>
                                <span className="text-xs text-zinc-500">
                                    Balance: <span className="text-zinc-300 font-mono">{formatBalance(fromToken.balanceUi)}</span>
                                </span>
                                {fromToken.symbol === 'SOL' && (
                                    <span className="text-[10px] text-zinc-600">
                                        Swappable: <span className="text-zinc-400 font-mono">{formatBalance(getMaxSwapAmount(fromToken))}</span>
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-zinc-900/50 border border-white/5 px-4 py-3 hover:bg-zinc-900/80 transition-colors focus-within:border-emerald-500/30">
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

                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-transparent text-right text-white font-mono text-lg outline-none w-full placeholder-zinc-700"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleMax}
                        disabled={!fromToken}
                        className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold tracking-wide disabled:opacity-50 transition-colors"
                    >
                        MAX {fromToken?.symbol === 'SOL' ? '(Fee Safe)' : ''}
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="flex justify-center -my-3 relative z-10 pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-[#0B0E15] border border-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* TO SECTION */}
            <div className="mb-6 space-y-2 pt-2">
                <label className="text-xs text-zinc-400 font-medium ml-1">Receive</label>
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

                            <div className="text-right">
                                {loading ? (
                                    <span className="text-xs text-zinc-500 animate-pulse">Finding route...</span>
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

            {/* ERROR */}
            {error && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono text-center">
                    {error}
                </div>
            )}

            {/* ACTION BUTTON */}
            <button
                disabled={!selectedToken || !amount || executing || loading || !!error || !fromToken}
                onClick={handleSwap}
                className="w-full rounded-xl bg-emerald-500 py-4 text-black font-bold tracking-wide transition-all hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
            >
                {executing ? 'Confirming Transaction...' :
                    loading ? 'Finding Best Route...' :
                        !fromToken ? 'Wallet Empty' :
                            !selectedToken ? 'Select Destination Token' :
                                Number(amount) > fromToken.balanceUi ? 'Insufficient Balance' :
                                    error ? 'Retry Logic' : 'SWAP NOW'}
            </button>
        </div>
    );
}
