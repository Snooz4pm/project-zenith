'use client';

import { useState, useEffect } from 'react';
import styles from './Tiles.module.css';

interface NewsTileProps {
    onClick: () => void;
}

interface NewsItem {
    title: string;
}

export default function NewsTile({ onClick }: NewsTileProps) {
    const [headlines, setHeadlines] = useState<NewsItem[]>([]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('/api/news?limit=2');
                if (response.ok) {
                    const data = await response.json();
                    setHeadlines((data.articles || []).slice(0, 2).map((a: any) => ({ title: a.title })));
                }
            } catch (error) {
                // Use mock data
                setHeadlines([
                    { title: 'Fed signals potential rate pause amid inflation concerns...' },
                    { title: 'BTC ETF sees $500M inflow as institutional interest grows' },
                ]);
            }
        };
        fetchNews();
    }, []);

    return (
        <div className={`${styles.tile} ${styles.tileWide}`} onClick={onClick}>
            <div className={styles.tileHeader}>
                <div className={styles.tileTitle}>
                    <span className={styles.tileIcon}>📰</span>
                    <span className={styles.tileName}>News</span>
                </div>
                <button className={styles.expandBtn} aria-label="Expand">↗</button>
            </div>

            <div className={styles.tileContent}>
                {headlines.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span>Loading news...</span>
                    </div>
                ) : (
                    <div className={styles.newsList}>
                        {headlines.map((item, idx) => (
                            <div key={idx} className={styles.newsItem}>
                                {item.title.length > 50 ? item.title.slice(0, 50) + '...' : item.title}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
