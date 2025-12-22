'use client';

import { useState, useEffect } from 'react';
import styles from './Tiles.module.css';

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
                    // Transform data to our format
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
                console.error('Error fetching trades:', error);
                // Use mock data for demo
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
        const interval = setInterval(fetchTrades, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const moreCount = Math.max(0, trades.length - 3);

    return (
        <div className={`${styles.tile} ${styles.tileHero}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>📊</span>
                    <span className={styles.tileName}>Active Trades</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <span>Loading trades...</span>
                    </div>
                ) : trades.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📈</span>
                        <span>No active trades</span>
                    </div>
                ) : (
                    <>
                        <div className={styles.tradeCards}>
                            {trades.slice(0, 3).map((trade, idx) => (
                                <div key={idx} className={styles.tradeCard}>
                                    <div className={styles.tradeSymbol}>{trade.symbol}</div>
                                    <div className={styles.tradeDirection}>{trade.direction}</div>
                                    <div className={`${styles.tradePnL} ${trade.pnl >= 0 ? styles.statPositive : styles.statNegative}`}>
                                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(0)}
                                    </div>
                                    <div className={`${styles.tradePercent} ${trade.pnl >= 0 ? styles.statPositive : styles.statNegative}`}>
                                        {trade.pnlPercent >= 0 ? '🟢' : '🔴'} {Math.abs(trade.pnlPercent).toFixed(1)}%
                                    </div>
                                </div>
                            ))}
                            {moreCount > 0 && (
                                <div className={styles.moreIndicator}>+{moreCount}</div>
                            )}
                        </div>

                        <div className={styles.summaryRow}>
                            <span>
                                Total P&L: <span className={`${styles.summaryValue} ${totalPnL >= 0 ? styles.statPositive : styles.statNegative}`}>
                                    {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toFixed(0)}
                                </span>
                            </span>
                            <span>•</span>
                            <span>
                                <span className={styles.summaryValue}>{trades.length}</span> Open Trades
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
