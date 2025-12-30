'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, Radio } from 'lucide-react';

interface SignalsTileProps {
    onClick: () => void;
}

export default function SignalsTile({ onClick }: SignalsTileProps) {
    const [signalCount, setSignalCount] = useState(0);
    const [hotSignal, setHotSignal] = useState(0);

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const response = await fetch('/api/signals');
                if (response.ok) {
                    const data = await response.json();
                    setSignalCount(data.activeCount || 0);
                    setHotSignal(data.highConfidenceCount || 0);
                }
            } catch (error) {
                // defaults
            }
        };
        fetchSignals();
    }, []);

    return (
        <div
            className="w-full h-full glass-panel rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] hover:border-[var(--accent-mint)]/30 transition-all cursor-pointer group flex flex-col justify-between"
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Radio size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-mint)] transition-colors" />
                    <span className="font-bold text-white text-sm">Signals</span>
                </div>
                <ArrowUpRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="mt-4">
                <div className="text-3xl font-bold text-white font-mono">{signalCount}</div>
                <div className="text-xs text-[var(--text-secondary)]">Active Signals</div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="text-xs font-bold text-[var(--accent-gold)]">{hotSignal} High Confidence</span>
            </div>
        </div>
    );
}
