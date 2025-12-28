'use client';

import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D' | '1W' | '1M';

interface TimeframeSelectorProps {
    selected: Timeframe;
    onSelect: (tf: Timeframe) => void;
    compact?: boolean;
}

const TIMEFRAMES: { id: Timeframe; label: string; shortLabel: string }[] = [
    { id: '1m', label: '1 Minute', shortLabel: '1m' },
    { id: '5m', label: '5 Minutes', shortLabel: '5m' },
    { id: '15m', label: '15 Minutes', shortLabel: '15m' },
    { id: '30m', label: '30 Minutes', shortLabel: '30m' },
    { id: '1h', label: '1 Hour', shortLabel: '1h' },
    { id: '4h', label: '4 Hours', shortLabel: '4h' },
    { id: '1D', label: '1 Day', shortLabel: '1D' },
    { id: '1W', label: '1 Week', shortLabel: '1W' },
    { id: '1M', label: '1 Month', shortLabel: '1M' },
];

export default function TimeframeSelector({ selected, onSelect, compact = false }: TimeframeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-black/60 border border-white/10 rounded-lg hover:bg-white/5 transition"
                >
                    <Clock size={14} className="text-white/60" />
                    <span className="text-sm font-medium text-white">{selected}</span>
                    <ChevronDown size={14} className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute top-full mt-1 left-0 z-50 bg-black/95 border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[140px]">
                            {TIMEFRAMES.map((tf) => (
                                <button
                                    key={tf.id}
                                    onClick={() => {
                                        onSelect(tf.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition ${
                                        selected === tf.id
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span>{tf.shortLabel}</span>
                                    <span className="text-[10px] text-white/40">{tf.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-lg p-1">
            {TIMEFRAMES.map((tf) => (
                <button
                    key={tf.id}
                    onClick={() => onSelect(tf.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        selected === tf.id
                            ? 'bg-blue-500 text-white'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                    title={tf.label}
                >
                    {tf.shortLabel}
                </button>
            ))}
        </div>
    );
}
