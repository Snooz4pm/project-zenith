'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

interface PerformanceTileProps {
    onClick: () => void;
}

export default function PerformanceTile({ onClick }: PerformanceTileProps) {
    const [todayPnL, setTodayPnL] = useState(1247);
    const [winRate, setWinRate] = useState(72);
    const [streak, setStreak] = useState(5);

    useEffect(() => {
        // Fetch logic...
        setTodayPnL(1247);
    }, []);

    const isPositive = todayPnL >= 0;

    return (
        <div
            className="w-full h-full glass-panel rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] hover:border-[var(--accent-mint)]/30 transition-all cursor-pointer group flex flex-col justify-between"
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-[var(--text-muted)] group-hover:text-emerald-400 transition-colors" />
                    <span className="font-bold text-white text-sm">P&L Status</span>
                </div>
                <ArrowUpRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="mt-4">
                <div className={`text-2xl font-bold font-mono ${isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                    {isPositive ? '+' : '-'}${Math.abs(todayPnL).toLocaleString()}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">Today's Realized</div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1 text-[var(--text-primary)]">
                    <span className="text-emerald-400">{winRate}%</span> Win
                </div>
                <div className="flex items-center gap-1 text-[var(--text-primary)]">
                    <span className="text-[var(--accent-gold)]">🔥 {streak}</span> Streak
                </div>
            </div>
        </div>
    );
}
