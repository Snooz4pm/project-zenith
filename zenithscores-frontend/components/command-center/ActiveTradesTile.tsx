'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

interface ActiveTradesTileProps {
    onClick: () => void;
}

interface Trade {
    symbol: string;
    direction: 'long' | 'short';
    pnl: number;
    pnlPercent: number;
}

export default function ActiveTradesTile({ onClick }: ActiveTradesTileProps) {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [totalPnL, setTotalPnL] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const response = await fetch('/api/trading/positions');
                if (response.ok) {
                    const data = await response.json();
                    const activeTrades = (data.positions || []).slice(0, 3).map((p: any) => ({
                        symbol: p.symbol,
                        direction: p.quantity > 0 ? 'long' : 'short',
                        pnl: p.unrealized_pnl || 0,
                        pnlPercent: p.unrealized_pnl_percent || 0,
                    }));
                    setTrades(activeTrades);
                    setTotalPnL(data.positions?.reduce((sum: number, p: any) => sum + (p.unrealized_pnl || 0), 0) || 0);
                }
            } catch (error) {
                // Mock data
                setTrades([
                    { symbol: 'AAPL', direction: 'long', pnl: 127, pnlPercent: 2.1 },
                    { symbol: 'BTC', direction: 'long', pnl: -45, pnlPercent: -0.8 },
                    { symbol: 'TSLA', direction: 'short', pnl: 89, pnlPercent: 1.5 },
                ]);
                setTotalPnL(171);
            } finally {
                setLoading(false);
            }
        };

        fetchTrades();
        const interval = setInterval(fetchTrades, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCloseTrade = async (symbol: string) => {
        try {
            const response = await fetch('/api/trading/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
            });
            if (response.ok) {
                // Remove trade from UI immediately
                setTrades(prev => prev.filter(t => t.symbol !== symbol));
            }
        } catch (e) {
            console.error('Failed to close trade:', e);
        }
    };

    const moreCount = Math.max(0, trades.length - 3);

    return (
        <div
            className="w-full h-full glass-panel rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] hover:border-[var(--accent-mint)]/30 transition-all cursor-pointer group flex flex-col"
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <span className="font-bold text-white group-hover:text-[var(--accent-mint)] transition-colors">Active Trades</span>
                </div>
                <button className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] group-hover:text-white transition-colors">
                    <ArrowUpRight size={16} />
                </button>
            </div>

            <div className="flex-1 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm animate-pulse">
                        Loading trades...
                    </div>
                ) : trades.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
                        <TrendingUp size={24} className="mb-2 opacity-50" />
                        <span className="text-sm">No active trades</span>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 flex-1">
                            {trades.slice(0, 3).map((trade, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] group/trade">
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-white">{trade.symbol}</div>
                                        <div className={`text-xs uppercase px-1.5 py-0.5 rounded font-bold ${trade.direction === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {trade.direction.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className={`font-mono text-sm font-bold ${trade.pnl >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(0)}
                                            </div>
                                            <div className={`text-xs flex items-center justify-end gap-1 ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnlPercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {Math.abs(trade.pnlPercent).toFixed(1)}%
                                            </div>
                                        </div>
                                        {/* Close Trade Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCloseTrade(trade.symbol);
                                            }}
                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover/trade:opacity-100 hover:bg-red-500/20 transition-all"
                                            title="Close Trade"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {moreCount > 0 && (
                                <div className="text-center text-xs text-[var(--text-muted)] mt-2">+{moreCount} more positions</div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between items-center text-sm">
                            <span className="text-[var(--text-secondary)]">Total P&L</span>
                            <span className={`font-mono font-bold ${totalPnL >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                                {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toFixed(0)}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
