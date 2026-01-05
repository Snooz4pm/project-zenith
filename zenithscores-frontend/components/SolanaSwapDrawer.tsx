"use client";

/**
 * SOLANA SWAP DRAWER
 * 
 * Pure Solana trading via Jupiter.
 * No EVM. No wagmi. No 0x.
 */

import { useEffect, useState, useMemo } from "react";
import { DiscoveredToken } from "@/lib/discovery/types";
import { X, ArrowDown, Loader2, CheckCircle2, AlertCircle, Settings, ExternalLink } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getSolanaQuote } from "@/lib/swap/solana/quote";
import { getSolanaSwapTransaction, executeSolanaSwap } from "@/lib/swap/solana/execute";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

interface SolanaSwapDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    token: DiscoveredToken | null;
    availableTokens?: DiscoveredToken[];
}

type SwapState = 'idle' | 'checking' | 'ready' | 'swapping' | 'confirming' | 'success' | 'error';
type RouteStatus = 'idle' | 'no-route' | 'amount-too-small' | 'insufficient-balance' | 'available';

const SLIPPAGE_PRESETS = [
    { label: 'Auto', value: 0.5 },
    { label: '0.1%', value: 0.1 },
    { label: '0.5%', value: 0.5 },
    { label: '1%', value: 1.0 },
    { label: '3%', value: 3.0 },
];

// SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Platform fee (0.5%)
const PLATFORM_FEE_BPS = parseInt(process.env.NEXT_PUBLIC_ZENITH_FEE_BPS || '50');

