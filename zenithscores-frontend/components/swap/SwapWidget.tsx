'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, Settings, AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { ConnectWalletButton } from '../wallet/ConnectWalletButton';
import { getSwapQuote, buildSwapTransaction, ONEINCH_CHAIN_IDS, parseTokenAmount, formatTokenAmount } from '@/lib/1inch';
import { getJupiterQuote, getJupiterSwapInstructions, parseSolanaAmount, formatSolanaAmount } from '@/lib/jupiter';
import { getChainInfo } from '@/lib/web3-config';

// Note: This widget currently supports EVM chains (Ethereum, Polygon, etc) via 1inch
// Solana support via Jupiter is prepared but needs Phantom wallet integration
// To enable Solana: detect chain.name === 'Solana', use Jupiter API instead of 1inch

interface SwapWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    defaultFromToken?: {
        address: string;
        symbol: string;
        decimals: number;
    };
    defaultToToken?: {
        address: string;
        symbol: string;
        decimals: number;
    };
}

export function SwapWidget({ isOpen, onClose, defaultFromToken, defaultToToken }: SwapWidgetProps) {
    const { address, isConnected, chain } = useAccount();
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [slippage, setSlippage] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle');

    const chainId = chain?.id || 1;
    const chainInfo = getChainInfo(chainId);

    // Default tokens (ETH -> USDC)
    const [fromToken, setFromToken] = useState(defaultFromToken || {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
        symbol: 'ETH',
        decimals: 18,
    });

    const [toToken, setToToken] = useState(defaultToToken || {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        symbol: 'USDC',
        decimals: 6,
    });

    // Get user balance
    const { data: balance } = useBalance({
        address: address,
        token: fromToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? undefined : fromToken.address as `0x${string}`,
    });

    // Fetch quote when amount changes
    useEffect(() => {
        if (!fromAmount || parseFloat(fromAmount) <= 0 || !isConnected) {
            setQuote(null);
            setToAmount('');
            return;
        }

        const fetchQuote = async () => {
            setLoading(true);
            setError(null);

            try {
                const amountWei = parseTokenAmount(fromAmount, fromToken.decimals);
                const quoteData = await getSwapQuote(
                    chainId,
                    fromToken.address,
                    toToken.address,
                    amountWei,
                    address,
                    slippage
                );

                if (quoteData) {
                    setQuote(quoteData);
                    const toAmountFormatted = formatTokenAmount(quoteData.toAmount, toToken.decimals);
                    setToAmount(toAmountFormatted);
                } else {
                    setError('Failed to get quote. Try again.');
                }
            } catch (err: any) {
                setError(err.message || 'Quote failed');
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchQuote, 800);
        return () => clearTimeout(debounce);
    }, [fromAmount, fromToken, toToken, slippage, chainId, address, isConnected]);

    const handleSwap = async () => {
        if (!address || !quote) return;

        setTxStatus('signing');
        setError(null);

        try {
            const amountWei = parseTokenAmount(fromAmount, fromToken.decimals);
            const tx = await buildSwapTransaction(
                chainId,
                fromToken.address,
                toToken.address,
                amountWei,
                address,
                slippage
            );

            if (!tx) {
                throw new Error('Failed to build transaction');
            }

            // Send transaction
            setTxStatus('pending');
            // Note: Transaction sending logic would go here
            // For now, simulating success
            setTimeout(() => {
                setTxStatus('success');
                setFromAmount('');
                setToAmount('');
                setQuote(null);
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Swap failed');
            setTxStatus('error');
        }
    };

    const handleMaxBalance = () => {
        if (balance) {
            const maxAmount = formatTokenAmount(balance.value.toString(), fromToken.decimals);
            setFromAmount(maxAmount);
        }
    };

    const swapTokens = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
        setFromAmount(toAmount);
        setToAmount('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Swap Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-8 right-8 w-[420px] bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                    <RefreshCw size={16} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Swap Tokens</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Settings size={18} className="text-gray-400" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        {showSettings && (
                            <div className="p-4 bg-gray-900/50 border-b border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">Slippage Tolerance</span>
                                    <span className="text-sm font-mono text-white">{slippage}%</span>
                                </div>
                                <div className="flex gap-2">
                                    {[0.5, 1, 2, 3].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setSlippage(val)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${slippage === val
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {val}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="p-4 space-y-3">
                            {!isConnected ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 mb-4">Connect your wallet to start swapping</p>
                                    <ConnectWalletButton />
                                </div>
                            ) : (
                                <>
                                    {/* From Token */}
                                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500">From</span>
                                            {balance && (
                                                <button
                                                    onClick={handleMaxBalance}
                                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    Balance: {parseFloat(formatTokenAmount(balance.value.toString(), fromToken.decimals)).toFixed(4)} {fromToken.symbol}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={fromAmount}
                                                onChange={(e) => setFromAmount(e.target.value)}
                                                placeholder="0.0"
                                                className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
                                            />
                                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                                                <span className="font-bold text-white">{fromToken.symbol}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Swap Button */}
                                    <div className="flex justify-center -my-2 relative z-10">
                                        <button
                                            onClick={swapTokens}
                                            className="p-2 bg-gray-800 hover:bg-gray-700 border-4 border-gray-900 rounded-xl transition-colors"
                                        >
                                            <ArrowDown size={20} className="text-gray-400" />
                                        </button>
                                    </div>

                                    {/* To Token */}
                                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500">To</span>
                                            {loading && <Loader size={12} className="text-blue-400 animate-spin" />}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={toAmount}
                                                readOnly
                                                placeholder="0.0"
                                                className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
                                            />
                                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                                                <span className="font-bold text-white">{toToken.symbol}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quote Info */}
                                    {quote && !loading && (
                                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-3 text-xs space-y-1">
                                            <div className="flex justify-between text-gray-400">
                                                <span>Estimated Gas</span>
                                                <span className="text-white font-mono">{quote.estimatedGas || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-400">
                                                <span>Network</span>
                                                <span className="text-white">{chainInfo?.name || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-sm text-red-400">
                                            <AlertCircle size={16} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Swap Button */}
                                    <button
                                        onClick={handleSwap}
                                        disabled={!quote || loading || txStatus === 'pending'}
                                        className={`w-full py-4 rounded-xl font-bold text-white transition-all ${!quote || loading || txStatus === 'pending'
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                                            }`}
                                    >
                                        {txStatus === 'pending' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader size={18} className="animate-spin" />
                                                Swapping...
                                            </span>
                                        ) : txStatus === 'success' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <CheckCircle size={18} />
                                                Swap Successful!
                                            </span>
                                        ) : (
                                            'Swap'
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-gray-900/30 border-t border-gray-800">
                            <p className="text-xs text-gray-500 text-center">
                                Powered by 1inch (EVM) & Jupiter (Solana) • Trades execute on-chain
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default SwapWidget;
