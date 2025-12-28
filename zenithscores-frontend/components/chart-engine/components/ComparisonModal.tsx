'use client';

import { useState } from 'react';
import { X, Plus, Trash2, TrendingUp, Search } from 'lucide-react';

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSymbol?: (symbol: string) => void;
    currentSymbol: string;
    comparisonSymbols: string[];
}

export default function ComparisonModal({
    isOpen,
    onClose,
    onAddSymbol,
    currentSymbol,
    comparisonSymbols = []
}: ComparisonModalProps) {
    const [symbolInput, setSymbolInput] = useState('');
    const [localSymbols, setLocalSymbols] = useState<string[]>(comparisonSymbols);

    if (!isOpen) return null;

    const handleAddSymbol = () => {
        const symbol = symbolInput.trim().toUpperCase();
        if (symbol && !localSymbols.includes(symbol) && symbol !== currentSymbol) {
            const updated = [...localSymbols, symbol];
            setLocalSymbols(updated);
            if (onAddSymbol) onAddSymbol(symbol);
            setSymbolInput('');
        }
    };

    const handleRemoveSymbol = (symbol: string) => {
        setLocalSymbols(localSymbols.filter(s => s !== symbol));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddSymbol();
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-400" />
                            Compare Symbols
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Current Symbol */}
                        <div>
                            <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                                Current Chart
                            </label>
                            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <TrendingUp size={16} className="text-blue-400" />
                                <span className="text-white font-semibold">{currentSymbol}</span>
                            </div>
                        </div>

                        {/* Add Symbol */}
                        <div>
                            <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                                Add Symbol to Compare
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input
                                        type="text"
                                        value={symbolInput}
                                        onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter symbol (e.g., AAPL)"
                                        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <button
                                    onClick={handleAddSymbol}
                                    disabled={!symbolInput.trim()}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg font-medium transition flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Comparison Symbols List */}
                        {localSymbols.length > 0 && (
                            <div>
                                <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                                    Comparing With ({localSymbols.length})
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {localSymbols.map((symbol, index) => (
                                        <div
                                            key={symbol}
                                            className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor: `hsl(${(index * 360) / localSymbols.length}, 70%, 60%)`
                                                    }}
                                                />
                                                <span className="text-white font-medium">{symbol}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveSymbol(symbol)}
                                                className="p-1 text-red-400 hover:bg-red-500/20 rounded transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {localSymbols.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-white/40 text-sm">No comparison symbols added yet</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-t border-white/10 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white/5 text-white/80 hover:bg-white/10 rounded-lg transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
