"use client";

import { useEffect, useState, useMemo } from "react";
import { useUnifiedWallet } from "@/lib/wallet/useUnifiedWallet";
import { DiscoveredToken } from "@/lib/discovery/types";
import { X, ArrowDown, Loader2, CheckCircle2, AlertCircle, Settings, ExternalLink } from "lucide-react";
import { useWalletClient, usePublicClient, useBalance } from "wagmi";
import { useConnection, useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { getEvmQuote, approveEvmIfNeeded, executeEvmSwap, calculateGasCost } from "@/lib/swap/evm";
import { getSolanaQuote, getSolanaSwapTransaction, executeSolanaSwap } from "@/lib/swap/solana";

interface SwapDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    token: DiscoveredToken | null;
    availableTokens?: DiscoveredToken[];
}

type SwapState = 'idle' | 'checking' | 'ready' | 'approving' | 'swapping' | 'confirming' | 'success' | 'error';
type RouteStatus = 'idle' | 'no-route' | 'amount-too-small' | 'insufficient-balance' | 'available';

const SLIPPAGE_PRESETS = [
    { label: 'Auto', value: 0.5 },
    { label: '0.1%', value: 0.1 },
    { label: '0.5%', value: 0.5 },
    { label: '1%', value: 1.0 },
];

const EXPLORER_URLS: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    56: 'https://bscscan.com/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    8453: 'https://basescan.org/tx/',
};

// Fee configuration (from env)
const PLATFORM_FEE_BPS = parseInt(process.env.ZENITH_FEE_BPS || '50'); // 0.5% default
const EVM_FEE_WALLET = process.env.ZENITH_EVM_FEE_RECIPIENT || '0x0000000000000000000000000000000000000000';
const SOL_FEE_WALLET = process.env.ZENITH_SOL_FEE_RECIPIENT || '';