export function SolanaSwapDrawer({ isOpen, onClose, token, availableTokens = [] }: SolanaSwapDrawerProps) {
    const { connection } = useConnection();
    const { publicKey, signTransaction, connected } = useWallet();
    const { setVisible } = useWalletModal();

    // Token selection (default: SOL → selected token)
    const [fromToken, setFromToken] = useState<DiscoveredToken | null>(null);
    const [toToken, setToToken] = useState<DiscoveredToken | null>(token);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Swap controls
    const [amount, setAmount] = useState("");
    const [slippage, setSlippage] = useState(0.5);
    const [showSlippageSettings, setShowSlippageSettings] = useState(false);
    const [customSlippage, setCustomSlippage] = useState("");

    // Swap state
    const [state, setState] = useState<SwapState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [quote, setQuote] = useState<any>(null);
    const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');

    // SOL balance
    const [solBalance, setSolBalance] = useState<number>(0);

    // Fetch SOL balance
    useEffect(() => {
        if (!publicKey || !connection) {
            setSolBalance(0);
            return;
        }

        const fetchBalance = async () => {
            try {
                const balance = await connection.getBalance(publicKey);
                setSolBalance(balance / LAMPORTS_PER_SOL);
            } catch (e) {
                console.error('Failed to fetch SOL balance:', e);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [publicKey, connection]);

    // Default fromToken to SOL
    useEffect(() => {
        if (!fromToken) {
            setFromToken({
                chainType: 'SOLANA',
                chainId: 'solana',
                chain: 'solana',
                address: SOL_MINT,
                symbol: 'SOL',
                name: 'Solana',
                decimals: 9,
                liquidityUsd: 0,
                volume24hUsd: 0,
                source: 'JUPITER',
            });
        }
    }, [fromToken]);

    // Calculate preview values
    const minReceived = quote?.outAmount
        ? (Number(quote.outAmount) / Math.pow(10, toToken?.decimals || 9)).toFixed(6)
        : '—';
    const platformFeePercent = (PLATFORM_FEE_BPS / 10000) * 100;

    // Button state logic
    const getButtonState = () => {
        if (!connected) return { text: 'Connect Solana Wallet', disabled: false, action: 'connect' };
        if (!fromToken || !toToken) return { text: 'Select Tokens', disabled: true };
        if (!amount || parseFloat(amount) <= 0) return { text: 'Enter Amount', disabled: true };

        // Check SOL balance
        if (fromToken.address === SOL_MINT) {
            const sellAmount = parseFloat(amount);
            if (sellAmount > solBalance) {
                return { text: 'Insufficient SOL Balance', disabled: true };
            }
        }

        if (state === 'checking') return { text: 'Checking Route...', disabled: true };
        if (routeStatus === 'no-route') return { text: 'No Route Available', disabled: true };
        if (routeStatus === 'amount-too-small') return { text: 'Amount Too Small', disabled: true };
        if (state === 'error') return { text: 'Quote Failed', disabled: true };
        if (state === 'swapping') return { text: 'Signing...', disabled: true };
        if (state === 'confirming') return { text: 'Confirming...', disabled: true };

        if (state === 'ready' && quote) return { text: 'Swap on Solana', disabled: false, action: 'swap' };

        return { text: 'Swap on Solana', disabled: true };
    };

    const buttonState = getButtonState();
    const isLoading = ['checking', 'swapping', 'confirming'].includes(state);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setFromToken(null);
            setToToken(token);
            setAmount("");
            setSlippage(0.5);
            setState('idle');
            setError(null);
            setTxHash(null);
            setQuote(null);
            setShowFromPicker(false);
            setShowToPicker(false);
            setShowSlippageSettings(false);
        }
    }, [isOpen, token]);

    // Route check (on amount/slippage change)
    useEffect(() => {
        if (!amount || !fromToken || !toToken || !connected || parseFloat(amount) <= 0) {
            setQuote(null);
            setState('idle');
            return;
        }

        const checkRoute = async () => {
            setState('checking');
            setError(null);

            try {
                const decimals = fromToken.decimals || 9;
                const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

                console.log('[SolanaSwapDrawer] Quote request:', {
                    from: fromToken.symbol,
                    to: toToken.symbol,
                    inputAmount: amount,
                    decimals,
                    amountInSmallestUnit,
                });

                const solanaQuote = await getSolanaQuote({
                    inputMint: fromToken.address,
                    outputMint: toToken.address,
                    amount: amountInSmallestUnit,
                    slippageBps: Math.floor(slippage * 100),
                });

                if (!solanaQuote || !solanaQuote.routePlan || solanaQuote.routePlan.length === 0) {
                    setRouteStatus('no-route');
                    throw new Error('No executable swap route for this token pair');
                }

                setQuote(solanaQuote);
                setRouteStatus('available');
                setState('ready');
            } catch (err: any) {
                console.error('[SolanaSwapDrawer] Route check failed:', err);

                const errorMsg = String(err.message || err).toLowerCase();
                if (errorMsg.includes('no route') || errorMsg.includes('no executable')) {
                    setRouteStatus('no-route');
                    setError('No available route for this token pair');
                } else if (errorMsg.includes('insufficient') || errorMsg.includes('amount too small')) {
                    setRouteStatus('amount-too-small');
                    setError('Amount too small for available liquidity');
                } else {
                    setRouteStatus('idle');
                    setError(err.message || 'Quote failed');
                }

                setState('error');
            }
        };

        const debounce = setTimeout(checkRoute, 500);
        return () => clearTimeout(debounce);
    }, [amount, fromToken, toToken, slippage, connected]);

    // Execute swap
    const handleSwap = async () => {
        if (buttonState.action === 'connect') {
            setVisible(true);
            return;
        }

        if (!quote || !publicKey || !signTransaction || !connection) return;

        setState('swapping');
        setError(null);

        try {
            // Get swap transaction from Jupiter (via Railway proxy)
            const swapResult = await getSolanaSwapTransaction(
                quote,
                publicKey.toBase58()
            );

            setState('confirming');

            // Execute the swap - pass the wallet object from useWallet
            const wallet = { publicKey, signTransaction } as any;
            const signature = await executeSolanaSwap(
                swapResult.swapTransaction,
                wallet,
                connection
            );

            setTxHash(signature);
            setState('success');
        } catch (err: any) {
            console.error('[SolanaSwapDrawer] Swap failed:', err);
            setError(err.message || 'Swap failed');
            setState('error');
        }
    };

    // Swap tokens
    const swapTokens = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
        setAmount("");
        setQuote(null);
    };

    // Apply slippage
    const applySlippage = (value: number) => {
        setSlippage(value);
        setCustomSlippage("");
    };

    const applyCustomSlippage = () => {
        const val = parseFloat(customSlippage);
        if (!isNaN(val) && val > 0 && val <= 50) {
            setSlippage(val);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a0f] border-l border-white/10 z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">Swap on Solana</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Success State */}
                    {state === 'success' && txHash && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-green-400 font-medium mb-2">Swap Successful!</p>
                            <a
                                href={`https://solscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-purple-400 hover:underline inline-flex items-center gap-1"
                            >
                                View on Solscan <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}

                    {/* From Token */}
                    <div className="bg-[#111116] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">From</span>
                            {fromToken?.address === SOL_MINT && (
                                <span className="text-xs text-zinc-500">
                                    Balance: {solBalance.toFixed(4)} SOL
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFromPicker(true)}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                            >
                                <span className="font-medium text-white">
                                    {fromToken?.symbol || 'Select'}
                                </span>
                            </button>
                            <input
                                type="number"
                                placeholder="0.0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="flex-1 bg-transparent text-right text-2xl font-bold text-white outline-none"
                            />
                        </div>
                        {fromToken?.address === SOL_MINT && solBalance > 0 && (
                            <button
                                onClick={() => setAmount(String(Math.max(0, solBalance - 0.01)))}
                                className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                            >
                                Max (leave 0.01 SOL for fees)
                            </button>
                        )}
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center -my-2 relative z-10">
                        <button
                            onClick={swapTokens}
                            className="p-2 bg-[#111116] border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowDown className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>

                    {/* To Token */}
                    <div className="bg-[#111116] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">To</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowToPicker(true)}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                            >
                                <span className="font-medium text-white">
                                    {toToken?.symbol || 'Select'}
                                </span>
                            </button>
                            <div className="flex-1 text-right text-2xl font-bold text-zinc-500">
                                {minReceived}
                            </div>
                        </div>
                    </div>

                    {/* Slippage Settings */}
                    <div className="bg-[#111116] rounded-xl p-4 border border-white/5">
                        <button
                            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                            className="flex items-center justify-between w-full"
                        >
                            <span className="text-sm text-zinc-400">Slippage Tolerance</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white">{slippage}%</span>
                                <Settings className="w-4 h-4 text-zinc-500" />
                            </div>
                        </button>

                        {showSlippageSettings && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                                <div className="flex flex-wrap gap-2">
                                    {SLIPPAGE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => applySlippage(preset.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${slippage === preset.value
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                                : 'bg-white/5 text-zinc-400 border border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="number"
                                        placeholder="Custom %"
                                        value={customSlippage}
                                        onChange={(e) => setCustomSlippage(e.target.value)}
                                        className="flex-1 bg-white/5 rounded-lg px-3 py-1.5 text-sm text-white outline-none border border-white/5 focus:border-purple-500/50"
                                    />
                                    <button
                                        onClick={applyCustomSlippage}
                                        className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quote Details */}
                    {quote && state === 'ready' && (
                        <div className="bg-[#111116] rounded-xl p-4 border border-white/5 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Route</span>
                                <span className="text-zinc-300">Jupiter</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Min. Received</span>
                                <span className="text-zinc-300">{minReceived} {toToken?.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Platform Fee</span>
                                <span className="text-zinc-300">{platformFeePercent}%</span>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleSwap}
                        disabled={buttonState.disabled}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${buttonState.disabled
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-green-500 hover:from-purple-600 hover:to-green-600'
                            }`}
                    >
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {buttonState.text}
                    </button>
                </div>
            </div>

            {/* Token Picker Modal (simplified) */}
            {(showFromPicker || showToPicker) && (
                <TokenPicker
                    tokens={availableTokens}
                    onSelect={(t) => {
                        if (showFromPicker) setFromToken(t);
                        else setToToken(t);
                        setShowFromPicker(false);
                        setShowToPicker(false);
                    }}
                    onClose={() => {
                        setShowFromPicker(false);
                        setShowToPicker(false);
                    }}
                    excludeToken={showFromPicker ? toToken : fromToken}
                />
            )}
        </>
    );
}

