'use client';

import { Terminal } from 'lucide-react';

interface MarketLogProps {
    logs: { time: string; type: string; message: string }[];
    loading: boolean;
}

const LOG_TYPE_COLORS: Record<string, string> = {
    VOLUME_SPIKE: 'text-cyan-400',
    REGIME_LOCK: 'text-yellow-400',
    BREAK_ATTEMPT: 'text-orange-400',
    BUY_PRESSURE: 'text-emerald-400',
    SELL_PRESSURE: 'text-red-400',
    LOW_LIQUIDITY: 'text-red-500',
    RANGE_MATURITY: 'text-purple-400',
    DEFAULT: 'text-zinc-400'
};

export default function MarketLog({ logs, loading }: MarketLogProps) {
    return (
        <div className="h-full flex flex-col bg-[#0a0a0d]">
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
                <Terminal size={12} className="text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Market Log</span>
                <span className="text-[10px] text-zinc-600">{logs.length} events</span>
            </div>

            {/* Log Entries */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed">
                {loading ? (
                    <div className="text-zinc-600 italic">Analyzing market...</div>
                ) : logs.length === 0 ? (
                    <div className="text-zinc-600 italic">No market events detected</div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 mb-1">
                            <span className="text-zinc-600 flex-shrink-0">[{log.time}]</span>
                            <span className={`flex-shrink-0 font-semibold ${LOG_TYPE_COLORS[log.type] || LOG_TYPE_COLORS.DEFAULT}`}>
                                {log.type}
                            </span>
                            <span className="text-zinc-500">—</span>
                            <span className="text-zinc-400">{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
