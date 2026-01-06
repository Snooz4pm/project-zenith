'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { VersionedTransaction } from '@solana/web3.js';
import { useTradeSelection } from '@/lib/store/useTradeSelection';
import { useSwapStore } from '@/lib/store/useSwapStore';
import { fetchWalletBalances, enrichWalletBalances, WalletToken } from '@/lib/wallet/balance';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';
import { canQuote } from '@/lib/swap/swapGuards';
import { getMaxSwappable, uiToBase, baseToUi, autoSlippage } from '@/lib/swap/utils';
import { TokenSelector } from './TokenSelector';

const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------

export default function SwapPanel() {
    // Hooks
    const { connection } = useConnection();
    const { publicKey, sendTransaction, connected } = useWallet();
    const { setVisible } = useWalletModal();

    // Store (for TO token from grid)
    const selectedToken = useTradeSelection(s => s.selectedToken);
    const setSelectedToken = useTradeSelection(s => s.setSelectedToken);
    const intent = useSwapStore(s => s.intent); // Listen to grid clicks

    // State
    const [tokenUniverse, setTokenUniverse] = useState<ZenithToken[]>([]);
    const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);

    const [fromToken, setFromToken] = useState<WalletToken | null>(null);
    const [toToken, setToToken] = useState<ZenithToken | null>(null);

    const [amount, setAmount] = useState<string>('');
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ------------------------------------------------------------------
    // 1. LOAD TOKEN UNIVERSE
    // ------------------------------------------------------------------
    useEffect(() => {
        buildZenithTokenList()
            .then(setTokenUniverse)
            .catch(console.error);
    }, []);

    // ------------------------------------------------------------------
    // 2. LOAD WALLET BALANCES & AUTO-SELECT FROM
    // ------------------------------------------------------------------
    useEffect(() => {
        let mounted = true;

        async function loadWallet() {
            if (!connected || !publicKey || tokenUniverse.length === 0) {
                setWalletTokens([]);
                setFromToken(null);
                return;
            }

            try {
                const balances = await fetchWalletBalances(connection, publicKey);
                const enriched = enrichWalletBalances(balances, tokenUniverse);

                if (!mounted) return;
                setWalletTokens(enriched);

                // Auto-select highest balance token
                if (enriched.length > 0 && !fromToken) {
                    setFromToken(enriched[0]);
                }
            } catch (err) {
                console.error("Failed to load wallet", err);
            }
        }

        loadWallet();
        return () => { mounted = false; };
    }, [connected, publicKey, tokenUniverse, fromToken, connection]);

    // ------------------------------------------------------------------
    // 3. SYNC TO TOKEN FROM GRID SELECTION (Store)
    // ------------------------------------------------------------------
    useEffect(() => {
        if (selectedToken) {
            // Convert store token to ZenithToken format
            const zenithToken = tokenUniverse.find(t => t.mint === selectedToken.address);
            if (zenithToken) {
                setToToken(zenithToken);
            }
        }
    }, [selectedToken, tokenUniverse]);

    // ------------------------------------------------------------------
    // 3b. ALSO LISTEN TO INTENT FROM GRID CLICKS
    // ------------------------------------------------------------------
    useEffect(() => {
        if (intent?.toToken) {
            const zenithToken = tokenUniverse.find(t => t.mint === intent.toToken.address);
            if (zenithToken) {
                setToToken(zenithToken);
            }
        }
    }, [intent, tokenUniverse]);

    // ------------------------------------------------------------------
    // 4. AUTO-SELECT TO TOKEN (Safe - no hardcoding)
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!fromToken || toToken || tokenUniverse.length === 0) return;

        // Find any different token (highest liquidity first due to sorting)
        const candidate = tokenUniverse.find(t => t.mint !== fromToken.address) || null;

        if (candidate) {
            setToToken(candidate);
        }
    }, [fromToken, toToken, tokenUniverse]);

    // ------------------------------------------------------------------
    // 5. FETCH QUOTE
    // ------------------------------------------------------------------
    useEffect(() => {
        // Strict Guard
        if (!canQuote(fromToken?.address, toToken?.mint)) {
            setQuote(null);
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setQuote(null);
            return;
        }

        const timer = setTimeout(async () => {
            // Re-check inside timeout (TypeScript safety)
            if (!fromToken || !toToken) return;

            setLoading(true);
            setError(null);
            try {
                // Convert UI amount to base units (UNIVERSAL - works for ALL tokens)
                const amountBase = uiToBase(Number(amount), fromToken.decimals);

                // Auto-calculate slippage based on amount
                const slippageBps = autoSlippage(Number(amount));

                const params = new URLSearchParams({
                    inputMint: fromToken.address,
                    outputMint: toToken.mint,
                    amount: amountBase.toString(),
                    slippageBps: slippageBps.toString()
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
    }, [amount, fromToken, toToken]);

    // ------------------------------------------------------------------
    // 3. EXECUTE SWAP
    // ------------------------------------------------------------------
    const handleSwap = async () => {
        // If wallet not connected, open wallet modal
        if (!connected) {
            setVisible(true);
            return;
        }

        if (!publicKey || !quote) return;

        setExecuting(true);
        setError(null);

        try {
            // 1. Get swap transaction from Jupiter (via proxy)
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

            // 2. Deserialize the transaction
            const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            // 3. Sign and send (wallet adapter handles both)
            // This will trigger Phantom popup for signature
            const signature = await sendTransaction(transaction, connection);

            console.log("Swap sent:", signature);

            // 4. Confirm transaction
            await connection.confirmTransaction(signature, 'confirmed');

            // 5. Success - reset UI
            setAmount('');
            setQuote(null);

            // TODO: Re-fetch wallet balances here
            console.log("Swap confirmed:", signature);

        } catch (err: any) {
            console.error("Swap failed:", err);

            // Silent handling for user rejection (cleaner UX)
            if (err.message?.includes('User rejected') || err.code === 4001) {
                console.log('User cancelled transaction');
                // Don't show error, just reset
            } else {
                // Real errors get displayed
                setError(err.message || "Swap failed");
            }
        } finally {
            setExecuting(false);
        }
    };

    // ------------------------------------------------------------------
    // RENDER HELPERS
    // ------------------------------------------------------------------
    const handleMax = () => {
        if (!fromToken) return;
        // Get max in base units, convert to UI (UNIVERSAL - works for ALL tokens)
        const maxBase = getMaxSwappable(fromToken);
        const maxUi = baseToUi(maxBase, fromToken.decimals);
        setAmount(maxUi.toString());
    };

    const formatBalance = (val: number) => {
        if (val < 0.0001 && val > 0) return '< 0.0001';
        return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black p-6 shadow-2xl">
            <header className="mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white tracking-tight font-mono">SWAP</h2>
                <p className="text-xs text-zinc-500 mt-1">Non-custodial swaps via Jupiter</p>
            </header>

            {/* FROM SECTION */}
            <div className="mb-2 space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs text-zinc-400 font-medium ml-1 font-mono">YOU PAY</label>
                    <div className="flex flex-col items-end">
                        {fromToken && (
                            <>
                                <span className="text-xs text-zinc-500">
                                    Balance: <span className="text-zinc-300 font-mono">{formatBalance(fromToken.uiBalance)}</span>
                                </span>
                                {fromToken.symbol === 'SOL' && (
                                    <span className="text-[10px] text-zinc-600">
                                        Swappable: <span className="text-zinc-400 font-mono">{formatBalance(baseToUi(getMaxSwappable(fromToken), fromToken.decimals))}</span>
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Token Selector Dropdown */}
                <TokenSelector
                    tokens={walletTokens}
                    selected={fromToken}
                    onSelect={(token) => setFromToken(token as WalletToken)}
                    label="Select Token"
                    showBalance={true}
                />

                {/* Amount Input */}
                <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-right text-white font-mono text-lg outline-none placeholder-zinc-700 focus:border-emerald-500/30"
                />

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
                <label className="text-xs text-zinc-400 font-medium ml-1 font-mono">YOU RECEIVE</label>
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${toToken ? 'bg-zinc-900/30 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-zinc-900/20 border-white/10'}`}>
                    {toToken ? (
                        <>
                            <div className="flex items-center gap-3">
                                {toToken.logoURI ? (
                                    <img src={toToken.logoURI} className="w-6 h-6 rounded-full" alt={toToken.symbol} />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-zinc-800" />
                                )}
                                <div className="flex flex-col">
                                    <span className="text-white font-bold tracking-wide">{toToken.symbol}</span>
                                </div>
                            </div>

                            <div className="text-right">
                                {loading ? (
                                    <span className="text-xs text-zinc-500 animate-pulse">Finding route...</span>
                                ) : quote ? (
                                    <span className="text-white font-mono text-lg">
                                        {(Number(quote.outAmount) / Math.pow(10, toToken.decimals || 6)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                    </span>
                                ) : (
                                    <span className="text-zinc-600 font-mono">-</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <span className="text-zinc-500 text-sm font-mono">Select a token →</span>
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
                disabled={executing || loading}
                onClick={handleSwap}
                className="w-full rounded-xl bg-white py-4 text-black font-bold tracking-wide transition-all hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white hover:shadow-lg font-mono"
            >
                {!connected ? 'CONNECT WALLET' :
                    executing ? 'SIGNING TX...' :
                        loading ? 'FINDING ROUTE...' :
                            !fromToken ? 'SELECT PAYMENT TOKEN' :
                                !toToken ? 'SELECT DESTINATION' :
                                    !amount || Number(amount) <= 0 ? 'ENTER AMOUNT' :
                                        Number(amount) > fromToken.uiBalance ? 'INSUFFICIENT BALANCE' :
                                            'SWAP NOW'}
            </button>
        </div>
    );
}
