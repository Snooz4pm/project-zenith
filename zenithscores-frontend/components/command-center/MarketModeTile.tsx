'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './Tiles.module.css';
import type { RegimeType } from '@/lib/types/market';

interface MarketModeTileProps {
    onClick: () => void;
}

// Regime display config
const regimeConfig: Record<RegimeType, {
    icon: string;
    color: string;
    label: string;
    sentiment: string;
}> = {
    trend: { icon: '⚡', color: '#22c55e', label: 'Risk-On', sentiment: 'BULLISH' },
    breakout: { icon: '🚀', color: '#3b82f6', label: 'Breakout', sentiment: 'VOLATILE' },
    range: { icon: '🎯', color: '#f59e0b', label: 'Ranging', sentiment: 'NEUTRAL' },
    breakdown: { icon: '⚠️', color: '#ef4444', label: 'Risk-Off', sentiment: 'BEARISH' },
    chaos: { icon: '❓', color: '#6b7280', label: 'Uncertain', sentiment: 'MIXED' },
};

export default function MarketModeTile({ onClick }: MarketModeTileProps) {
    const [marketData, setMarketData] = useState<{
        regime: RegimeType;
        explanation: string;
        stats: { enteredPicks: number; improved: number; invalidated: number };
    } | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const { getCommandCenterData } = await import('@/lib/api/zenith-adapter');
                const data = await getCommandCenterData('crypto');
                setMarketData({
                    regime: data.marketRegimeSummary.regime,
                    explanation: data.marketRegimeSummary.explanation,
                    stats: data.stats,
                });
            } catch (error) {
                console.error('Failed to load market data:', error);
            }
        }
        loadData();
    }, []);

    const config = marketData ? regimeConfig[marketData.regime] : regimeConfig.chaos;

    return (
        <div className={`${styles.tile} ${styles.tileLarge}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>🔥</span>
                    <span className={styles.tileName}>Market Right Now</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                <motion.div
                    className={styles.marketModeDisplay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className={styles.modeIcon}>{config.icon}</div>
                    <div className={styles.modeName} style={{ color: config.color }}>
                        {config.label.toUpperCase()}
                    </div>
                </motion.div>

                {/* Live Stats */}
                {marketData && (
                    <div className={styles.modeInsights}>
                        <span className={styles.insightTag} style={{ background: '#3b82f620', color: '#3b82f6' }}>
                            {marketData.stats.enteredPicks} picks
                        </span>
                        <span className={styles.insightTag} style={{ background: '#22c55e20', color: '#22c55e' }}>
                            {marketData.stats.improved} improved
                        </span>
                        {marketData.stats.invalidated > 0 && (
                            <span className={styles.insightTag} style={{ background: '#ef444420', color: '#ef4444' }}>
                                {marketData.stats.invalidated} invalidated
                            </span>
                        )}
                    </div>
                )}

                <div className={styles.sentimentLabel}>
                    Sentiment: <span className={styles.sentimentValue} style={{ color: config.color }}>
                        {config.sentiment}
                    </span>
                </div>
            </div>
        </div>
    );
}
