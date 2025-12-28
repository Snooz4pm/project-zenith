/**
 * AlertCreationModal Component
 * 
 * Modal for setting price alerts with user-typed price input.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface AlertCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AlertData) => void;
    symbol: string;
    assetType: 'stock' | 'crypto' | 'forex';
    currentPrice: number;
}

interface AlertData {
    targetPrice: number;
    direction: 'above' | 'below';
    note: string;
    predictedDirection?: 'up' | 'down';
    predictedWithin?: number;
}

export default function AlertCreationModal({
    isOpen,
    onClose,
    onSubmit,
    symbol,
    assetType,
    currentPrice
}: AlertCreationModalProps) {
    const [priceInput, setPriceInput] = useState('');
    const [direction, setDirection] = useState<'above' | 'below'>('above');
    const [note, setNote] = useState('');
    const [predictUp, setPredictUp] = useState<boolean | null>(null);
    const [timeframe, setTimeframe] = useState<number | null>(null);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setPriceInput('');
            setDirection('above');
            setNote('');
            setPredictUp(null);
            setTimeframe(null);
        }
    }, [isOpen]);

    const targetPrice = parseFloat(priceInput) || 0;
    const isValidPrice = targetPrice > 0;
    const percentDiff = isValidPrice
        ? ((targetPrice - currentPrice) / currentPrice * 100).toFixed(2)
        : '0.00';

    const handleSubmit = () => {
        if (!isValidPrice) return;

        onSubmit({
            targetPrice,
            direction,
            note: note || `Watching ${symbol} at $${targetPrice.toFixed(2)}`,
            predictedDirection: predictUp === true ? 'up' : predictUp === false ? 'down' : undefined,
            predictedWithin: timeframe || undefined
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Bell className="text-blue-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Set Price Alert</h2>
                                <p className="text-sm text-zinc-400">{symbol} • {assetType}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Current Price */}
                    <div className="bg-zinc-800/50 rounded-xl p-3 mb-4 flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Current Price</span>
                        <span className="text-lg font-bold text-white">${currentPrice.toFixed(2)}</span>
                    </div>

                    {/* Direction Selector */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 mb-2 block">Alert me when price goes</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDirection('above')}
                                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${direction === 'above'
                                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                            >
                                <TrendingUp size={18} />
                                Above
                            </button>
                            <button
                                onClick={() => setDirection('below')}
                                className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${direction === 'below'
                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                            >
                                <TrendingDown size={18} />
                                Below
                            </button>
                        </div>
                    </div>

                    {/* Price Input */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 mb-2 block">Target Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                            <input
                                type="number"
                                value={priceInput}
                                onChange={e => setPriceInput(e.target.value)}
                                placeholder="Enter price..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-8 pr-4 text-white text-lg font-medium focus:border-blue-500 outline-none"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        {isValidPrice && (
                            <p className={`text-xs mt-1 ${parseFloat(percentDiff) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {parseFloat(percentDiff) >= 0 ? '+' : ''}{percentDiff}% from current price
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 mb-2 block">Your thesis (optional)</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Why are you watching this level?"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-none focus:border-blue-500 outline-none"
                            rows={2}
                        />
                    </div>

                    {/* Prediction (Gamification) */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 mb-2 block flex items-center gap-1">
                            <Zap size={12} className="text-amber-400" />
                            Make a prediction (earn points)
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPredictUp(true)}
                                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition ${predictUp === true
                                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                            >
                                <TrendingUp size={14} />
                                Going Up
                            </button>
                            <button
                                onClick={() => setPredictUp(false)}
                                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition ${predictUp === false
                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                            >
                                <TrendingDown size={14} />
                                Going Down
                            </button>
                        </div>
                    </div>

                    {/* Timeframe */}
                    {predictUp !== null && (
                        <div className="mb-4">
                            <label className="text-xs text-zinc-500 mb-2 block">When do you expect this?</label>
                            <div className="flex gap-2">
                                {[1, 4, 24, 72].map(hours => (
                                    <button
                                        key={hours}
                                        onClick={() => setTimeframe(hours)}
                                        className={`flex-1 py-2 rounded-lg text-xs transition ${timeframe === hours
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {hours}h
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!isValidPrice}
                        className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${isValidPrice
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                            }`}
                    >
                        <Bell size={16} />
                        Create Alert
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
