'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ActiveTradesTile from '@/components/command-center/ActiveTradesTile';
import MarketModeTile from '@/components/command-center/MarketModeTile';
import SignalsTile from '@/components/command-center/SignalsTile';
import PerformanceTile from '@/components/command-center/PerformanceTile';
import CommunityTile from '@/components/command-center/CommunityTile';
import LearningTile from '@/components/command-center/LearningTile';
import NewsTile from '@/components/command-center/NewsTile';
import NotesTile from '@/components/command-center/NotesTile';
import SlideOutPanel from '@/components/command-center/SlideOutPanel';
import styles from './CommandCenter.module.css';

type PanelType = 'trades' | 'market' | 'signals' | 'performance' | 'community' | 'learning' | 'news' | 'notes' | null;

export default function CommandCenterPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const [currentTime, setCurrentTime] = useState<string>('');
    const [lastActive, setLastActive] = useState<string>('Just now');

    useEffect(() => {
        // Update time every minute
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    const userName = session?.user?.name?.split(' ')[0] || 'Trader';

    const handleTileClick = (panel: PanelType) => {
        setActivePanel(panel);
    };

    const closePanel = () => {
        setActivePanel(null);
    };

    // Quick action handlers
    const quickActions = [
        { icon: '📊', label: 'Trade', action: () => router.push('/trading') },
        { icon: '🎯', label: 'Signals', action: () => router.push('/signals') },
        { icon: '📝', label: 'Note', action: () => setActivePanel('notes') },
        { icon: '👥', label: 'Feed', action: () => router.push('/trading?tab=community') },
        { icon: '📚', label: 'Academy', action: () => router.push('/learning') },
        { icon: '📰', label: 'News', action: () => router.push('/news') },
        { icon: '⚙️', label: 'Settings', action: () => router.push('/profile') },
    ];

    if (status === 'loading') {
        return (
            <div className={styles.cockpit}>
                <div className={styles.loadingState}>
                    <div className={styles.loadingPulse} />
                    <span>Initializing Command Center...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.cockpit}>
            {/* Header Bar */}
            <header className={styles.headerBar}>
                <div className={styles.welcomeSection}>
                    <span className={styles.welcomeText}>Welcome back, </span>
                    <span className={styles.userName}>{userName}</span>
                </div>
                <div className={styles.statusSection}>
                    <div className={styles.marketStatus}>
                        <span className={styles.statusIcon}>⚡</span>
                        <span className={styles.statusLabel}>Risk-On</span>
                    </div>
                    <div className={styles.notificationBadge}>
                        <span className={styles.bellIcon}>🔔</span>
                        <span className={styles.notificationCount}>3</span>
                    </div>
                    <div className={styles.lastActive}>
                        <span className={styles.timeLabel}>Last: </span>
                        <span className={styles.timeValue}>{lastActive}</span>
                    </div>
                    <button className={styles.settingsBtn} onClick={() => router.push('/profile')}>
                        ⚙️
                    </button>
                </div>
            </header>

            {/* Bento Grid */}
            <main className={styles.bentoGrid}>
                {/* Row 1: Hero Zone */}
                <ActiveTradesTile onClick={() => handleTileClick('trades')} />
                <MarketModeTile onClick={() => handleTileClick('market')} />

                {/* Row 2: Core Metrics */}
                <SignalsTile onClick={() => handleTileClick('signals')} />
                <PerformanceTile onClick={() => handleTileClick('performance')} />
                <CommunityTile onClick={() => handleTileClick('community')} />
                <LearningTile onClick={() => handleTileClick('learning')} />

                {/* Row 3: Info Tiles */}
                <NewsTile onClick={() => handleTileClick('news')} />
                <NotesTile onClick={() => handleTileClick('notes')} />
            </main>

            {/* Quick Actions Bar */}
            <footer className={styles.quickActionsBar}>
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        className={styles.quickActionBtn}
                        onClick={action.action}
                    >
                        <span className={styles.actionIcon}>{action.icon}</span>
                        <span className={styles.actionLabel}>{action.label}</span>
                    </button>
                ))}
            </footer>

            {/* Slide-out Panel */}
            <SlideOutPanel
                isOpen={activePanel !== null}
                onClose={closePanel}
                panelType={activePanel}
            />
        </div>
    );
}
