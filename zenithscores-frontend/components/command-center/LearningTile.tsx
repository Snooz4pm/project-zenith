'use client';

import { useState, useEffect } from 'react';
import styles from './Tiles.module.css';

interface LearningTileProps {
    onClick: () => void;
}

export default function LearningTile({ onClick }: LearningTileProps) {
    const [courseName, setCourseName] = useState('Risk Management');
    const [progress, setProgress] = useState(40);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await fetch('/api/learning/progress');
                if (response.ok) {
                    const data = await response.json();
                    if (data.currentCourse) setCourseName(data.currentCourse);
                    if (data.progress !== undefined) setProgress(data.progress);
                }
            } catch (error) {
                // Use defaults
            }
        };
        fetchProgress();
    }, []);

    return (
        <div className={`${styles.tile} ${styles.tileMedium}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>📚</span>
                    <span className={styles.tileName}>Learn</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className={styles.statLabel} style={{ marginTop: '8px' }}>
                    {progress}% • {courseName}
                </div>
            </div>
        </div>
    );
}