export function SwapDrawer({ isOpen, onClose, token, availableTokens = [] }: SwapDrawerProps) {
    const { data: evmWalletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { connection } = useConnection();
    const solanaWallet = useSolanaWallet();

    // Token selection
    const [fromToken, setFromToken] = useState<DiscoveredToken | null>(null);
    const [toToken, setToToken] = useState<DiscoveredToken | null>(token);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Swap controls
    const [amount, setAmount] = useState("");
    const [slippage, setSlippage] = useState(0.5); // 0.5%
    const [showSlippageSettings, setShowSlippageSettings] = useState(false);
    const [customSlippage, setCustomSlippage] = useState("");

    // Swap state
    const [state, setState] = useState<SwapState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [quote, setQuote] = useState<any>(null);
    const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle');

    // Unified wallet (single source of truth)
    const activeChain = fromToken?.chainType === 'SOLANA' ? 'solana' : fromToken?.chainType === 'EVM' ? 'evm' : 'none';
    const { isConnected, address: userAddress } = useUnifiedWallet(activeChain);
    const chainId = fromToken?.chainId ? parseInt(fromToken.chainId) : 1;
    const chainType = fromToken?.chainType || toToken?.chainType; // For gas/explorer logic

    // Balance fetching (lazy - only for selected fromToken)
    const { data: evmBalance } = useBalance({
        address: userAddress as `0x${string}`,
        token: fromToken?.chainType === 'EVM' && fromToken.address !== 'ETH' ? fromToken.address as `0x${string}` : undefined,
        chainId: fromToken?.chainType === 'EVM' ? chainId : undefined,
        // Note: Conditional fetching handled by React Query when address/token are undefined
    });

    const balance = fromToken?.chainType === 'EVM' ? evmBalance : null; // Solana balance TODO

    // Calculate preview values
    const gasEstimateEth = quote && chainType === 'EVM' ? calculateGasCost(quote) : 0;
    const minReceived = quote?.minBuyAmount
        ? (Number(quote.minBuyAmount) / Math.pow(10, toToken?.decimals || 18)).toFixed(6)
        : '—';
    const platformFeePercent = (PLATFORM_FEE_BPS / 10000) * 100;

    // Swap button logic and text
    const getButtonState = () => {
        if (!isConnected) return { text: 'Connect Wallet', disabled: true };
        if (!fromToken || !toToken) return { text: 'Select Tokens', disabled: true };
        if (!amount || parseFloat(amount) <= 0) return { text: 'Enter Amount', disabled: true };

        // Check balance
        if (balance && fromToken.chainType === 'EVM') {
            const sellAmount = parseFloat(amount);
            const availableBalance = parseFloat(balance.formatted);
            if (sellAmount > availableBalance) {
                return { text: `Insufficient ${fromToken.symbol} Balance`, disabled: true };
            }
        }

        // Check route status
        if (state === 'checking') return { text: 'Checking Route...', disabled: true };
        if (routeStatus === 'no-route') return { text: 'No Route Available', disabled: true };
        if (routeStatus === 'amount-too-small') return { text: 'Amount Too Small', disabled: true };
        if (state === 'error') return { text: 'Quote Failed', disabled: true };

        // Loading states
        if (state === 'approving') return { text: 'Approving...', disabled: true };
        if (state === 'swapping') return { text: 'Signing...', disabled: true };
        if (state === 'confirming') return { text: 'Confirming...', disabled: true };

        // Ready to swap
        if (state === 'ready' && quote) return { text: 'Swap', disabled: false };

        return { text: 'Swap', disabled: true };
    };

    const buttonState = getButtonState();
    const canSwap = !buttonState.disabled;
    const isLoading = ['checking', 'approving', 'swapping', 'confirming'].includes(state);

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
        if (!amount || !fromToken || !toToken || !isConnected || parseFloat(amount) <= 0) {
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

                // Debug logging (CRITICAL - verify amount is integer)
                console.log('[SwapDrawer] Quote request:', {
                    from: fromToken.symbol,
                    to: toToken.symbol,
                    inputAmount: amount,
                    decimals,
                    amountInSmallestUnit,
                    fromAddress: fromToken.address,
                    toAddress: toToken.address,
                });

                if (fromToken.chainType === 'SOLANA') {
                    const solanaQuote = await getSolanaQuote({
                        inputMint: fromToken.address,
                        outputMint: toToken.address,
                        amount: amountInSmallestUnit,
                        slippageBps: Math.floor(slippage * 100),
                    });

                    // Validate route exists (critical for Jupiter)
                    if (!solanaQuote || !solanaQuote.routePlan || solanaQuote.routePlan.length === 0) {
                        setRouteStatus('no-route');
                        throw new Error('No executable swap route for this token pair');
                    }

                    setQuote(solanaQuote);
                    setRouteStatus('available');
                    setState('ready');
                } else {
                    const evmQuote = await getEvmQuote({
                        sellToken: fromToken.address,
                        buyToken: toToken.address,
                        sellAmount: String(amountInSmallestUnit),
                        chainId,
                        slippagePercentage: slippage / 100,
                        affiliateAddress: EVM_FEE_WALLET,
                        buyTokenPercentageFee: String(PLATFORM_FEE_BPS / 10000),
                    });
                    setQuote(evmQuote);
                    setRouteStatus('available');
                    setState('ready');
                }
            } catch (err: any) {
                console.error('[SwapDrawer] Route check failed:', err);

                // Classify error for UX
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

        const debounce = setTimeout(checkRoute, 800);
        return () => clearTimeout(debounce);
    }, [amount, fromToken, toToken, isConnected, slippage, chainId]);

    // Execute swap
    const handleSwap = async () => {
        if (!quote || !fromToken || !toToken || !userAddress) return;

        try {
            setState('swapping');
            setError(null);

            if (fromToken.chainType === 'SOLANA') {
                // Solana flow
                const { swapTransaction } = await getSolanaSwapTransaction(quote, userAddress);
                const txid = await executeSolanaSwap(swapTransaction, solanaWallet, connection);
                setTxHash(txid);
                setState('confirming');

                // Wait for confirmation
                await connection.confirmTransaction(txid, 'confirmed');
                setState('success');
            } else {
                // EVM flow
                if (!evmWalletClient) throw new Error('EVM wallet not connected');

                // Check if approval needed
                if (quote.allowanceTarget) {
                    setState('approving');
                    await approveEvmIfNeeded(quote, evmWalletClient);
                }

                setState('swapping');
                const hash = await executeEvmSwap(quote, evmWalletClient);
                setTxHash(hash);
                setState('confirming');

                // Wait for confirmation
                if (publicClient) {
                    await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
                }
                setState('success');
            }

            setTimeout(() => onClose(), 3000);
        } catch (err: any) {
            console.error('[SwapDrawer] Swap failed:', err);
            setError(err.message || 'Swap failed');
            setState('error');
        }
    };

    if (!isOpen) return null;

    const explorerUrl = txHash && chainType === 'SOLANA'
        ? `https://solscan.io/tx/${txHash}`
        : txHash && EXPLORER_URLS[chainId]
            ? `${EXPLORER_URLS[chainId]}${txHash}`
            : null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Swap</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Settings className="w-5 h-5 text-zinc-500" />
                        </button>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Slippage Settings */}
                {showSlippageSettings && (
                    <div className="mb-4 p-4 bg-[#111116] border border-white/10 rounded-xl">
                        <label className="text-sm font-semibold text-white mb-3 block">Slippage Tolerance</label>
                        <div className="flex gap-2 mb-3">
                            {SLIPPAGE_PRESETS.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => setSlippage(preset.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${slippage === preset.value
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={customSlippage}
                                onChange={(e) => {
                                    setCustomSlippage(e.target.value);
                                    const val = parseFloat(e.target.value);
                                    if (val > 0 && val <= 50) setSlippage(val);
                                }}
                                placeholder="Custom %"
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-blue-500"
                            />
                            <span className="flex items-center text-sm text-zinc-500">%</span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-600">Current: {slippage}%</p>
                    </div>
                )}

                {/* From Token */}
                <div className="mb-2">
                    <label className="text-xs text-zinc-500 mb-2 block">From</label>
                    <button
                        onClick={() => setShowFromPicker(true)}
                        className="w-full p-4 bg-[#111116] border border-white/10 rounded-xl text-left hover:border-white/20 transition-colors"
                    >
                        {fromToken ? (
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-semibold">{fromToken.symbol}</span>
                                <span className="text-sm text-zinc-500">{fromToken.name}</span>
                            </div>
                        ) : (
                            <span className="text-zinc-500">Select token</span>
                        )}
                    </button>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full mt-2 p-4 bg-[#111116] border border-white/10 rounded-xl text-2xl font-bold outline-none focus:border-white/30"
                        disabled={!fromToken}
                    />
                </div>

                {/* Swap Icon */}
                <div className="flex justify-center my-4">
                    <div className="p-2 bg-[#111116] border border-white/10 rounded-lg">
                        <ArrowDown className="w-5 h-5 text-zinc-500" />
                    </div>
                </div>

                {/* To Token */}
                <div className="mb-4">
                    <label className="text-xs text-zinc-500 mb-2 block">To</label>
                    <button
                        onClick={() => setShowToPicker(true)}
                        className="w-full p-4 bg-[#111116] border border-white/10 rounded-xl text-left hover:border-white/20 transition-colors"
                    >
                        {toToken ? (
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-semibold">{toToken.symbol}</span>
                                <span className="text-sm text-zinc-500">{toToken.name}</span>
                            </div>
                        ) : (
                            <span className="text-zinc-500">Select token</span>
                        )}
                    </button>
                </div>

                {/* Fee Breakdown */}
                {quote && state === 'ready' && (
                    <div className="mb-4 p-4 bg-[#111116] border border-white/10 rounded-xl space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Minimum Received</span>
                            <span className="font-medium text-white">{minReceived} {toToken?.symbol}</span>
                        </div>
                        {chainType === 'EVM' && gasEstimateEth > 0 && (
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Est. Gas Fee</span>
                                <span className="font-medium text-white">~{gasEstimateEth.toFixed(6)} ETH</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Platform Fee</span>
                            <span className="font-medium text-white">{platformFeePercent}%</span>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-xs text-zinc-600">
                            Includes a {platformFeePercent}% platform fee
                        </div>
                    </div>
                )}

                {/* Status Messages */}
                {state === 'checking' && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2 text-blue-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>Checking route...</span>
                    </div>
                )}

                {state === 'ready' && quote && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Route available</span>
                    </div>
                )}

                {state === 'approving' && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2 text-blue-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>Approving token...</span>
                    </div>
                )}

                {state === 'swapping' && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2 text-blue-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>Signing transaction...</span>
                    </div>
                )}

                {state === 'confirming' && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2 text-blue-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>Waiting for confirmation...</span>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {state === 'success' && txHash && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span className="font-semibold">Swap successful!</span>
                        </div>
                        {explorerUrl && (
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs underline hover:text-green-300 transition-colors"
                            >
                                <span>View transaction</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                )}

                {/* Swap Button */}
                <button
                    onClick={handleSwap}
                    disabled={!canSwap || isLoading}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {state === 'approving' ? 'Approving...' :
                        state === 'swapping' ? 'Signing...' :
                            state === 'confirming' ? 'Confirming...' :
                                'Swap'}
                </button>

                {/* Token Pickers */}
                {showFromPicker && (
                    <TokenPickerModal
                        isOpen={showFromPicker}
                        onClose={() => setShowFromPicker(false)}
                        onSelect={(t) => { setFromToken(t); setShowFromPicker(false); }}
                        availableTokens={availableTokens}
                        filterChainType={toToken?.chainType}
                        excludeToken={toToken}
                    />
                )}

                {showToPicker && (
                    <TokenPickerModal
                        isOpen={showToPicker}
                        onClose={() => setShowToPicker(false)}
                        onSelect={(t) => { setToToken(t); setShowToPicker(false); }}
                        availableTokens={availableTokens}
                        filterChainType={fromToken?.chainType}
                        excludeToken={fromToken}
                    />
                )}
            </div>
        </div>
    );
}

// Token Picker Modal (unchanged)
function TokenPickerModal({
    isOpen,
    onClose,
    onSelect,
    filterChainType,
    excludeToken,
    availableTokens = []
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (token: DiscoveredToken) => void;
    filterChainType?: string;
    excludeToken?: DiscoveredToken | null;
    availableTokens?: DiscoveredToken[];
}) {
    const [search, setSearch] = useState("");

    const filteredTokens = useMemo(() => {
        let result = availableTokens;
        if (filterChainType) result = result.filter(t => t.chainType === filterChainType);
        if (excludeToken) result = result.filter(t => t.address !== excludeToken.address);
        if (search) {
            const query = search.toLowerCase();
            result = result.filter(t =>
                t.symbol.toLowerCase().includes(query) ||
                t.name.toLowerCase().includes(query) ||
                t.address.toLowerCase() === query
            );
        }
        return result.slice(0, 100);
    }, [availableTokens, filterChainType, excludeToken, search]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Select Token</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full p-3 bg-[#111116] border border-white/10 rounded-lg mb-4 outline-none focus:border-white/30"
                />
                <div className="flex-1 overflow-y-auto space-y-1">
                    {filteredTokens.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">No tokens found</div>
                    ) : (
                        filteredTokens.map((token) => (
                            <button
                                key={`${token.chainType}-${token.address}`}
                                onClick={() => onSelect(token)}
                                className="w-full p-3 hover:bg-white/5 rounded-lg text-left flex items-center gap-3 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="font-semibold">{token.symbol}</div>
                                    <div className="text-xs text-zinc-500">{token.name}</div>
                                </div>
                                <div className="text-xs text-zinc-600">{token.chainType}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
