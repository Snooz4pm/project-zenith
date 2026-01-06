'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
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
import { getPhantom } from '@/lib/phantom';
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
    
    // MEMOIZE walletPubkey to prevent new object on every render
    const walletPubkey = useMemo(() => {
        if (publicKey) return publicKey;
        if (directPublicKey) return new PublicKey(directPublicKey);
        return null;
    }, [publicKey, directPublicKey]);

    // Store (for TO token from grid) - use individual selectors
    const selectedToken = useTradeSelection(s => s.selectedToken);
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
    const [noRoute, setNoRoute] = useState(false);
    const [txSignature, setTxSignature] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Refs for cleanup & deduplication
    const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastQuoteRef = useRef<string>('');
    const balanceLoadedRef = useRef(false); // Prevent duplicate loads
    
    // ========================================================================
    // REFS AS SOURCE OF TRUTH (prevents infinite loops)
    // ========================================================================
    const fromTokenRef = useRef<WalletToken | null>(null);
    const toTokenRef = useRef<ZenithToken | null>(null);
    const amountRef = useRef<string>('');
    const tokenUniverseRef = useRef<ZenithToken[]>([]);
    const connectionRef = useRef(connection);
    const walletPubkeyRef = useRef(walletPubkey);

    // Sync refs (NO LOGIC)
    useEffect(() => { fromTokenRef.current = fromToken; }, [fromToken]);
    useEffect(() => { toTokenRef.current = toToken; }, [toToken]);
    useEffect(() => { amountRef.current = amount; }, [amount]);
    useEffect(() => { tokenUniverseRef.current = tokenUniverse; }, [tokenUniverse]);
    useEffect(() => { connectionRef.current = connection; }, [connection]);
    useEffect(() => { walletPubkeyRef.current = walletPubkey; }, [walletPubkey]);

    // ========================================================================
    // MINIMUM AMOUNTS (prevents "no route" for dust)
    // ========================================================================
    const getMinAmount = (symbol?: string): number => {
        if (!symbol) return 0;
        const s = symbol.toUpperCase();
        if (s === 'SOL') return 0.002;
        if (s === 'USDC' || s === 'USDT') return 0.5;
        if (s === 'BONK' || s === 'WIF' || s === 'POPCAT') return 100;
        return 0.001; // Default minimum
    };

    // ========================================================================
    // 1. LOAD TOKEN UNIVERSE (FROM JUPITER STRICT LIST) - ONCE
    // ========================================================================
    useEffect(() => {
        buildZenithTokenList()
            .then(tokens => {
                setTokenUniverse(tokens);
            })
            .catch(console.error);
    }, []);

    // ========================================================================
    // 2. LOAD WALLET BALANCES - NO DEPS, reads from refs
    // ========================================================================
    const loadWalletBalances = useCallback(async () => {
        const conn = connectionRef.current;
        const pubkey = walletPubkeyRef.current;
        const universe = tokenUniverseRef.current;

        if (!pubkey || universe.length === 0) {
            return;
        }

        try {
            const balances = await fetchWalletBalances(conn, pubkey);
            const enriched = enrichWalletBalances(balances, universe);
            setWalletTokens(enriched);

            // Auto-select FROM token only if none selected
            if (enriched.length > 0 && !fromTokenRef.current) {
                const withBalance = enriched.filter(t => t.uiBalance > 0);
                if (withBalance.length > 0) {
                    setFromToken(withBalance[0]);
                }
            }
        } catch (err) {
            console.error("[SwapPanel] Balance fetch error:", err);
        }
    }, []); // NO DEPS - reads from refs

    // Load balances ONCE when connected and universe is ready
    useEffect(() => {
        if (!connected || !walletPubkey || tokenUniverse.length === 0) return;
        if (balanceLoadedRef.current) return; // Already loaded
        
        balanceLoadedRef.current = true;
        loadWalletBalances();
    }, [connected, walletPubkey, tokenUniverse.length, loadWalletBalances]);

    // Reset loaded flag when wallet disconnects
    useEffect(() => {
        if (!connected) {
            balanceLoadedRef.current = false;
            setWalletTokens([]);
            setFromToken(null);
        }
    }, [connected]);

    // ========================================================================
    // 3. FETCH QUOTE FUNCTION (NO useEffect - called explicitly)
    // ========================================================================
    const fetchQuote = useCallback(async () => {
        const from = fromTokenRef.current;
        const to = toTokenRef.current;
        const amt = amountRef.current;

        // Clear any pending quote
        if (quoteTimeoutRef.current) {
            clearTimeout(quoteTimeoutRef.current);
            quoteTimeoutRef.current = null;
        }

        // GUARDS
        if (!from || !to) return;
        if (from.address === to.mint) {
            setQuote(null);
            setError(null);
            setSwapState('idle');
            return;
        }
        if (!amt || Number(amt) <= 0) {
            setQuote(null);
            setError(null);
            setSwapState('idle');
            return;
        }
        if (Number(amt) > from.uiBalance) {
            setQuote(null);
            setError('Insufficient balance');
            setSwapState('idle');
            return;
        }

        const minAmount = getMinAmount(from.symbol);
        if (Number(amt) < minAmount) {
            setQuote(null);
            setError(`Minimum ${minAmount} ${from.symbol}`);
            setSwapState('idle');
            return;
        }

        // Deduplication
        const quoteKey = `${from.address}-${to.mint}-${amt}`;
        if (quoteKey === lastQuoteRef.current) return;

        setNoRoute(false);
        setError(null);
        setSwapState('fetching-quote');

        try {
            lastQuoteRef.current = quoteKey;
            const amountBase = uiToBase(Number(amt), from.decimals);
            const slippageBps = autoSlippage(Number(amt));

            const params = new URLSearchParams({
                inputMint: from.address,
                outputMint: to.mint,
                amount: amountBase.toString(),
                slippageBps: slippageBps.toString()
            });

            const res = await fetch(`${API_URL}/quote?${params}`);
            const data = await res.json();

            if (data.error === 'NO_ROUTE' || !data.outAmount || !data.routePlan?.length) {
                setQuote(null);
                setNoRoute(true);
                setSwapState('idle');
                return;
            }

            setNoRoute(false);
            setQuote(data);
            setSwapState('quote-ready');
        } catch (err) {
            console.error("[SwapPanel] Quote failed:", err);
            setQuote(null);
            setNoRoute(true);
            setSwapState('idle');
        }
    }, []); // NO DEPS - reads from refs

    // ========================================================================
    // 4. HANDLE TOKEN SELECTION (explicit trigger)
    // ========================================================================
    const handleSelectToToken = useCallback((token: ZenithToken) => {
        if (token.mint === fromTokenRef.current?.address) return;
        setToToken(token);
        // Fetch quote after state update
        queueMicrotask(fetchQuote);
    }, [fetchQuote]);

    // Sync from Zustand store (grid click) - runs once when selectedToken changes
    useEffect(() => {
        if (!selectedToken || tokenUniverse.length === 0) return;
        const zenithToken = tokenUniverse.find(t => t.mint === selectedToken.address);
        if (zenithToken) {
            handleSelectToToken(zenithToken);
        }
    }, [selectedToken, tokenUniverse, handleSelectToToken]);

    // Sync from intent store
    useEffect(() => {
        if (!intent?.toToken || tokenUniverse.length === 0) return;
        const zenithToken = tokenUniverse.find(t => t.mint === intent.toToken.address);
        if (zenithToken) {
            handleSelectToToken(zenithToken);
        }
    }, [intent, tokenUniverse, handleSelectToToken]);

    // Auto-select TO token (only once on mount)
    useEffect(() => {
        if (!fromToken || tokenUniverse.length === 0) return;
        if (toTokenRef.current) return;
        const candidate = tokenUniverse.find(t => t.mint !== fromToken.address);
        if (candidate) {
            setToToken(candidate);
        }
    }, [fromToken, tokenUniverse]);

    // ========================================================================
    // 5. HANDLE AMOUNT CHANGE (debounced quote fetch)
    // ========================================================================
    const handleAmountChange = useCallback((value: string) => {
        setAmount(value);
        
        // Clear pending quote
        if (quoteTimeoutRef.current) {
            clearTimeout(quoteTimeoutRef.current);
        }
        
        // Debounce quote fetch
        quoteTimeoutRef.current = setTimeout(fetchQuote, 400);
    }, [fetchQuote]);

    // ========================================================================
    // 6. EXECUTE SWAP (FULL FLOW WITH SIMULATION)
    // ========================================================================
    const handleSwap = async () => {
        // Not connected → connect directly (no modal)
        if (!connected) {
            await connectWallet();
            return;
        }

        if (!walletPubkey || !quote || !fromToken || !toToken) return;

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
                    userPublicKey: walletPubkey.toString()
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

            // 2. SIMULATE TRANSACTION (optional - skipped if rate limited)
            const simResult = await simulateSwapTransaction(
                swapData.swapTransaction,
                walletPubkey.toString()
            );

            if (!simResult.success && !simResult.skipped) {
                throw new Error(simResult.error || "Simulation failed - transaction would fail");
            }
            
            if (simResult.skipped) {
                console.log('[SwapPanel] Simulation skipped (rate limited)');
            }

            // 3. Deserialize the transaction
            const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            // 4. Sign and send (use direct Phantom if available, else wallet adapter)
            setSwapState('awaiting-signature');
            
            let signature: string;
            const phantom = getPhantom();
            
            if (directConnected && phantom?.isConnected) {
                // Direct Phantom connection - use signAndSendTransaction
                console.log('[SwapPanel] Using direct Phantom signAndSendTransaction');
                const result = await phantom.signAndSendTransaction(transaction, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed'
                });
                signature = result.signature;
            } else if (walletAdapterConnected && sendTransaction) {
                // Wallet adapter connection
                console.log('[SwapPanel] Using wallet adapter sendTransaction');
                signature = await sendTransaction(transaction, connection);
            } else {
                throw new Error('No wallet connected');
            }
            
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
        handleAmountChange(maxUi.toString());
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
            setNoRoute(false);
            // Trigger quote after state settles
            queueMicrotask(fetchQuote);
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
        if (noRoute) return 'NO ROUTE AVAILABLE';
        return 'SWAP NOW';
    };

    const canExecute = connected && 
                       fromToken && 
                       toToken && 
                       fromToken.address !== toToken.mint &&
                       Number(amount) > 0 && 
                       Number(amount) <= fromToken.uiBalance &&
                       Number(amount) >= getMinAmount(fromToken?.symbol) &&
                       quote &&
                       !noRoute &&
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
                        setNoRoute(false);
                    }}
                    label="Select Token"
                    showBalance={true}
                />

                <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
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

            {/* NO ROUTE INFO (subtle, not an error) */}
            {noRoute && !error && fromToken && toToken && Number(amount) > 0 && (
                <div className="mb-4 p-3 rounded bg-zinc-800/50 border border-zinc-700/30 text-zinc-400 text-xs text-center">
                    No liquidity route available for {fromToken.symbol} → {toToken.symbol}
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
