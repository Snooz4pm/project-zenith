"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet/WalletContext";
import { GlobalToken, CHAIN_METADATA } from "@/lib/discovery/normalize";
import { X, ArrowDown, ExternalLink, AlertCircle, CheckCircle2, Wallet as WalletIcon } from "lucide-react";

interface SwapDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    token: GlobalToken | null;
}

export function SwapDrawer({ isOpen, onClose, token }: SwapDrawerProps) {
    const { wallet, connect, switchNetwork, signAndSendTx } = useWallet();

    const [amount, setAmount] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Balance checks (CRITICAL for Option C)
    const nativeBalance = parseFloat(wallet.nativeBalanceFormatted);
    const hasBalance = nativeBalance > 0;
    const nativeSymbol = wallet.vm === 'SOLANA' ? 'SOL' : wallet.chainId === 56 ? 'BNB' : 'ETH';
    const insufficientBalance = amount && parseFloat(amount) > nativeBalance;

    // Reset state when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setAmount("");
            setQuote(null);
            setError(null);
            setTxHash(null);
            setSuccess(false);
        }
    }, [isOpen]);

    // Check if wallet is on correct VM
    const isCorrectVM = token && wallet.vm === token.chainType;

    // Check if on correct network (EVM only)
    const isCorrectNetwork = !token || token.chainType === 'SOLANA' ||
        (token.chainType === 'EVM' && wallet.chainId === parseInt(token.chainId));

    // Fetch quote when amount changes
    useEffect(() => {
        if (!amount || !wallet.address || !token || !isCorrectVM || !isCorrectNetwork ||
            parseFloat(amount) <= 0 || insufficientBalance || !hasBalance) {
            setQuote(null);
            return;
        }

        const fetchQuote = async () => {
            setLoading(true);
            setError(null);

            try {
                const sellToken = wallet.vm === 'SOLANA'
                    ? 'So11111111111111111111111111111111111111112'
                    : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

                const amountInSmallestUnit = (parseFloat(amount) * 1e9).toString();

                const res = await fetch("/api/swap/quote", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chainType: wallet.vm,
                        chainId: wallet.chainId,
                        sellToken,
                        buyToken: token.address,
                        amount: amountInSmallestUnit,
                        userAddress: wallet.address
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch quote');
                }

                const data = await res.json();
                setQuote(data);
            } catch (err: any) {
                console.error('[SwapDrawer] Quote error:', err);
                setError(err.message || "Failed to fetch quote");
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchQuote, 500);
        return () => clearTimeout(debounce);
    }, [amount, wallet.address, wallet.vm, wallet.chainId, token, isCorrectVM, isCorrectNetwork, insufficientBalance, hasBalance]);

    const executeSwap = async () => {
        if (!quote || !wallet.address) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/swap/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chainType: wallet.vm,
                    quote,
                    quoteResponse: quote,
                    userPublicKey: wallet.address,
                    userAddress: wallet.address,
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to build transaction');
            }

            const txPayload = await res.json();
            const hash = await signAndSendTx(txPayload);
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
        if (!token || token.chainType !== 'EVM') return;

        try {
            await switchNetwork(parseInt(token.chainId));
        } catch (err: any) {
            setError(err.message || 'Failed to switch network');
        }
    };

    if (!isOpen || !token) return null;

    const chainMeta = CHAIN_METADATA[token.chainId];

    return (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-[#0a0a0f] text-white border-l border-white/10 z-50 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10">
                <div>
                    <h2 className="text-lg font-semibold">Swap</h2>
                    <p className="text-xs text-zinc-500">Non-custodial • {token.networkName}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <X size={20} className="text-zinc-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {!wallet.isConnected ? (
                    <div className="text-center py-12">
                        <WalletIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-4">Connect your wallet to swap</p>
                        <button
                            onClick={connect}
                            className="px-6 py-3 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : !isCorrectVM ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <p className="text-yellow-500 mb-2">Wrong Wallet Type</p>
                        <p className="text-sm text-zinc-400 mb-6">
                            You're connected to {wallet.networkName}
                            <br />
                            This token is on {token.networkName}
                        </p>
                        <p className="text-xs text-zinc-600">
                            Please connect a {token.chainType === 'SOLANA' ? 'Solana' : 'EVM'} wallet
                        </p>
                    </div>
                ) : !isCorrectNetwork ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <p className="text-blue-500 mb-2">Wrong Network</p>
                        <p className="text-sm text-zinc-400 mb-6">
                            You're on {wallet.networkName}
                            <br />
                            This token is on {token.networkName}
                        </p>
                        <button
                            onClick={handleSwitchNetwork}
                            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Switch to {token.networkName}
                        </button>
                    </div>
                ) : success ? (
                    <div className="text-center py-12">
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Swap Successful!</h3>
                        {txHash && (
                            <a
                                href={wallet.vm === 'SOLANA'
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
                        <div className="mb-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm text-zinc-400">You Pay</label>
                                <div className="text-xs text-zinc-500">
                                    Balance: {wallet.nativeBalanceFormatted} {nativeSymbol}
                                </div>
                            </div>
                            <div className={`bg-[#111116] rounded-lg p-4 border ${insufficientBalance ? 'border-red-500/50' : 'border-transparent'}`}>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Prevent negative and ensure valid number
                                        if (val === '' || (parseFloat(val) >= 0 && !isNaN(parseFloat(val)))) {
                                            setAmount(val);
                                        }
                                    }}
                                    placeholder="0.0"
                                    min="0"
                                    step="any"
                                    className="w-full bg-transparent text-2xl font-semibold outline-none"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-sm text-zinc-500">{nativeSymbol}</div>
                                    <button
                                        onClick={() => setAmount(wallet.nativeBalanceFormatted)}
                                        className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>
                            {insufficientBalance && (
                                <p className="text-xs text-red-500 mt-1">Insufficient {nativeSymbol} balance</p>
                            )}
                        </div>

                        <div className="flex justify-center -my-1 relative z-10">
                            <div className="p-2 bg-[#0a0a0f] border border-white/10 rounded-lg">
                                <ArrowDown size={16} className="text-zinc-400" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm text-zinc-400 block mb-2">You Receive (Estimated)</label>
                            <div className="bg-[#111116] rounded-lg p-4">
                                <div className="text-2xl font-semibold">
                                    {loading ? '...' : quote ? (Number(quote.buyAmount) / 1e9).toFixed(6) : '0.0'}
                                </div>
                                <div className="text-sm text-zinc-500 mt-2">{token.symbol}</div>
                            </div>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-4">
                            <div className="text-xs text-blue-300 space-y-1">
                                <div>• Non-custodial</div>
                                <div>• Best on-chain route</div>
                                <div>• Wallet stays in your control</div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={executeSwap}
                            disabled={!quote || loading || !amount || parseFloat(amount) <= 0 || insufficientBalance || !hasBalance}
                            className="w-full py-4 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' :
                             !hasBalance ? `No ${nativeSymbol} Balance` :
                             insufficientBalance ? 'Insufficient Balance' :
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
        </div>
    );
}
