'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
    X, ExternalLink, BookOpen, Eye, EyeOff,
    AlertCircle, TrendingUp, Info, Zap,
    RefreshCw, Clock
} from 'lucide-react';
import { getPersonalizedFeed, recordItemView } from '@/lib/intelligence/actions';
import Link from 'next/link';

interface IntelligenceItem {
    id: string;
    headline: string;
    summary: string | null;
    url: string;
    imageUrl: string | null;
    publishedAt: Date | string;
    assetTags: string[];
    category: string | null;
    sentiment: number | null;
    impactScore: number | null;
    relevanceScore: number;
    urgency: 'info' | 'watch' | 'opportunity' | 'conflict';
    whyMatters: string;
    conflictsWith?: string;
}

interface IntelligenceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const urgencyConfig = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    watch: { icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    opportunity: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    conflict: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
};

export default function IntelligenceDrawer({ isOpen, onClose }: IntelligenceDrawerProps) {
    const { data: session } = useSession();
    const [items, setItems] = useState<IntelligenceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

    const loadFeed = useCallback(async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);
        try {
            const feed = await getPersonalizedFeed(session.user.id, 8);
            setItems(feed as IntelligenceItem[]);
        } catch (error) {
            console.error('[Intelligence] Failed to load feed:', error);
        }
        setIsLoading(false);
    }, [session?.user?.id]);

    useEffect(() => {
        if (isOpen && session?.user?.id) {
            loadFeed();
        }
    }, [isOpen, session?.user?.id, loadFeed]);

    const handleItemClick = async (item: IntelligenceItem) => {
        if (session?.user?.id) {
            await recordItemView(session.user.id, item.id);
        }
        window.open(item.url, '_blank');
    };

    const handleIgnore = (itemId: string) => {
        setIgnoredIds(prev => new Set(prev).add(itemId));
    };

    const visibleItems = items.filter(item => !ignoredIds.has(item.id));

    // Keyboard shortcut
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'i' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    // Toggle drawer - this needs to be handled by parent
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-[420px] max-w-full bg-[#0a0a0c] border-l border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Zap size={18} className="text-emerald-400" />
                                        Intelligence Feed
                                    </h2>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Relevant to you · Happening now
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={loadFeed}
                                        disabled={isLoading}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <RefreshCw size={16} className={`text-zinc-500 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <X size={18} className="text-zinc-500" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Feed Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoading && visibleItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                    <RefreshCw className="animate-spin mb-3" size={24} />
                                    <span className="text-sm">Loading intelligence...</span>
                                </div>
                            ) : visibleItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                    <Info size={32} className="mb-3 opacity-50" />
                                    <p className="text-sm">No relevant news right now.</p>
                                    <p className="text-xs mt-1">Check back soon.</p>
                                </div>
                            ) : (
                                visibleItems.map((item) => {
                                    const config = urgencyConfig[item.urgency];
                                    const IconComponent = config.icon;
                                    const ageHours = Math.round((Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60));

                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            className={`p-4 rounded-xl border ${config.border} ${config.bg} group hover:border-white/20 transition-all`}
                                        >
                                            {/* Urgency Badge */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg} ${config.color} text-[10px] font-bold uppercase`}>
                                                    <IconComponent size={10} />
                                                    {item.urgency}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                                    <Clock size={10} />
                                                    {ageHours < 1 ? 'Just now' : `${ageHours}h ago`}
                                                </div>
                                            </div>

                                            {/* Headline */}
                                            <h3
                                                className="text-sm font-medium text-white mb-2 cursor-pointer hover:text-emerald-400 transition-colors line-clamp-2"
                                                onClick={() => handleItemClick(item)}
                                            >
                                                {item.headline}
                                            </h3>

                                            {/* Why It Matters */}
                                            <p className="text-xs text-zinc-400 mb-3">
                                                {item.whyMatters}
                                            </p>

                                            {/* Asset Tags */}
                                            {item.assetTags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {item.assetTags.slice(0, 3).map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-0.5 text-[10px] font-mono bg-white/5 rounded text-zinc-400"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                                <button
                                                    onClick={() => handleItemClick(item)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                >
                                                    <ExternalLink size={12} />
                                                    View
                                                </button>
                                                <Link
                                                    href={`/notebook?prefill=${encodeURIComponent(item.headline)}`}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                >
                                                    <BookOpen size={12} />
                                                    Journal
                                                </Link>
                                                <button
                                                    onClick={() => handleIgnore(item.id)}
                                                    className="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-white/5 rounded-lg transition-colors"
                                                    title="Ignore"
                                                >
                                                    <EyeOff size={12} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                            <p className="text-[10px] text-zinc-600 text-center">
                                Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-zinc-500">ESC</kbd> to close
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
