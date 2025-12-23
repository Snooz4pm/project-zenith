'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, Settings, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ConnectWalletButton } from '../wallet/ConnectWalletButton';
import TokenSelector from './TokenSelector';
import { getSwapQuote, buildSwapTransaction, getSupportedTokens, parseTokenAmount, formatTokenAmount } from '@/lib/1inch';
import { getJupiterTokens, SOLANA_TOKENS } from '@/lib/jupiter';
import { getChainInfo } from '@/lib/web3-config';

interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

interface SwapWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    defaultFromToken?: Partial<Token>;
    defaultToToken?: Partial<Token>;
}

export function SwapWidget({ isOpen, onClose, defaultFromToken, defaultToToken }: SwapWidgetProps) {
    // EVM wallet
    const { address: evmAddress, isConnected: evmConnected, chain } = useAccount();

    // Solana wallet
    const { connection } = useConnection();
    const { publicKey: solanaPublicKey, connected: solanaConnected } = useWallet();

    // Determine which wallet is connected
    const isConnected = evmConnected || solanaConnected;
    const address = evmConnected ? evmAddress : solanaPublicKey?.toString();

    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [slippage, setSlippage] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'pending' | 'success' | 'error'>('idle');
    const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(false);
    const [solanaBalance, setSolanaBalance] = useState<number | null>(null);

    const chainId = chain?.id || 1;
    const chainInfo = getChainInfo(chainId);
    const isSolana = solanaConnected || chain?.name?.toLowerCase().includes('solana');

    const [fromToken, setFromToken] = useState<Token>({
        address: defaultFromToken?.address || (isSolana ? SOLANA_TOKENS.SOL : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'),
        symbol: defaultFromToken?.symbol || (isSolana ? 'SOL' : 'ETH'),
        name: defaultFromToken?.name || (isSolana ? 'Solana' : 'Ethereum'),
        decimals: defaultFromToken?.decimals || (isSolana ? 9 : 18),
        logoURI: defaultFromToken?.logoURI,
    });

    const [toToken, setToToken] = useState<Token>({
        address: defaultToToken?.address || (isSolana ? SOLANA_TOKENS.USDC : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        symbol: defaultToToken?.symbol || 'USDC',
        name: defaultToToken?.name || 'USD Coin',
        decimals: defaultToToken?.decimals || 6,
        logoURI: defaultToToken?.logoURI,
    });

    // EVM balance
    const { data: evmBalance } = useBalance({
        address: evmAddress,
        token: fromToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? undefined : fromToken.address as `0x${string}`,
    });

    // Fetch Solana balance
    useEffect(() => {
        const fetchSolanaBalance = async () => {
            if (solanaConnected && solanaPublicKey && connection) {
                try {
                    if (fromToken.address === SOLANA_TOKENS.SOL) {
                        // Get SOL balance
                        const balance = await connection.getBalance(solanaPublicKey);
                        setSolanaBalance(balance / 1e9); // Convert lamports to SOL
                    } else {
                        // Get SPL token balance
                        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                            solanaPublicKey,
                            { mint: new PublicKey(fromToken.address) }
                        );

                        if (tokenAccounts.value.length > 0) {
                            const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                            setSolanaBalance(balance);
                        } else {
                            setSolanaBalance(0);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching Solana balance:', err);
                    setSolanaBalance(0);
                }
            }
        };

        if (isSolana) {
            fetchSolanaBalance();
        }
    }, [solanaConnected, solanaPublicKey, fromToken, connection, isSolana]);

    // Get the appropriate balance
    const balance = isSolana ? solanaBalance : (evmBalance ? parseFloat(evmBalance.formatted) : null);

    useEffect(() => {
        const fetchTokens = async () => {
            setLoadingTokens(true);
            try {
                if (isSolana) {
                    const tokens = await getJupiterTokens();
                    setAvailableTokens(tokens.slice(0, 500));
                } else {
                    const tokens = await getSupportedTokens(chainId);
                    const tokenList = Object.entries(tokens || {}).map(([address, data]: [string, any]) => ({
                        address,
                        symbol: data.symbol,
                        name: data.name,
                        decimals: data.decimals,
                        logoURI: data.logoURI,
                    }));
                    setAvailableTokens(tokenList.slice(0, 500));
                }
            } catch (err) {
                console.error('Failed to fetch tokens:', err);
                setAvailableTokens([fromToken, toToken]);
            } finally {
                setLoadingTokens(false);
            }
        };

        if (isConnected) {
            fetchTokens();
        }
    }, [chainId, isConnected, isSolana]);

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
                    setError('Failed to get quote');
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

            if (!tx) throw new Error('Failed to build transaction');

            setTxStatus('pending');
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
            const maxAmount = formatTokenAmount(balance.toString(), fromToken.decimals);
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-[#1a1d2e] rounded-3xl shadow-2xl z-50 overflow-hidden border border-gray-800/50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
                            <h2 className="text-xl font-bold text-white">Swap</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                                >
                                    <Settings size={20} className="text-gray-400" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Settings */}
                        {showSettings && (
                            <div className="p-6 border-b border-gray-800/50 bg-[#14161f]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-400">Slippage Tolerance</span>
                                    <span className="text-sm font-mono text-white">{slippage}%</span>
                                </div>
                                <div className="flex gap-2">
                                    {[0.5, 1, 2, 3].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setSlippage(val)}
                                            className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${slippage === val
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                                                }`}
                                        >
                                            {val}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6">
                            {!isConnected ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 mb-4">Connect wallet to swap tokens</p>
                                    <ConnectWalletButton />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {/* Status */}
                                    {loadingTokens && (
                                        <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl text-xs text-blue-400 mb-4">
                                            <Loader size={14} className="animate-spin" />
                                            Loading tokens...
                                        </div>
                                    )}

                                    {/* From */}
                                    <div className="bg-[#252838] rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-400">From</span>
                                            {balance && (
                                                <button
                                                    onClick={handleMaxBalance}
                                                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                                >
                                                    Balance: {parseFloat(formatTokenAmount(balance.toString(), fromToken.decimals)).toFixed(4)}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <TokenSelector
                                                selectedToken={fromToken}
                                                onSelectToken={setFromToken}
                                                tokenList={availableTokens}
                                                label="From"
                                            />
                                            <input
                                                type="number"
                                                value={fromAmount}
                                                onChange={(e) => setFromAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="flex-1 bg-transparent text-right text-3xl font-semibold text-white outline-none placeholder-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Swap Arrow */}
                                    <div className="flex justify-center -my-3 relative z-10">
                                        <button
                                            onClick={swapTokens}
                                            className="p-2.5 bg-[#1a1d2e] hover:bg-gray-800/50 border-4 border-[#1a1d2e] rounded-xl transition-all hover:rotate-180 duration-300"
                                        >
                                            <ArrowDown size={20} className="text-blue-400" />
                                        </button>
                                    </div>

                                    {/* To */}
                                    <div className="bg-[#252838] rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-400">To</span>
                                            {loading && <Loader size={14} className="text-blue-400 animate-spin" />}
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <TokenSelector
                                                selectedToken={toToken}
                                                onSelectToken={setToToken}
                                                tokenList={availableTokens}
                                                label="To"
                                            />
                                            <input
                                                type="text"
                                                value={toAmount}
                                                readOnly
                                                placeholder="0.00"
                                                className="flex-1 bg-transparent text-right text-3xl font-semibold text-white outline-none placeholder-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl text-sm text-red-400 mt-4">
                                            <AlertCircle size={16} />
                                            {error}
                                        </div>
                                    )}

                                    {/* Swap Button */}
                                    <button
                                        onClick={handleSwap}
                                        disabled={!quote || loading || txStatus === 'pending'}
                                        className={`w-full py-4 rounded-xl font-bold text-white transition-all mt-4 ${!quote || loading || txStatus === 'pending'
                                            ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
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
                                                Success!
                                            </span>
                                        ) : (
                                            'Swap'
                                        )}
                                    </button>

                                    {/* Footer Info */}
                                    <p className="text-center text-xs text-gray-500 mt-4">
                                        Powered by 1inch & Jupiter
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}


