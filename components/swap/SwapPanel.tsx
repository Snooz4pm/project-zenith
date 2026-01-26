"use client";
'use client';

import type { Token } from '@/types/token';
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
  | 'arriving'    // New: Token is on its way
  | 'arrived'     // New: Token has arrived
  | 'error';

// ============================================================================
// ARRIVAL TRACKING
// ============================================================================
interface ArrivingToken {
    symbol: string;
    logoURI?: string;
    expectedAmount: number;
    mint: string;
    startTime: number;
}

// ============================================================================
// COMPONENT
// ============================================================================
type Props = {
    selectedToken: Token | null;
};

export default function SwapPanel({ selectedToken }: Props) {
    // Hooks
    const { connection } = useConnection();
    const { publicKey, sendTransaction, connected: walletAdapterConnected, connect: walletAdapterConnect, select, wallets } = useWallet();
    const { publicKey: directPublicKey, isConnected: directConnected } = useDirectWallet();
    
    // Use either connection method
    const connected = walletAdapterConnected || directConnected;
    
    // MEMOIZE walletPubkey to prevent new object on every render
    const walletPubkey = useMemo(() => {
        if (publicKey) return publicKey;
        if (directPublicKey) return new PublicKey(directPublicKey);
        return null;
    }, [publicKey, directPublicKey]);

    // Remove store selectedToken, use prop

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
    const [arrivingToken, setArrivingToken] = useState<ArrivingToken | null>(null);
    const [arrivalProgress, setArrivalProgress] = useState(0);
    
    // Refs for cleanup & deduplication
    const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastQuoteRef = useRef<string>('');
    const balanceLoadedRef = useRef(false); // Prevent duplicate loads
    const arrivalPollRef = useRef<NodeJS.Timeout | null>(null);
    const preSwapBalanceRef = useRef<number>(0);
    
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
            const balances = await fetchWalletBalances(pubkey);
            let enriched = enrichWalletBalances(balances, universe);

            // Always include SOL, even if no SPL tokens
            const solToken = universe.find(t => t.mint === 'So11111111111111111111111111111111111111112');
            if (solToken && !enriched.some(t => t.address === solToken.mint)) {
                enriched = [
                    {
                        address: solToken.mint,
                        symbol: solToken.symbol,
                        name: solToken.name,
                        decimals: solToken.decimals || 9,
                        logoURI: solToken.logoURI,
                        uiBalance: balances[0]?.amount || 0,
                        balanceBase: BigInt(Math.floor((balances[0]?.amount || 0) * Math.pow(10, solToken.decimals || 9)))
                    },
                    ...enriched
                ];
            }
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
    // 2.5 TOKEN ARRIVAL DETECTION - Poll for balance changes
    // ========================================================================
    const startArrivalPolling = useCallback((
        tokenMint: string,
        expectedAmount: number,
        symbol: string,
        logoURI?: string
    ) => {
        // Clear any existing poll
        if (arrivalPollRef.current) {
            clearInterval(arrivalPollRef.current);
        }

        // Store pre-swap balance for comparison
        const existingToken = walletTokens.find(t => t.address === tokenMint);
        preSwapBalanceRef.current = existingToken?.uiBalance || 0;
        
        // Set arriving state
        setArrivingToken({
            symbol,
            logoURI,
            expectedAmount,
            mint: tokenMint,
            startTime: Date.now()
        });
        setSwapState('arriving');
        setArrivalProgress(0);

        let pollCount = 0;
        const maxPolls = 30; // 30 polls × 2s = 60s max wait
        
        arrivalPollRef.current = setInterval(async () => {
            pollCount++;
            
            // Update progress bar (smooth animation)
            const elapsed = Date.now() - (arrivingToken?.startTime || Date.now());
            const progressPercent = Math.min(95, (elapsed / 10000) * 100); // 10s = 95%
            setArrivalProgress(progressPercent);

            try {
                const conn = connectionRef.current;
                const pubkey = walletPubkeyRef.current;
                const universe = tokenUniverseRef.current;

                if (!pubkey || universe.length === 0) return;

                const balances = await fetchWalletBalances(pubkey);
                const enriched = enrichWalletBalances(balances, universe);
                
                // Check if the arriving token's balance increased
                const newTokenBalance = enriched.find(t => t.address === tokenMint);
                const newBalance = newTokenBalance?.uiBalance || 0;
                const preBalance = preSwapBalanceRef.current;

                console.log(`[Arrival] Poll ${pollCount}: ${symbol} balance ${preBalance} → ${newBalance}`);

                if (newBalance > preBalance) {
                    // TOKEN ARRIVED! 🎉
                    clearInterval(arrivalPollRef.current!);
                    arrivalPollRef.current = null;
                    
                    setWalletTokens(enriched);
                    setArrivalProgress(100);
                    setSwapState('arrived');

                    // Auto-select the received token as FROM token for next swap
                    if (newTokenBalance) {
                        setTimeout(() => {
                            setFromToken(newTokenBalance);
                            setToToken(null);
                            setAmount('');
                            setQuote(null);
                            
                            // Clear arrival state after showing arrived UI
                            setTimeout(() => {
                                setArrivingToken(null);
                                setSwapState('idle');
                            }, 3000);
                        }, 1500);
                    }

                    return;
                }

                // Timeout - give up but still refresh balances
                if (pollCount >= maxPolls) {
                    clearInterval(arrivalPollRef.current!);
                    arrivalPollRef.current = null;
                    setWalletTokens(enriched);
                    setArrivingToken(null);
                    setSwapState('idle');
                    console.log('[Arrival] Timeout - token may still arrive');
                }
            } catch (err) {
                console.error('[Arrival] Poll error:', err);
            }
        }, 2000); // Poll every 2 seconds
    }, [walletTokens]);

    // Cleanup arrival polling on unmount
    useEffect(() => {
        return () => {
            if (arrivalPollRef.current) {
                clearInterval(arrivalPollRef.current);
            }
        };
    }, []);

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
        // Not connected → connect via wallet adapter (Phantom-trusted flow)
        if (!connected) {
            try {
                // Select Phantom wallet adapter if available
                const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
                if (phantomWallet) {
                    select(phantomWallet.adapter.name);
                    await walletAdapterConnect();
                } else {
                    // Fallback to direct connect
                    await connectWallet();
                }
            } catch (err) {
                console.log('[SwapPanel] Connect cancelled or failed');
            }
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

            // 4. Sign and send via wallet adapter (Phantom-trusted method)
            // This opens Phantom cleanly with proper dApp context
            setSwapState('awaiting-signature');
            console.log('[SwapPanel] Opening wallet for signature...');
            
            let signature: string;
            
            // PREFER wallet adapter (Phantom's trusted path)
            if (walletAdapterConnected && sendTransaction) {
                console.log('[SwapPanel] Using wallet adapter (trusted path)');
                signature = await sendTransaction(transaction, connection);
            } else {
                // Fallback to direct Phantom only if adapter not available
                const phantom = getPhantom();
                if (phantom?.isConnected) {
                    console.log('[SwapPanel] Fallback: direct Phantom');
                    const result = await phantom.signAndSendTransaction(transaction, {
                        skipPreflight: false,
                        preflightCommitment: 'confirmed'
                    });
                    signature = result.signature;
                } else {
                    throw new Error('No wallet connected');
                }
            }
            
            setTxSignature(signature);

            // 5. Confirm transaction
            setSwapState('confirming');
            await connection.confirmTransaction(signature, 'confirmed');

            // 6. Success! Transaction confirmed on chain
            setSwapState('success');
            setShowSuccess(true);

            // 7. Capture expected output for arrival tracking
            const expectedOutput = quote?.outAmount 
                ? Number(quote.outAmount) / Math.pow(10, toToken.decimals || 6)
                : 0;

            // 8. Reset form
            setAmount('');
            setQuote(null);

            // 9. Start arrival detection (poll for token balance increase)
            // This shows "Token arriving..." and auto-refreshes when it lands
            setTimeout(() => {
                setShowSuccess(false);
                startArrivalPolling(
                    toToken.mint,
                    expectedOutput,
                    toToken.symbol,
                    toToken.logoURI
                );
            }, 2000); // Start polling 2s after confirmation

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
    const isArriving = swapState === 'arriving' || swapState === 'arrived';

    const getButtonText = () => {
        if (!connected) return 'CONNECT WALLET';
        if (swapState === 'arriving') return `${arrivingToken?.symbol || 'TOKENS'} ARRIVING...`;
        if (swapState === 'arrived') return `${arrivingToken?.symbol || 'TOKENS'} ARRIVED! ✓`;
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
    // DEBUG OVERLAY (visible only in development)
    const [showDebug, setShowDebug] = useState(false);

    return (
        <div className="rounded-2xl border border-white/10 bg-black p-6 shadow-2xl relative">
            {/* DEBUG OVERLAY */}
            {showDebug && (
                <div className="absolute inset-0 bg-black/95 rounded-2xl z-50 p-6 overflow-auto">
                    <h3 className="text-white font-bold text-lg mb-2">Debug Info</h3>
                    <button
                        onClick={() => setShowDebug(false)}
                        className="mb-4 text-zinc-500 hover:text-white text-sm"
                    >Close</button>
                    <div className="mb-4">
                        <h4 className="text-emerald-400 font-mono">Token Universe</h4>
                        <pre className="text-xs text-zinc-300 bg-zinc-900 rounded p-2 max-h-40 overflow-auto">{JSON.stringify(tokenUniverse, null, 2)}</pre>
                    </div>
                    <div className="mb-4">
                        <h4 className="text-emerald-400 font-mono">Wallet Tokens</h4>
                        <pre className="text-xs text-zinc-300 bg-zinc-900 rounded p-2 max-h-40 overflow-auto">{JSON.stringify(walletTokens, null, 2)}</pre>
                    </div>
                </div>
            )}
            {/* DEBUG BUTTON (bottom right corner, dev only) */}
            {process.env.NODE_ENV !== 'production' && (
                <button
                    onClick={() => setShowDebug(v => !v)}
                    className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-3 py-1 rounded shadow-lg hover:bg-emerald-600 text-xs font-mono"
                >Debug</button>
            )}
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

            {/* ARRIVING TOKEN OVERLAY */}
            {arrivingToken && (swapState === 'arriving' || swapState === 'arrived') && (
                <div className="absolute inset-0 bg-black/95 rounded-2xl flex flex-col items-center justify-center z-20 p-6">
                    {/* Token Icon with Animation */}
                    <div className={`relative mb-4 ${swapState === 'arriving' ? 'animate-pulse' : ''}`}>
                        {arrivingToken.logoURI ? (
                            <img 
                                src={arrivingToken.logoURI} 
                                className={`w-16 h-16 rounded-full ${swapState === 'arrived' ? 'ring-4 ring-emerald-500/50' : 'ring-2 ring-white/20'}`}
                                alt={arrivingToken.symbol} 
                            />
                        ) : (
                            <div className={`w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center ${swapState === 'arrived' ? 'ring-4 ring-emerald-500/50' : 'ring-2 ring-white/20'}`}>
                                <span className="text-2xl font-bold text-white">{arrivingToken.symbol[0]}</span>
                            </div>
                        )}
                        {swapState === 'arrived' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Status Text */}
                    <h3 className="text-white font-bold text-lg mb-1">
                        {swapState === 'arriving' ? `${arrivingToken.symbol} Arriving...` : `${arrivingToken.symbol} Arrived!`}
                    </h3>
                    <p className="text-zinc-400 text-sm text-center mb-4">
                        {swapState === 'arriving' 
                            ? `~${arrivingToken.expectedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${arrivingToken.symbol} incoming`
                            : `Received! Ready to swap again`
                        }
                    </p>

                    {/* Progress Bar */}
                    {swapState === 'arriving' && (
                        <div className="w-full max-w-[200px] mb-4">
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out"
                                    style={{ width: `${arrivalProgress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-600 text-center mt-1 font-mono">
                                Detecting balance change...
                            </p>
                        </div>
                    )}

                    {/* Arrived Actions */}
                    {swapState === 'arrived' && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Auto-selecting {arrivingToken.symbol} for next swap
                            </div>
                        </div>
                    )}

                    {/* Skip Button */}
                    {swapState === 'arriving' && (
                        <button
                            onClick={() => {
                                if (arrivalPollRef.current) {
                                    clearInterval(arrivalPollRef.current);
                                    arrivalPollRef.current = null;
                                }
                                setArrivingToken(null);
                                setSwapState('idle');
                                loadWalletBalances();
                            }}
                            className="mt-4 text-zinc-500 hover:text-white text-sm"
                        >
                            Skip & Refresh
                        </button>
                    )}
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
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                        // Only allow numbers and decimal point
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleAmountChange(val);
                    }}
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
                disabled={(!canExecute && connected && !!fromToken && !!toToken && !!amount) || isArriving}
                onClick={handleSwap}
                className={`w-full rounded-xl py-4 font-bold tracking-wide transition-all hover:shadow-lg font-mono flex items-center justify-center gap-2 ${
                    swapState === 'arrived' 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400' 
                        : swapState === 'arriving'
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white cursor-wait'
                        : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white'
                }`}
            >
                {(isExecuting || swapState === 'arriving') && <Loader2 className="w-4 h-4 animate-spin" />}
                {swapState === 'arrived' && <Check className="w-4 h-4" />}
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
