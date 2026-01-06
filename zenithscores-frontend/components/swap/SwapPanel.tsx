'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useTradeSelection } from '@/lib/store/useTradeSelection';
import { useSwapStore } from '@/lib/store/useSwapStore';
import { fetchWalletBalances, enrichWalletBalances, WalletToken } from '@/lib/wallet/balance';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';
import { canQuote } from '@/lib/swap/swapGuards';
import { getMaxSwappable, uiToBase, baseToUi, autoSlippage } from '@/lib/swap/utils';
import { TokenSelector } from './TokenSelector';
import { connectWallet } from '@/lib/connectWallet';
import { useDirectWallet } from '@/components/wallet/DirectConnectButton';
import { simulateSwapTransaction } from '@/lib/swap/execution';
// Receipt saving - uncomment after running prisma migrate
// import { saveSwapReceipt, updateSwapStatus } from '@/lib/hooks/useSwapHistory';
import { ExternalLink, RefreshCw, AlertTriangle, Check, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

// ============================================================================
// SWAP STATES - Explicit state machine
// ============================================================================
type SwapState = 
  | 'idle'
  | 'fetching-quote'
  | 'quote-ready'
  | 'simulating'
  | 'awaiting-signature'
  | 'sending'
  | 'confirming'
  | 'success'
  | 'error';

// ============================================================================
// COMPONENT
// ============================================================================
export default function SwapPanel() {
    // Hooks
    const { connection } = useConnection();
    const { publicKey, sendTransaction, connected: walletAdapterConnected } = useWallet();
    const { publicKey: directPublicKey, isConnected: directConnected } = useDirectWallet();
    
    // Use either connection method
    const connected = walletAdapterConnected || directConnected;
    const walletKey = publicKey || (directPublicKey ? { toString: () => directPublicKey } : null);

    // Store (for TO token from grid)
    const selectedToken = useTradeSelection(s => s.selectedToken);
    const setSelectedToken = useTradeSelection(s => s.setSelectedToken);
    const intent = useSwapStore(s => s.intent);

    // State
    const [tokenUniverse, setTokenUniverse] = useState<ZenithToken[]>([]);
    const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
    const [fromToken, setFromToken] = useState<WalletToken | null>(null);
    const [toToken, setToToken] = useState<ZenithToken | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [quote, setQuote] = useState<any>(null);
    const [swapState, setSwapState] = useState<SwapState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Refs for cleanup & deduplication
    const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastQuoteRef = useRef<string>('');
    const balanceRefreshRef = useRef<NodeJS.Timeout | null>(null);

    // ========================================================================
    // 1. LOAD TOKEN UNIVERSE (FROM JUPITER STRICT LIST)
    // ========================================================================
    useEffect(() => {
        buildZenithTokenList()
            .then(tokens => {
                setTokenUniverse(tokens);
            })
            .catch(console.error);
    }, []);

    // ========================================================================
    // 2. LOAD WALLET BALANCES (CACHED, 30s REFRESH)
    // ========================================================================
    const loadWalletBalances = useCallback(async () => {
        if (!connected || !publicKey || tokenUniverse.length === 0) {
            setWalletTokens([]);
            setFromToken(null);
            return;
        }

        try {
            const balances = await fetchWalletBalances(connection, publicKey);
            const enriched = enrichWalletBalances(balances, tokenUniverse);
            setWalletTokens(enriched);

            // Auto-select FROM: highest balance token (with actual balance > 0)
            if (enriched.length > 0 && !fromToken) {
                const withBalance = enriched.filter(t => t.uiBalance > 0);
                if (withBalance.length > 0) {
                    setFromToken(withBalance[0]);
                }
            }
        } catch (err) {
            console.error("[SwapPanel] Failed to load wallet balances:", err);
        }
    }, [connected, publicKey, tokenUniverse, fromToken, connection]);

    useEffect(() => {
        loadWalletBalances();

        // Auto-refresh balances every 30s
        balanceRefreshRef.current = setInterval(loadWalletBalances, 30000);
        
        return () => {
            if (balanceRefreshRef.current) {
                clearInterval(balanceRefreshRef.current);
            }
        };
    }, [loadWalletBalances]);

    // ========================================================================
    // 3. SYNC TO TOKEN FROM GRID/STORE
    // ========================================================================
    useEffect(() => {
        if (selectedToken) {
            const zenithToken = tokenUniverse.find(t => t.mint === selectedToken.address);
            if (zenithToken && zenithToken.mint !== fromToken?.address) {
                setToToken(zenithToken);
            }
        }
    }, [selectedToken, tokenUniverse, fromToken]);

    useEffect(() => {
        if (intent?.toToken) {
            const zenithToken = tokenUniverse.find(t => t.mint === intent.toToken.address);
            if (zenithToken && zenithToken.mint !== fromToken?.address) {
                setToToken(zenithToken);
            }
        }
    }, [intent, tokenUniverse, fromToken]);

    // ========================================================================
    // 4. AUTO-SELECT TO TOKEN (DIFFERENT FROM "FROM")
    // ========================================================================
    useEffect(() => {
        if (!fromToken || toToken || tokenUniverse.length === 0) return;

        const candidate = tokenUniverse.find(t => t.mint !== fromToken.address);
        if (candidate) {
            setToToken(candidate);
        }
    }, [fromToken, toToken, tokenUniverse]);

    // ========================================================================
    // 5. FETCH QUOTE (DEBOUNCED 500ms, GUARDED)
    // ========================================================================
    useEffect(() => {
        // Clear pending quote
        if (quoteTimeoutRef.current) {
            clearTimeout(quoteTimeoutRef.current);
        }

        // GUARD 1: Same token check (CRITICAL - prevents "No route" errors)
        if (!canQuote(fromToken?.address, toToken?.mint)) {
            setQuote(null);
            setSwapState('idle');
            return;
        }

        // GUARD 2: Invalid amount
        if (!amount || Number(amount) <= 0) {
            setQuote(null);
            setSwapState('idle');
            return;
        }

        // GUARD 3: Amount exceeds balance
        if (fromToken && Number(amount) > fromToken.uiBalance) {
            setQuote(null);
            setError('Insufficient balance');
            return;
        }

        // Deduplication: Same params as last quote → skip
        const quoteKey = `${fromToken?.address}-${toToken?.mint}-${amount}`;
        if (quoteKey === lastQuoteRef.current && quote) {
            return;
        }

        setError(null);
        setSwapState('fetching-quote');

        // Debounce: 500ms before fetching
        quoteTimeoutRef.current = setTimeout(async () => {
            if (!fromToken || !toToken) return;

            lastQuoteRef.current = quoteKey;

            try {
                const amountBase = uiToBase(Number(amount), fromToken.decimals);
                const slippageBps = autoSlippage(Number(amount));

                const params = new URLSearchParams({
                    inputMint: fromToken.address,
                    outputMint: toToken.mint,
                    amount: amountBase.toString(),
                    slippageBps: slippageBps.toString()
                });

                const res = await fetch(`${API_URL}/quote?${params}`);
                
                if (!res.ok) {
                    throw new Error(`Quote failed: ${res.status}`);
                }

                const data = await res.json();

                if (data.error) throw new Error(data.error);
                if (!data.outAmount) throw new Error("No route found");

                setQuote(data);
                setSwapState('quote-ready');
            } catch (err: any) {
                console.error("[SwapPanel] Quote failed:", err);
                setError("No route found");
                setQuote(null);
                setSwapState('error');
            }
        }, 500);

        return () => {
            if (quoteTimeoutRef.current) {
                clearTimeout(quoteTimeoutRef.current);
            }
        };
    }, [amount, fromToken, toToken, quote]);

    // ========================================================================
    // 6. EXECUTE SWAP (FULL FLOW WITH SIMULATION)
    // ========================================================================
    const handleSwap = async () => {
        // Not connected → connect directly (no modal)
        if (!connected) {
            await connectWallet();
            return;
        }

        if (!publicKey || !quote || !fromToken || !toToken) return;

        // GUARD: Same token (defensive)
        if (fromToken.address === toToken.mint) {
            setError("Cannot swap same token");
            return;
        }

        setSwapState('simulating');
        setError(null);
        setTxSignature(null);
        setShowSuccess(false);

        try {
            // 1. Build swap transaction from Jupiter
            const swapRes = await fetch(`${API_URL}/swap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toString()
                })
            });

            if (!swapRes.ok) {
                const errText = await swapRes.text();
                throw new Error(`Swap build failed: ${errText}`);
            }

            const swapData = await swapRes.json();
            if (!swapData.swapTransaction) {
                throw new Error("Failed to build swap transaction");
            }

            // 2. SIMULATE TRANSACTION (CRITICAL - catches errors BEFORE signing)
            const simResult = await simulateSwapTransaction(
                swapData.swapTransaction,
                publicKey.toString()
            );

            if (!simResult.success) {
                throw new Error(simResult.error || "Simulation failed - transaction would fail");
            }

            // 3. Deserialize the transaction
            const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            // 4. Sign and send
            setSwapState('awaiting-signature');
            const signature = await sendTransaction(transaction, connection);
            setTxSignature(signature);

            // 5. Confirm transaction
            setSwapState('confirming');
            await connection.confirmTransaction(signature, 'confirmed');

            // 6. Success!
            setSwapState('success');
            setShowSuccess(true);

            // 7. Reset form
            setAmount('');
            setQuote(null);

            // 8. Refresh balances after 2s (give blockchain time)
            setTimeout(loadWalletBalances, 2000);

            // 9. Auto-hide success after 8s
            setTimeout(() => {
                setShowSuccess(false);
                setSwapState('idle');
            }, 8000);

        } catch (err: any) {
            console.error("[SwapPanel] Swap failed:", err);

            // User rejection → silent reset
            if (err.message?.includes('User rejected') || err.code === 4001) {
                setSwapState('idle');
                return;
            }

            // Blockhash expired → friendly message
            if (err.message?.includes('Blockhash not found') || err.message?.includes('block height exceeded')) {
                setError('Transaction expired. Please try again.');
                setSwapState('error');
                return;
            }

            setError(err.message || "Swap failed");
            setSwapState('error');
        }
    };

    // ========================================================================
    // HELPERS
    // ========================================================================
    const handleMax = () => {
        if (!fromToken) return;
        const maxBase = getMaxSwappable(fromToken);
        const maxUi = baseToUi(maxBase, fromToken.decimals);
        setAmount(maxUi.toString());
    };

    const handleSwitchTokens = () => {
        if (!fromToken || !toToken) return;
        
        // Find TO token in wallet tokens
        const toAsWallet = walletTokens.find(t => t.address === toToken.mint);
        const fromAsZenith = tokenUniverse.find(t => t.mint === fromToken.address);
        
        if (toAsWallet && fromAsZenith) {
            setFromToken(toAsWallet);
            setToToken(fromAsZenith);
            setAmount('');
            setQuote(null);
        }
    };

    const formatBalance = (val: number) => {
        if (val < 0.0001 && val > 0) return '< 0.0001';
        return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    const isLoading = swapState === 'fetching-quote';
    const isExecuting = ['simulating', 'awaiting-signature', 'sending', 'confirming'].includes(swapState);

    const getButtonText = () => {
        if (!connected) return 'CONNECT WALLET';
        if (swapState === 'simulating') return 'SIMULATING...';
        if (swapState === 'awaiting-signature') return 'CONFIRM IN PHANTOM';
        if (swapState === 'sending') return 'SENDING...';
        if (swapState === 'confirming') return 'CONFIRMING...';
        if (isLoading) return 'FINDING ROUTE...';
        if (!fromToken) return 'SELECT PAYMENT TOKEN';
        if (!toToken) return 'SELECT DESTINATION';
        if (!amount || Number(amount) <= 0) return 'ENTER AMOUNT';
        if (fromToken.address === toToken.mint) return 'INVALID: SAME TOKEN';
        if (Number(amount) > fromToken.uiBalance) return 'INSUFFICIENT BALANCE';
        return 'SWAP NOW';
    };

    const canExecute = connected && 
                       fromToken && 
                       toToken && 
                       fromToken.address !== toToken.mint &&
                       Number(amount) > 0 && 
                       Number(amount) <= fromToken.uiBalance &&
                       quote &&
                       !isExecuting;

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <div className="rounded-2xl border border-white/10 bg-black p-6 shadow-2xl relative">
            {/* SUCCESS OVERLAY */}
            {showSuccess && txSignature && (
                <div className="absolute inset-0 bg-black/95 rounded-2xl flex flex-col items-center justify-center z-20 p-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Swap Confirmed!</h3>
                    <p className="text-zinc-400 text-sm text-center mb-4">
                        {fromToken?.symbol} → {toToken?.symbol}
                    </p>
                    <a
                        href={`https://solscan.io/tx/${txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-mono"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View on Solscan
                    </a>
                    <button
                        onClick={() => {
                            setShowSuccess(false);
                            setSwapState('idle');
                        }}
                        className="mt-4 text-zinc-500 hover:text-white text-sm"
                    >
                        Close
                    </button>
                </div>
            )}

            <header className="mb-6 border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-mono">SWAP</h2>
                    <p className="text-xs text-zinc-500 mt-1">Non-custodial swaps via Jupiter</p>
                </div>
                <button
                    onClick={loadWalletBalances}
                    className="p-2 text-zinc-500 hover:text-white transition-colors"
                    title="Refresh balances"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
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

                <TokenSelector
                    tokens={walletTokens}
                    selected={fromToken}
                    onSelect={(token) => {
                        // GUARD: Cannot select same as TO
                        if (toToken && token.address === toToken.mint) {
                            handleSwitchTokens();
                            return;
                        }
                        setFromToken(token as WalletToken);
                        setQuote(null);
                    }}
                    label="Select Token"
                    showBalance={true}
                />

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

            {/* SWITCH BUTTON */}
            <div className="flex justify-center -my-3 relative z-10">
                <button
                    onClick={handleSwitchTokens}
                    disabled={!fromToken || !toToken}
                    className="w-8 h-8 rounded-full bg-[#0B0E15] border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </button>
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
                                {isLoading ? (
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

            {/* PRICE IMPACT WARNING */}
            {quote && parseFloat(quote.priceImpactPct || '0') > 0.01 && (
                <div className="mb-4 p-3 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span className="text-yellow-400 text-xs">
                        Price impact: {(parseFloat(quote.priceImpactPct) * 100).toFixed(2)}%
                    </span>
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono text-center">
                    {error}
                </div>
            )}

            {/* ACTION BUTTON */}
            <button
                disabled={!canExecute && connected && !!fromToken && !!toToken && !!amount}
                onClick={handleSwap}
                className="w-full rounded-xl bg-white py-4 text-black font-bold tracking-wide transition-all hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white hover:shadow-lg font-mono flex items-center justify-center gap-2"
            >
                {isExecuting && <Loader2 className="w-4 h-4 animate-spin" />}
                {getButtonText()}
            </button>

            {/* TX LINK (during execution) */}
            {txSignature && !showSuccess && (
                <a
                    href={`https://solscan.io/tx/${txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-3 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    View on Solscan
                </a>
            )}
        </div>
    );
}
