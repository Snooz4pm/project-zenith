'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: {
        symbol: string;
        name: string;
        current_price: number;
        price_change_24h: number;
        asset_type: string;
        max_leverage: number;
    } | null;
    availableBalance: number;
    onExecuteTrade: (trade: TradeOrder) => Promise<boolean>;
}

export interface TradeOrder {
    symbol: string;
    direction: 'buy' | 'sell';
    amount: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
}

export default function TradeModal({ isOpen, onClose, asset, availableBalance, onExecuteTrade }: TradeModalProps) {
    const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
    const [amount, setAmount] = useState('');
    const [leverage, setLeverage] = useState(1);
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setLeverage(1);
            setStopLoss('');
            setTakeProfit('');
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, asset]);

    if (!asset) return null;

    const amountNum = parseFloat(amount) || 0;
    const quantity = amountNum / asset.current_price;
    const leveragedValue = amountNum * leverage;

    const handleSubmit = async () => {
        setError(null);

        // Validation
        if (amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (amountNum > availableBalance) {
            setError(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`);
            return;
        }

        setExecuting(true);

        try {
            const success = await onExecuteTrade({
                symbol: asset.symbol,
                direction,
                amount: amountNum,
                leverage,
                stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
                takeProfit: takeProfit ? parseFloat(takeProfit) : undefined
            });

            if (success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError('Trade execution failed. Please try again.');
            }
        } catch (e: any) {
            setError(e.message || 'Trade execution failed');
        } finally {
            setExecuting(false);
        }
    };

    const quickAmounts = [100, 250, 500, 1000];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        {success ? (
                            <div className="text-center py-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                >
                                    <CheckCircle className="text-emerald-400" size={32} />
                                </motion.div>
                                <h3 className="text-xl font-bold mb-2">Trade Executed!</h3>
                                <p className="text-gray-400 text-sm">
                                    {direction === 'buy' ? 'Bought' : 'Sold'} {quantity.toFixed(4)} {asset.symbol}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${direction === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                            }`}>
                                            {direction === 'buy' ?
                                                <TrendingUp className="text-emerald-400" size={20} /> :
                                                <TrendingDown className="text-red-400" size={20} />
                                            }
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg">{asset.symbol}</h2>
                                            <p className="text-xs text-gray-500">{asset.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Current Price */}
                                <div className="bg-white/5 rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 uppercase">Current Price</span>
                                        <span className={`text-xs ${asset.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {asset.price_change_24h >= 0 ? '+' : ''}{asset.price_change_24h.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold font-mono">${asset.current_price.toLocaleString()}</div>
                                </div>

                                {/* Direction Toggle */}
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    <button
                                        onClick={() => setDirection('buy')}
                                        className={`py-3 rounded-xl font-bold transition-all ${direction === 'buy'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        BUY
                                    </button>
                                    <button
                                        onClick={() => setDirection('sell')}
                                        className={`py-3 rounded-xl font-bold transition-all ${direction === 'sell'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        SELL
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div className="mb-4">
                                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Amount (USD)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-lg focus:border-cyan-500/50 outline-none"
                                    />
                                    {/* Quick amounts */}
                                    <div className="flex gap-2 mt-2">
                                        {quickAmounts.map(qa => (
                                            <button
                                                key={qa}
                                                onClick={() => setAmount(String(qa))}
                                                className="flex-1 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                ${qa}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Leverage Selector */}
                                <div className="mb-6">
                                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                                        <span>Leverage</span>
                                        <span className="text-yellow-400">{leverage}x</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 5, 10].filter(l => l <= asset.max_leverage).map(l => (
                                            <button
                                                key={l}
                                                onClick={() => setLeverage(l)}
                                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${leverage === l
                                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {l}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Trade Summary */}
                                {amountNum > 0 && (
                                    <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Quantity</span>
                                            <span className="font-mono">{quantity.toFixed(4)} {asset.symbol}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Position Value</span>
                                            <span className="font-mono">${leveragedValue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Available</span>
                                            <span className="font-mono text-emerald-400">${availableBalance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-2 text-red-400 text-sm">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={executing || amountNum <= 0}
                                    className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${direction === 'buy'
                                            ? 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50'
                                            : 'bg-red-500 hover:bg-red-600 disabled:bg-red-500/50'
                                        } disabled:cursor-not-allowed`}
                                >
                                    {executing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Executing...
                                        </>
                                    ) : (
                                        <>
                                            {direction === 'buy' ? 'Buy' : 'Sell'} {asset.symbol}
                                        </>
                                    )}
                                </button>

                                {/* Paper Trading Notice */}
                                <p className="text-center text-xs text-gray-600 mt-4">
                                    ⚡ Paper trading only. No real money involved.
                                </p>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
