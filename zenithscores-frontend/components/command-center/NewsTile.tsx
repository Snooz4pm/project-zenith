'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewsTileProps {
    onClick: () => void;
}

interface NewsItem {
    title: string;
    tag?: string;
    color?: string;
}

export default function NewsTile({ onClick }: NewsTileProps) {
    const [headlines, setHeadlines] = useState<NewsItem[]>([]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('/api/news?limit=2');
                if (response.ok) {
                    const data = await response.json();
                    setHeadlines((data.articles || []).slice(0, 2).map((a: any) => ({
                        title: a.title,
                        tag: 'MARKET', // Default tag if not provided
                        color: 'text-blue-400'
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch news:', error);
                // No mock data - show empty state
                setHeadlines([]);
            }
        };
        fetchNews();
    }, []);

    return (
        <motion.div
            className="md:col-span-1 lg:col-span-1 row-span-1 relative overflow-hidden rounded-2xl bg-[#0a0a12] border border-white/5 p-5 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-indigo-500/5 group cursor-pointer flex flex-col h-full"
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Newspaper className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-white">News</span>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-between">
                {headlines.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                        Loading news...
                    </div>
                ) : (
                    <div className="space-y-3">
                        {headlines.map((item, idx) => (
                            <div key={idx} className="group/item">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${item.color || 'text-zinc-400'}`}>
                                        {item.tag || 'NEWS'}
                                    </span>
                                    <span className="text-[10px] text-zinc-600">Now</span>
                                </div>
                                <p className="text-sm text-zinc-300 group-hover/item:text-white transition-colors leading-snug line-clamp-2">
                                    {item.title}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
