'use client';

import styles from './Tiles.module.css';

interface MarketModeTileProps {
    onClick: () => void;
}

export default function MarketModeTile({ onClick }: MarketModeTileProps) {
    // Mock market data - in production this would come from API
    const marketMode = 'Risk-On';
    const modeIcon = '⚡';
    const modeColor = '#00ff88';
    const insights = ['BTC ↑', 'Tech 📈', '$USD'];
    const sentiment = 'BULLISH';

    return (
        <div className={`${styles.tile} ${styles.tileLarge}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>🔥</span>
                    <span className={styles.tileName}>Market Mode</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                <div className={styles.marketModeDisplay}>
                    <div className={styles.modeIcon}>{modeIcon}</div>
                    <div className={styles.modeName} style={{ color: modeColor }}>
                        {marketMode.toUpperCase()}
                    </div>
                </div>

                <div className={styles.modeInsights}>
                    {insights.map((insight, idx) => (
                        <span key={idx} className={styles.insightTag}>{insight}</span>
                    ))}
                </div>

                <div className={styles.sentimentLabel}>
                    Sentiment: <span className={styles.sentimentValue}>{sentiment}</span>
                </div>
            </div>
        </div>
    );
}
