"use client";

import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@/lib/wallet/WalletContext";
import { DiscoveredToken } from "@/lib/discovery/types";
import { X, ArrowDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useWalletClient } from "wagmi";
import { useConnection, useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { getEvmQuote, approveEvmIfNeeded, executeEvmSwap } from "@/lib/swap/evm";
import { getSolanaQuote, getSolanaSwapTransaction, executeSolanaSwap, toSolanaAmount } from "@/lib/swap/solana";

interface SwapDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    token: DiscoveredToken | null;
    availableTokens?: DiscoveredToken[];
}

type SwapState = 'idle' | 'checking' | 'ready' | 'approving' | 'swapping' | 'success' | 'error';

export function SwapDrawer({ isOpen, onClose, token, availableTokens = [] }: SwapDrawerProps) {
    const { session } = useWallet();
    const { data: evmWalletClient } = useWalletClient();
    const { connection } = useConnection();
    const solanaWallet = useSolanaWallet();

    // Token selection
    const [fromToken, setFromToken] = useState<DiscoveredToken | null>(null);
    const [toToken, setToToken] = useState<DiscoveredToken | null>(token);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Swap state
    const [amount, setAmount] = useState("");
    const [state, setState] = useState<SwapState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [quote, setQuote] = useState<any>(null);

    // Derive connection status
    const chainType = fromToken?.chainType || toToken?.chainType;
    const isConnected = chainType === 'SOLANA' ? !!session.solana : !!session.evm;
    const userAddress = chainType === 'SOLANA' ? session.solana?.address : session.evm?.address;

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setFromToken(null);
            setToToken(token);
            setAmount("");
            setState('idle');
            setError(null);
            setTxHash(null);
            setQuote(null);
            setShowFromPicker(false);
            setShowToPicker(false);
        }
    }, [isOpen, token]);

    // Route check (on amount change)
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

                if (fromToken.chainType === 'SOLANA') {
                    const solanaQuote = await getSolanaQuote({
                        inputMint: fromToken.address,
                        outputMint: toToken.address,
                        amount: amountInSmallestUnit,
                    });
                    setQuote(solanaQuote);
                    setState('ready');
                } else {
                    const evmQuote = await getEvmQuote({
                        sellToken: fromToken.address,
                        buyToken: toToken.address,
                        sellAmount: String(amountInSmallestUnit),
                        chainId: parseInt(fromToken.chainId),
                    });
                    setQuote(evmQuote);
                    setState('ready');
                }
            } catch (err: any) {
                console.error('[SwapDrawer] Route check failed:', err);
                setError('No route available for this pair');
                setState('error');
            }
        };

        const debounce = setTimeout(checkRoute, 800);
        return () => clearTimeout(debounce);
    }, [amount, fromToken, toToken, isConnected]);

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
                const txHash = await executeEvmSwap(quote, evmWalletClient);
                setTxHash(txHash);
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

    const canSwap = state === 'ready' && quote && isConnected;
    const isLoading = state === 'checking' || state === 'approving' || state === 'swapping';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Swap</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* From Token */}
                <div className="mb-2">
                    <label className="text-xs text-zinc-500 mb-2 block">From</label>
                    <button
                        onClick={() => setShowFromPicker(true)}
                        className="w-full p-4 bg-[#111116] border border-white/10 rounded-xl text-left hover:border-white/20 transition-colors"
                    >
                        {fromToken ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{fromToken.symbol}</span>
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
                <div className="mb-6">
                    <label className="text-xs text-zinc-500 mb-2 block">To</label>
                    <button
                        onClick={() => setShowToPicker(true)}
                        className="w-full p-4 bg-[#111116] border border-white/10 rounded-xl text-left hover:border-white/20 transition-colors"
                    >
                        {toToken ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{toToken.symbol}</span>
                                <span className="text-sm text-zinc-500">{toToken.name}</span>
                            </div>
                        ) : (
                            <span className="text-zinc-500">Select token</span>
                        )}
                    </button>
                </div>

                {/* Status Messages */}
                {state === 'checking' && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2 text-blue-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking route...</span>
                    </div>
                )}

                {state === 'ready' && quote && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Route available</span>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                {state === 'success' && txHash && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-semibold">Swap successful!</span>
                        </div>
                        <a
                            href={chainType === 'SOLANA'
                                ? `https://solscan.io/tx/${txHash}`
                                : `https://etherscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                        >
                            View transaction
                        </a>
                    </div>
                )}

                {/* Swap Button */}
                <button
                    onClick={handleSwap}
                    disabled={!canSwap || isLoading}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {state === 'approving' ? 'Approving...' : state === 'swapping' ? 'Swapping...' : 'Swap'}
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

// Token Picker Modal
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

        if (filterChainType) {
            result = result.filter(t => t.chainType === filterChainType);
        }

        if (excludeToken) {
            result = result.filter(t => t.address !== excludeToken.address);
        }

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
