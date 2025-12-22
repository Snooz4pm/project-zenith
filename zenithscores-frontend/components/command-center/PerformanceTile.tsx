'use client';

import { useState, useEffect } from 'react';
import styles from './Tiles.module.css';

interface PerformanceTileProps {
    onClick: () => void;
}

export default function PerformanceTile({ onClick }: PerformanceTileProps) {
    const [todayPnL, setTodayPnL] = useState(1247);
    const [winRate, setWinRate] = useState(72);
    const [streak, setStreak] = useState(5);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const response = await fetch('/api/trading/performance');
                if (response.ok) {
                    const data = await response.json();
                    if (data.today_pnl !== undefined) setTodayPnL(data.today_pnl);
                    if (data.win_rate !== undefined) setWinRate(Math.round(data.win_rate * 100));
                    if (data.current_streak !== undefined) setStreak(data.current_streak);
                }
            } catch (error) {
                // Use defaults
            }
        };
        fetchPerformance();
    }, []);

    const isPositive = todayPnL >= 0;

    return (
        <div className={`${styles.tile} ${styles.tileMedium}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>📈</span>
                    <span className={styles.tileName}>P&L</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                <div className={`${styles.statValue} ${isPositive ? styles.statPositive : styles.statNegative}`}>
                    {isPositive ? '+' : '-'}${Math.abs(todayPnL).toLocaleString()}
                </div>
                <div className={styles.statsRow}>
                    <span className={styles.statItem}>
                        <span>{winRate}% Win</span>
                    </span>
                    <span className={styles.statItem}>
                        <span>•</span>
                    </span>
                    <span className={styles.statItem}>
                        <span>🔥{streak}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
