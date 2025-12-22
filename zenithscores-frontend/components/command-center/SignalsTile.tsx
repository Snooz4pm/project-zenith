'use client';

import { useState, useEffect } from 'react';
import styles from './Tiles.module.css';

interface SignalsTileProps {
    onClick: () => void;
}

export default function SignalsTile({ onClick }: SignalsTileProps) {
    const [signalCount, setSignalCount] = useState(3);
    const [hotSignal, setHotSignal] = useState(1);

    useEffect(() => {
        // Fetch actual signal counts from API
        const fetchSignals = async () => {
            try {
                const response = await fetch('/api/signals');
                if (response.ok) {
                    const data = await response.json();
                    setSignalCount(data.activeCount || 3);
                    setHotSignal(data.highConfidenceCount || 1);
                }
            } catch (error) {
                // Use defaults
            }
        };
        fetchSignals();
    }, []);

    return (
        <div className={`${styles.tile} ${styles.tileMedium}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>🚨</span>
                    <span className={styles.tileName}>Signals</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                <div className={styles.statValue}>{signalCount} Active</div>
                <div className={styles.statsRow}>
                    <span className={styles.statItem}>
                        <span>🔥</span>
                        <span>{hotSignal} Hot</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
