'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Settings, Eye, EyeOff } from 'lucide-react';

import { Indicator, DrawingTool, LayoutPreset, AlgorithmOverlay, RegimeType } from '../engine/types';

const AVAILABLE_INDICATORS: { type: Indicator['type']; label: string; defaultPeriod: number | undefined }[] = [
    { type: 'sma', label: 'SMA', defaultPeriod: 20 },
    { type: 'ema', label: 'EMA', defaultPeriod: 50 },
    { type: 'rsi', label: 'RSI', defaultPeriod: 14 },
    { type: 'macd', label: 'MACD', defaultPeriod: 12 },
    { type: 'bollinger', label: 'Bollinger Bands', defaultPeriod: 20 },
    { type: 'volume', label: 'Volume', defaultPeriod: undefined },
    { type: 'vwap', label: 'VWAP', defaultPeriod: undefined },
    { type: 'atr', label: 'ATR', defaultPeriod: 14 },
    { type: 'stochastic', label: 'Stochastic', defaultPeriod: 14 },
    { type: 'adx', label: 'ADX', defaultPeriod: 14 },
];

const INDICATOR_COLORS = [
    '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F59E0B',
    '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#F97316'
];

interface IndicatorPanelProps {
    indicators: Indicator[];
    onChange: (indicators: Indicator[]) => void;
    onToggle?: () => void;
}

export default function IndicatorPanel({ indicators, onChange, onToggle }: IndicatorPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showAddMenu, setShowAddMenu] = useState(false);

    const addIndicator = (type: Indicator['type']) => {
        const indicatorDef = AVAILABLE_INDICATORS.find(i => i.type === type);
        if (!indicatorDef) return;

        const usedColors = indicators.map(i => i.color);
        const availableColor = INDICATOR_COLORS.find(c => !usedColors.includes(c)) || INDICATOR_COLORS[0];

        onChange([
            ...indicators,
            {
                type,
                period: indicatorDef.defaultPeriod,
                color: availableColor,
                visible: true
            }
        ]);
        setShowAddMenu(false);
    };

    const removeIndicator = (index: number) => {
        onChange(indicators.filter((_, i) => i !== index));
    };

    const toggleIndicator = (index: number) => {
        onChange(indicators.map((ind, i) =>
            i === index ? { ...ind, visible: ind.visible !== false ? false : true } : ind
        ));
    };

    const updatePeriod = (index: number, period: number) => {
        onChange(indicators.map((ind, i) =>
            i === index ? { ...ind, period } : ind
        ));
    };

    return (
        <div className="bg-black/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-sm font-medium text-white">Indicators</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">{indicators.length}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-white/60" /> : <ChevronDown size={16} className="text-white/60" />}
                </div>
            </div>

            {isExpanded && (
                <div className="px-3 pb-3">
                    {/* Active Indicators */}
                    <div className="space-y-2 mb-3">
                        {indicators.map((indicator, index) => (
                            <div
                                key={`${indicator.type}-${index}`}
                                className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: indicator.color }}
                                    />
                                    <span className="text-sm text-white uppercase">{indicator.type}</span>
                                    {indicator.period && (
                                        <input
                                            type="number"
                                            value={indicator.period}
                                            onChange={(e) => updatePeriod(index, parseInt(e.target.value) || indicator.period!)}
                                            className="w-12 px-1 py-0.5 text-xs bg-black/50 border border-white/20 rounded text-white text-center"
                                        />
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleIndicator(index); }}
                                        className="p-1 hover:bg-white/10 rounded"
                                    >
                                        {indicator.visible !== false ? (
                                            <Eye size={14} className="text-white/60" />
                                        ) : (
                                            <EyeOff size={14} className="text-white/40" />
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeIndicator(index); }}
                                        className="p-1 hover:bg-red-500/20 rounded"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Indicator */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition"
                        >
                            <Plus size={16} />
                            Add Indicator
                        </button>

                        {showAddMenu && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-white/10 rounded-lg overflow-hidden z-50 max-h-48 overflow-y-auto">
                                {AVAILABLE_INDICATORS.map((ind) => (
                                    <button
                                        key={ind.type}
                                        onClick={() => addIndicator(ind.type)}
                                        disabled={indicators.some(i => i.type === ind.type)}
                                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {ind.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
