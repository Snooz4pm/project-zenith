'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, X, ArrowRight, Wallet } from 'lucide-react';
import Link from 'next/link';

interface Asset {
    symbol: string;
    name: string;
    current_price: number;
    price_change_24h: number;
    asset_type: 'crypto' | 'stock' | 'forex';
    max_leverage?: number;
    image?: string;
}

interface QuickTradePromptProps {
    asset: Asset | null;
    isOpen: boolean;
    onClose: () => void;
    onTrade: (asset: Asset) => void;
}

export default function QuickTradePrompt({ asset, isOpen, onClose, onTrade }: QuickTradePromptProps) {
    if (!asset) return null;

    const isPositive = asset.price_change_24h >= 0;
    const assetTypeColors = {
        crypto: 'from-orange-500 to-yellow-500',
        stock: 'from-blue-500 to-cyan-500',
        forex: 'from-purple-500 to-pink-500'
    };

    const formatPrice = (price: number) => {
        if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        if (price >= 1) return `$${price.toFixed(2)}`;
        return `$${price.toFixed(6)}`;
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                    />

                    {/* Prompt */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[151] w-[90%] max-w-md"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl shadow-2xl">
                            {/* Gradient accent */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${assetTypeColors[asset.asset_type]}`} />

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>

                            <div className="p-5">
                                {/* Asset info */}
                                <div className="flex items-center gap-4 mb-4">
                                    {asset.image ? (
                                        <img src={asset.image} alt={asset.symbol} className="w-12 h-12 rounded-full" />
                                    ) : (
                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${assetTypeColors[asset.asset_type]} flex items-center justify-center text-white font-bold text-lg`}>
                                            {asset.symbol.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white text-lg">{asset.symbol}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 uppercase">
                                                {asset.asset_type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{asset.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold font-mono text-white">
                                            {formatPrice(asset.current_price)}
                                        </div>
                                        <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {isPositive ? '+' : ''}{asset.price_change_24h.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onTrade(asset)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25"
                                    >
                                        <Zap size={18} />
                                        Paper Trade
                                        <ArrowRight size={16} />
                                    </button>
                                    <Link
                                        href="/trading"
                                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                                    >
                                        <Wallet size={18} />
                                        Portfolio
                                    </Link>
                                </div>

                                {/* Quick stats */}
                                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                                    <span>Max Leverage: <span className="text-cyan-400 font-bold">{asset.max_leverage || 10}x</span></span>
                                    <span>•</span>
                                    <span>Paper Trading: <span className="text-emerald-400 font-bold">$10K Virtual</span></span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
