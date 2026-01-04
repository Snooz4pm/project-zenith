"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet/WalletContext";
import { DiscoveredToken } from "@/lib/discovery/types";
import { X, ArrowDown, ExternalLink, AlertCircle, CheckCircle2, Wallet as WalletIcon } from "lucide-react";

interface SwapDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    token: DiscoveredToken | null; // Initial TO token (optional)
}

export function SwapDrawer({ isOpen, onClose, token }: SwapDrawerProps) {
    const { session, switchEvmNetwork, signAndSendTx } = useWallet();

    // FROM + TO token state
    const [fromToken, setFromToken] = useState<DiscoveredToken | null>(null);
    const [toToken, setToToken] = useState<DiscoveredToken | null>(token);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [amount, setAmount] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [quoteTimestamp, setQuoteTimestamp] = useState<number | null>(null);
    const [canSwap, setCanSwap] = useState(false);

    // Determine active chain type from selected tokens
    const activeChainType = fromToken?.chainType || toToken?.chainType;
    const activeSession = activeChainType === 'SOLANA' ? session.solana : session.evm;
    const isConnected = !!activeSession;
    const userAddress = activeSession?.address || null;

    // Reset state when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setFromToken(null);
            setToToken(token); // Reset to initial token
            setAmount("");
            setQuote(null);
            setError(null);
            setTxHash(null);
            setSuccess(false);
            setQuoteTimestamp(null);
            setCanSwap(false);
            setShowFromPicker(false);
            setShowToPicker(false);
        }
    }, [isOpen, token]);

    // Wallet Guard: Auto-close if connection drops (mid-flow check)
    useEffect(() => {
        if (isOpen && !isConnected && !success) {
            onClose();
        }
    }, [isConnected, isOpen, success, onClose]);

    // Check if on correct network (EVM only)
    const isCorrectNetwork = !activeChainType || activeChainType === 'SOLANA' ||
        (activeChainType === 'EVM' && session.evm && fromToken && session.evm.chainId === parseInt(fromToken.chainId));

    // Route checking: Check if swap is executable (quote exists = route exists)
    useEffect(() => {
        if (!amount || !userAddress || !fromToken || !toToken || !isConnected || !isCorrectNetwork ||
            parseFloat(amount) <= 0 || fromToken.chainType !== toToken.chainType) {
            setQuote(null);
            setQuoteTimestamp(null);
            setCanSwap(false);
            return;
        }

        const checkRoute = async () => {
            setLoading(true);
            setError(null);

            try {
                // Calculate amount in smallest unit (using fromToken decimals)
                const decimals = fromToken.decimals || 9;
                const amountInSmallestUnit = (parseFloat(amount) * Math.pow(10, decimals)).toString();

                // Choose API endpoint based on chain type
                const endpoint = fromToken.chainType === 'SOLANA'
                    ? '/api/arena/solana/quote'
                    : '/api/arena/evm/route';

                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        fromToken.chainType === 'SOLANA'
                            ? {
                                inputMint: fromToken.address,
                                outputMint: toToken.address,
                                amount: amountInSmallestUnit
                            }
                            : {
                                chain: fromToken.chain,
                                sellToken: fromToken.address,
                                buyToken: toToken.address,
                                sellAmount: amountInSmallestUnit
                            }
                    )
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to check route');
                }

                const data = await res.json();
                const executable = data.executable || false;

                setCanSwap(executable);
                setQuote(executable ? data.quote : null);
                setQuoteTimestamp(executable ? Date.now() : null);

                if (!executable) {
                    setError('No route available for this token pair');
                }
            } catch (err: any) {
                console.error('[SwapDrawer] Route check error:', err);
                setError(err.message || "Failed to check route");
                setCanSwap(false);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(checkRoute, 500);
        return () => clearTimeout(debounce);
    }, [amount, userAddress, fromToken, toToken, isConnected, isCorrectNetwork]);

    const executeSwap = async () => {
        if (!quote || !userAddress || !fromToken || !toToken) return;

        // Quote Expiration Guard: Quotes older than 20s are risky
        if (quoteTimestamp && Date.now() - quoteTimestamp > 20000) {
            setError("Quote expired. Refreshing...");
            setQuote(null); // This triggers useEffect to refetch
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Choose API endpoint based on chain type
            const endpoint = fromToken.chainType === 'SOLANA'
                ? '/api/arena/solana/swap'
                : '/api/arena/evm/swap';

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quote,
                    userPublicKey: userAddress, // For Solana
                    userAddress, // For EVM
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to build transaction');
            }

            const txPayload = await res.json();
            const hash = await signAndSendTx(fromToken.chainType, txPayload);
            setTxHash(hash);
            setSuccess(true);

            setTimeout(() => onClose(), 3000);
        } catch (err: any) {
            console.error('[SwapDrawer] Swap error:', err);
            setError(err.message || "Swap failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchNetwork = async () => {
        if (!fromToken || fromToken.chainType !== 'EVM') return;

        try {
            await switchEvmNetwork(parseInt(fromToken.chainId));
        } catch (err: any) {
            setError(err.message || 'Failed to switch network');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-[#0a0a0f] text-white border-l border-white/10 z-50 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10">
                <div>
                    <h2 className="text-lg font-semibold">Swap</h2>
                    <p className="text-xs text-zinc-500">Non-custodial • {activeChainType || 'Select tokens'}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <X size={20} className="text-zinc-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {!isConnected && (fromToken || toToken) ? (
                    <div className="text-center py-12">
                        <WalletIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-4">Connect {activeChainType === 'SOLANA' ? 'Solana' : 'EVM'} wallet to swap</p>
                        <p className="text-xs text-zinc-600">Use the wallet button in the navbar</p>
                    </div>
                ) : !isCorrectNetwork && fromToken ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <p className="text-blue-500 mb-2">Wrong Network</p>
                        <p className="text-sm text-zinc-400 mb-6">
                            You're on {session.evm?.networkName}
                            <br />
                            This token is on {fromToken.networkName}
                        </p>
                        <button
                            onClick={handleSwitchNetwork}
                            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Switch to {fromToken.networkName}
                        </button>
                    </div>
                ) : success ? (
                    <div className="text-center py-12">
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Swap Successful!</h3>
                        {txHash && fromToken && (
                            <a
                                href={fromToken.chainType === 'SOLANA'
                                    ? `https://solscan.io/tx/${txHash}`
                                    : `https://etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-emerald-500 hover:underline text-sm"
                            >
                                View transaction
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                ) : (
                    <>
                        {/* FROM Token Selector */}
                        <div className="mb-2">
                            <label className="text-sm text-zinc-400 block mb-2">From</label>
                            <button
                                onClick={() => setShowFromPicker(true)}
                                className="w-full bg-[#111116] rounded-lg p-4 border border-transparent hover:border-white/10 transition-colors text-left"
                            >
                                {fromToken ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {fromToken.logoURI && (
                                                <img src={fromToken.logoURI} alt={fromToken.symbol} className="w-8 h-8 rounded-full" />
                                            )}
                                            <div>
                                                <div className="font-semibold">{fromToken.symbol}</div>
                                                <div className="text-xs text-zinc-500">{fromToken.name}</div>
                                            </div>
                                        </div>
                                        <div className="text-zinc-400">▼</div>
                                    </div>
                                ) : (
                                    <div className="text-zinc-500 text-center py-2">Select token</div>
                                )}
                            </button>
                        </div>

                        {/* Amount Input */}
                        {fromToken && (
                            <div className="mb-2">
                                <label className="text-sm text-zinc-400 block mb-2">Amount</label>
                                <div className="bg-[#111116] rounded-lg p-4 border border-transparent">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '' || (parseFloat(val) >= 0 && !isNaN(parseFloat(val)))) {
                                                setAmount(val);
                                            }
                                        }}
                                        placeholder="0.0"
                                        min="0"
                                        step="any"
                                        className="w-full bg-transparent text-2xl font-semibold outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Arrow Icon */}
                        <div className="flex justify-center -my-1 relative z-10">
                            <div className="p-2 bg-[#0a0a0f] border border-white/10 rounded-lg">
                                <ArrowDown size={16} className="text-zinc-400" />
                            </div>
                        </div>

                        {/* TO Token Selector */}
                        <div className="mb-4">
                            <label className="text-sm text-zinc-400 block mb-2">To</label>
                            <button
                                onClick={() => setShowToPicker(true)}
                                className="w-full bg-[#111116] rounded-lg p-4 border border-transparent hover:border-white/10 transition-colors text-left"
                            >
                                {toToken ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {toToken.logoURI && (
                                                <img src={toToken.logoURI} alt={toToken.symbol} className="w-8 h-8 rounded-full" />
                                            )}
                                            <div>
                                                <div className="font-semibold">{toToken.symbol}</div>
                                                <div className="text-xs text-zinc-500">{toToken.name}</div>
                                            </div>
                                        </div>
                                        <div>
                                            {loading ? (
                                                <div className="text-zinc-500">...</div>
                                            ) : quote ? (
                                                <div className="text-right">
                                                    <div className="font-semibold">{(Number(quote.outAmount || quote.buyAmount) / Math.pow(10, toToken.decimals || 9)).toFixed(6)}</div>
                                                    <div className="text-xs text-zinc-500">Est. receive</div>
                                                </div>
                                            ) : (
                                                <div className="text-zinc-400">▼</div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-zinc-500 text-center py-2">Select token</div>
                                )}
                            </button>
                        </div>

                        {/* Route Status */}
                        {fromToken && toToken && amount && (
                            <div className={`${canSwap ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'} border rounded-lg p-3 mb-4`}>
                                <div className={`text-xs ${canSwap ? 'text-emerald-300' : 'text-blue-300'} space-y-1`}>
                                    {canSwap ? (
                                        <>
                                            <div>✓ Route found</div>
                                            <div>• Non-custodial</div>
                                            <div>• Best on-chain route</div>
                                        </>
                                    ) : (
                                        <div>{loading ? 'Checking route...' : 'No route available'}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && !loading && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}

                        {/* Swap Button */}
                        <button
                            onClick={executeSwap}
                            disabled={!canSwap || loading || !fromToken || !toToken || !amount || parseFloat(amount) <= 0}
                            className="w-full py-4 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' :
                                !fromToken || !toToken ? 'Select tokens' :
                                    !amount || parseFloat(amount) <= 0 ? 'Enter amount' :
                                        !canSwap ? 'No route available' :
                                            'Swap'}
                        </button>

                        <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                            <p className="text-xs text-yellow-500/80 text-center">
                                ⚠️ Swaps are non-custodial. Verify transaction before signing.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* FROM Token Picker Modal */}
            {showFromPicker && (
                <TokenPickerModal
                    isOpen={showFromPicker}
                    onClose={() => setShowFromPicker(false)}
                    onSelect={(token) => {
                        setFromToken(token);
                        setShowFromPicker(false);
                    }}
                    filterChainType={toToken?.chainType}
                    excludeToken={toToken}
                />
            )}

            {/* TO Token Picker Modal */}
            {showToPicker && (
                <TokenPickerModal
                    isOpen={showToPicker}
                    onClose={() => setShowToPicker(false)}
                    onSelect={(token) => {
                        setToToken(token);
                        setShowToPicker(false);
                    }}
                    filterChainType={fromToken?.chainType}
                    excludeToken={fromToken}
                />
            )}
        </div>
    );
}

// Simple Token Picker Modal Component
function TokenPickerModal({
    isOpen,
    onClose,
    onSelect,
    filterChainType,
    excludeToken
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (token: DiscoveredToken) => void;
    filterChainType?: string;
    excludeToken?: DiscoveredToken | null;
}) {
    const [tokens, setTokens] = useState<DiscoveredToken[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const fetchTokens = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/arena/discovery');
                if (res.ok) {
                    const data = await res.json();
                    let allTokens = data.tokens || [];

                    // Filter by chain type if specified
                    if (filterChainType) {
                        allTokens = allTokens.filter((t: DiscoveredToken) => t.chainType === filterChainType);
                    }

                    // Exclude the other selected token
                    if (excludeToken) {
                        allTokens = allTokens.filter((t: DiscoveredToken) => t.address !== excludeToken.address);
                    }

                    setTokens(allTokens.slice(0, 100)); // Limit to 100 tokens for performance
                }
            } catch (err) {
                console.error('[TokenPicker] Failed to fetch tokens:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTokens();
    }, [isOpen, filterChainType, excludeToken]);

    const filteredTokens = tokens.filter(t =>
        t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.address.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#0a0a0f] rounded-lg w-[400px] max-h-[600px] border border-white/10 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Select Token</h3>
                        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded">
                            <X size={18} className="text-zinc-400" />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, symbol, or address"
                        className="w-full bg-[#111116] rounded-lg px-3 py-2 text-sm outline-none border border-transparent focus:border-white/10"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="text-center py-8 text-zinc-500">Loading tokens...</div>
                    ) : filteredTokens.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">No tokens found</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredTokens.map((token) => (
                                <button
                                    key={`${token.chainType}-${token.address}`}
                                    onClick={() => onSelect(token)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                                >
                                    {token.logoURI ? (
                                        <img src={token.logoURI} alt={token.symbol} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold">
                                            {token.symbol.slice(0, 2)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold">{token.symbol}</div>
                                        <div className="text-xs text-zinc-500 truncate">{token.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-zinc-500">{token.chainType}</div>
                                        {token.priceUsd && token.priceUsd > 0 && (
                                            <div className="text-xs font-medium">${token.priceUsd.toFixed(4)}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