// Simple Token Picker
function TokenPicker({
    tokens,
    onSelect,
    onClose,
    excludeToken,
}: {
    tokens: DiscoveredToken[];
    onSelect: (token: DiscoveredToken) => void;
    onClose: () => void;
    excludeToken?: DiscoveredToken | null;
}) {
    const [search, setSearch] = useState("");

    // Always include SOL at top
    const solToken: DiscoveredToken = {
        chainType: 'SOLANA',
        chainId: 'solana',
        chain: 'solana',
        address: SOL_MINT,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        liquidityUsd: 0,
        volume24hUsd: 0,
        source: 'JUPITER',
    };

    const filteredTokens = useMemo(() => {
        const query = search.toLowerCase();
        const allTokens = [solToken, ...tokens];

        return allTokens.filter(t => {
            if (excludeToken && t.address === excludeToken.address) return false;
            if (!search) return true;
            return (
                t.symbol.toLowerCase().includes(query) ||
                t.name.toLowerCase().includes(query) ||
                t.address.toLowerCase().includes(query)
            );
        });
    }, [tokens, search, excludeToken]);

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
            <div className="fixed inset-x-4 top-1/4 max-w-md mx-auto bg-[#111116] rounded-2xl border border-white/10 z-50 max-h-[60vh] flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <input
                        type="text"
                        placeholder="Search token..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 rounded-lg px-4 py-2 text-sm text-white outline-none border border-white/5 focus:border-purple-500/50"
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredTokens.slice(0, 50).map((token) => (
                        <button
                            key={token.address}
                            onClick={() => onSelect(token)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-purple-400">
                                    {token.symbol.slice(0, 2)}
                                </span>
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-white">{token.symbol}</p>
                                <p className="text-xs text-zinc-500">{token.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
