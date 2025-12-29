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
import NotebookTile from '@/components/command-center/NotebookTile';
import NotesTile from '@/components/command-center/NotesTile';
import SlideOutPanel from '@/components/command-center/SlideOutPanel';
import { IntelligenceDrawer } from '@/components/intelligence';
import { Bell, Settings, Zap, BarChart2, FileText, Users, BookOpen, Newspaper } from 'lucide-react';

type PanelType = 'trades' | 'market' | 'signals' | 'performance' | 'community' | 'learning' | 'news' | 'notes' | null;

export default function CommandCenterPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const [intelligenceOpen, setIntelligenceOpen] = useState(false);
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
        { icon: <Zap size={18} />, label: 'Trade', action: () => router.push('/trading') },
        { icon: <BarChart2 size={18} />, label: 'Signals', action: () => router.push('/signals') },
        { icon: <FileText size={18} />, label: 'Note', action: () => setActivePanel('notes') },
        { icon: <Users size={18} />, label: 'Feed', action: () => router.push('/trading?tab=community') },
        { icon: <BookOpen size={18} />, label: 'Academy', action: () => router.push('/learning') },
        { icon: <Newspaper size={18} />, label: 'News', action: () => router.push('/news') },
        { icon: <Settings size={18} />, label: 'Settings', action: () => router.push('/profile') },
    ];

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-mint)] border-t-transparent animate-spin" />
                    <span className="text-[var(--accent-mint)] font-mono text-sm animate-pulse">Initializing Command Center...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] flex flex-col md:h-screen md:overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(0,212,255,0.05),_transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_bottom_left,_rgba(20,241,149,0.05),_transparent_70%)]" />
            </div>

            {/* Header Bar */}
            <header className="h-16 px-6 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.4)] backdrop-blur-md flex items-center justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)]">Welcome back, </span>
                    <span className="text-white font-bold" style={{ fontFamily: "var(--font-display)" }}>{userName}</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]">
                        <span className="text-xs">⚡</span>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Risk-On</span>
                    </div>
                    <div className="relative cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIntelligenceOpen(true)}>
                        <Bell size={20} className="text-[var(--text-muted)] hover:text-white" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-danger)] text-[8px] flex items-center justify-center text-white font-bold">3</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono">
                        <span className="text-[var(--text-secondary)]">Last: </span>
                        <span className="text-[var(--accent-mint)]">{lastActive}</span>
                    </div>
                    <button className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors" onClick={() => router.push('/profile')}>
                        <Settings size={20} className="text-[var(--text-muted)] hover:text-white" />
                    </button>
                </div>
            </header>

            {/* Bento Grid layout */}
            <main className="flex-1 p-4 md:p-6 relative z-10 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-7xl mx-auto h-auto md:h-[calc(100vh-8rem)] pb-20 md:pb-0">
                    {/* Row 1: Hero Zone (Top Left & Center) */}
                    <div className="md:col-span-2 md:row-span-2">
                        <ActiveTradesTile onClick={() => handleTileClick('trades')} />
                    </div>
                    <div className="md:col-span-2 md:row-span-1">
                        <MarketModeTile onClick={() => handleTileClick('market')} />
                    </div>

                    {/* Row 2: Core Metrics */}
                    <div className="md:col-span-1 md:row-span-1">
                        <SignalsTile onClick={() => handleTileClick('signals')} />
                    </div>
                    <div className="md:col-span-1 md:row-span-1">
                        <PerformanceTile onClick={() => handleTileClick('performance')} />
                    </div>

                    {/* Row 3: Community & Learning */}
                    <div className="md:col-span-1 md:row-span-1">
                        <CommunityTile onClick={() => handleTileClick('community')} />
                    </div>
                    <div className="md:col-span-1 md:row-span-1">
                        <LearningTile onClick={() => handleTileClick('learning')} />
                    </div>
                    <div className="md:col-span-1 md:row-span-1">
                        <NotebookTile onClick={() => router.push('/notebook')} />
                    </div>
                    <div className="md:col-span-1 md:row-span-1">
                        <NewsTile onClick={() => handleTileClick('news')} />
                    </div>
                </div>
            </main>

            {/* Quick Actions Bar */}
            <footer className="fixed bottom-0 left-0 right-0 md:static h-16 px-6 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.8)] md:bg-[rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center shrink-0 relative z-50">
                <div className="flex gap-4">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[var(--accent-mint)]/30 transition-all group"
                            onClick={action.action}
                        >
                            <span className="text-[var(--text-muted)] group-hover:text-[var(--accent-mint)] transition-colors">{action.icon}</span>
                            <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">{action.label}</span>
                        </button>
                    ))}
                </div>
            </footer>

            {/* Slide-out Panel */}
            <SlideOutPanel
                isOpen={activePanel !== null}
                onClose={closePanel}
                panelType={activePanel}
            />

            {/* Intelligence Drawer */}
            <IntelligenceDrawer
                isOpen={intelligenceOpen}
                onClose={() => setIntelligenceOpen(false)}
            />
        </div>
    );
}
