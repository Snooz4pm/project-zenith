'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SlideOutPanel.module.css';

type PanelType = 'trades' | 'market' | 'signals' | 'performance' | 'community' | 'learning' | 'news' | 'notes' | null;

interface SlideOutPanelProps {
    isOpen: boolean;
    onClose: () => void;
    panelType: PanelType;
}

export default function SlideOutPanel({ isOpen, onClose, panelType }: SlideOutPanelProps) {
    const router = useRouter();
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        // Close on escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when panel is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const saveNote = () => {
        if (noteText.trim()) {
            localStorage.setItem('zenith_last_note', noteText);
            localStorage.setItem('zenith_last_note_time', 'Just now');
            setNoteText('');
            onClose();
        }
    };

    const getPanelContent = () => {
        switch (panelType) {
            case 'trades':
                return (
                    <>
                        <h2 className={styles.panelTitle}>📊 Active Trades</h2>
                        <p className={styles.panelSubtitle}>Manage your open positions</p>
                        <div className={styles.panelActions}>
                            <button className={styles.primaryBtn} onClick={() => router.push('/trading')}>
                                Open Trading Dashboard
                            </button>
                        </div>
                    </>
                );

            case 'market':
                return (
                    <>
                        <h2 className={styles.panelTitle}>🔥 Market Analysis</h2>
                        <p className={styles.panelSubtitle}>Current market mode: Risk-On</p>
                        <div className={styles.marketDetails}>
                            <div className={styles.detailRow}>
                                <span>BTC Trend</span>
                                <span className={styles.positive}>↑ Bullish</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Tech Sector</span>
                                <span className={styles.positive}>📈 Strong</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>USD Index</span>
                                <span>Stable</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>VIX</span>
                                <span className={styles.positive}>Low (14.2)</span>
                            </div>
                        </div>
                    </>
                );

            case 'signals':
                return (
                    <>
                        <h2 className={styles.panelTitle}>🚨 Trading Signals</h2>
                        <p className={styles.panelSubtitle}>3 active signals</p>
                        <div className={styles.panelActions}>
                            <button className={styles.primaryBtn} onClick={() => router.push('/signals')}>
                                View All Signals
                            </button>
                        </div>
                    </>
                );

            case 'performance':
                return (
                    <>
                        <h2 className={styles.panelTitle}>📈 Performance</h2>
                        <p className={styles.panelSubtitle}>Your trading statistics</p>
                        <div className={styles.marketDetails}>
                            <div className={styles.detailRow}>
                                <span>Today's P&L</span>
                                <span className={styles.positive}>+$1,247</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Win Rate</span>
                                <span>72%</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Current Streak</span>
                                <span>🔥 5 wins</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Total Trades</span>
                                <span>142</span>
                            </div>
                        </div>
                        <div className={styles.panelActions}>
                            <button className={styles.primaryBtn} onClick={() => router.push('/trading?tab=analytics')}>
                                View Analytics
                            </button>
                        </div>
                    </>
                );

            case 'community':
                return (
                    <>
                        <h2 className={styles.panelTitle}>👥 Community</h2>
                        <p className={styles.panelSubtitle}>3 new notifications</p>
                        <div className={styles.notificationsList}>
                            <div className={styles.notification}>
                                <span className={styles.notifIcon}>💬</span>
                                <span>@trader_joe mentioned you: "Nice analysis!"</span>
                            </div>
                            <div className={styles.notification}>
                                <span className={styles.notifIcon}>❤️</span>
                                <span>2 people liked your trade share</span>
                            </div>
                            <div className={styles.notification}>
                                <span className={styles.notifIcon}>👤</span>
                                <span>New follower: @crypto_whale</span>
                            </div>
                        </div>
                        <div className={styles.panelActions}>
                            <button className={styles.primaryBtn} onClick={() => router.push('/trading?tab=community')}>
                                Open Community Feed
                            </button>
                        </div>
                    </>
                );

            case 'learning':
                return (
                    <>
                        <h2 className={styles.panelTitle}>📚 Learning Progress</h2>
                        <p className={styles.panelSubtitle}>Continue your education</p>
                        <div className={styles.courseCard}>
                            <h3>Risk Management Fundamentals</h3>
                            <div className={styles.progressBarLarge}>
                                <div className={styles.progressFill} style={{ width: '40%' }} />
                            </div>
                            <p>40% complete • 3 lessons remaining</p>
                        </div>
                        <div className={styles.panelActions}>
                            <button className={styles.primaryBtn} onClick={() => router.push('/learning')}>
                                Continue Learning
                            </button>
                        </div>
                    </>
                );

            case 'news':
                return (
                    <>
                        <h2 className={styles.panelTitle}>📰 Latest News</h2>
                        <p className={styles.panelSubtitle}>Market-moving headlines</p>
                        <div className={styles.newsList}>
                            <div className={styles.newsItem}>
                                <span className={styles.newsBadge}>MACRO</span>
                                <p>Fed signals potential rate pause amid inflation concerns</p>
                            </div>
                            <div className={styles.newsItem}>
                                <span className={styles.newsBadge}>CRYPTO</span>
                                <p>BTC ETF sees $500M inflow as institutional interest grows</p>
                            </div>
                            <div className={styles.newsItem}>
                                <span className={styles.newsBadge}>EARNINGS</span>
                                <p>NVDA beats estimates, guidance drives after-hours surge</p>
                            </div>
                        </div>
                        <div className={styles.panelActions}>
                            <button className={styles.primaryBtn} onClick={() => router.push('/news')}>
                                Read More News
                            </button>
                        </div>
                    </>
                );

            case 'notes':
                return (
                    <>
                        <h2 className={styles.panelTitle}>📝 Quick Notes</h2>
                        <p className={styles.panelSubtitle}>Capture your trading thoughts</p>
                        <textarea
                            className={styles.noteInput}
                            placeholder="Write a quick note..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            autoFocus
                        />
                        <div className={styles.panelActions}>
                            <button className={styles.secondaryBtn} onClick={onClose}>
                                Cancel
                            </button>
                            <button className={styles.primaryBtn} onClick={saveNote}>
                                Save Note
                            </button>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>
                <div className={styles.panelContent}>
                    {getPanelContent()}
                </div>
            </div>
        </>
    );
}
