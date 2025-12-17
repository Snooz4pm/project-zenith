'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Image, TrendingUp, TrendingDown, Heart,
    MessageCircle, Share2, Lock, Plus, X, Send, User
} from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';

interface CommunityPost {
    id: string;
    userId: string;
    username: string;
    avatar?: string;
    type: 'trade' | 'prediction' | 'insight' | 'screenshot';
    content: string;
    imageUrl?: string;
    asset?: { symbol: string; direction: 'long' | 'short'; pnl?: number };
    likes: number;
    comments: number;
    timestamp: Date;
    liked?: boolean;
}

const DEMO_POSTS: CommunityPost[] = [
    {
        id: '1',
        userId: 'u1',
        username: 'CryptoKing99',
        type: 'trade',
        content: 'Just closed this BTC trade. Zenith Score was 85 at entry, held through the pullback. Trust the process! 🚀',
        asset: { symbol: 'BTC', direction: 'long', pnl: 4.2 },
        likes: 24,
        comments: 8,
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
        id: '2',
        userId: 'u2',
        username: 'TradingMaster',
        type: 'insight',
        content: 'Market pulse showing risk-on but volume is thin. Be careful with leveraged positions today. Coach just warned me about overtrading.',
        likes: 18,
        comments: 5,
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
    },
    {
        id: '3',
        userId: 'u3',
        username: 'DiamondHands',
        type: 'prediction',
        content: 'My 3-hour prediction: NVDA going UP 📈 Score is 92 and momentum building. Who else is bullish?',
        asset: { symbol: 'NVDA', direction: 'long' },
        likes: 31,
        comments: 12,
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
    },
];

const STORAGE_KEY = 'zenith_community_posts';

export default function CommunityFeed() {
    const [premium, setPremium] = useState(false);
    const [posts, setPosts] = useState<CommunityPost[]>(DEMO_POSTS);
    const [showComposer, setShowComposer] = useState(false);
    const [newPost, setNewPost] = useState('');
    const [postType, setPostType] = useState<CommunityPost['type']>('insight');

    useEffect(() => {
        setPremium(isPremiumUser());

        // Load custom posts from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const customPosts = JSON.parse(stored).map((p: any) => ({
                ...p,
                timestamp: new Date(p.timestamp),
            }));
            setPosts([...customPosts, ...DEMO_POSTS]);
        }
    }, []);

    const handleLike = (postId: string) => {
        setPosts(posts.map(p =>
            p.id === postId
                ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked }
                : p
        ));
    };

    const handlePost = () => {
        if (!newPost.trim()) return;

        const post: CommunityPost = {
            id: `post_${Date.now()}`,
            userId: 'me',
            username: 'You',
            type: postType,
            content: newPost,
            likes: 0,
            comments: 0,
            timestamp: new Date(),
        };

        const updated = [post, ...posts];
        setPosts(updated);

        // Save custom posts
        const customPosts = updated.filter(p => p.userId === 'me');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customPosts));

        setNewPost('');
        setShowComposer(false);
    };

    const formatTime = (date: Date) => {
        const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    if (!premium) {
        return (
            <div className="relative rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-sm text-white font-bold">Community Feed</p>
                    <p className="text-[10px] text-gray-400">Share trades & insights</p>
                </div>
                <div className="blur-sm opacity-40">
                    <div className="h-24 bg-white/5 rounded-xl mb-3" />
                    <div className="h-24 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-cyan-400" />
                    <h3 className="font-bold text-white">Community Feed</h3>
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Live</span>
                </div>
                <button
                    onClick={() => setShowComposer(!showComposer)}
                    className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                    {showComposer ? <X size={16} /> : <Plus size={16} />}
                </button>
            </div>

            {/* Composer */}
            <AnimatePresence>
                {showComposer && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-white/5"
                    >
                        <div className="p-4 space-y-3">
                            {/* Type Selector */}
                            <div className="flex gap-2">
                                {[
                                    { type: 'trade' as const, label: 'Trade', icon: TrendingUp },
                                    { type: 'prediction' as const, label: 'Prediction', icon: TrendingUp },
                                    { type: 'insight' as const, label: 'Insight', icon: MessageCircle },
                                    { type: 'screenshot' as const, label: 'Screenshot', icon: Image },
                                ].map(({ type, label, icon: Icon }) => (
                                    <button
                                        key={type}
                                        onClick={() => setPostType(type)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${postType === type
                                                ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                                                : 'bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        <Icon size={12} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Input */}
                            <textarea
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="Share your trade, insight, or prediction..."
                                className="w-full h-20 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-gray-500 resize-none focus:outline-none focus:border-cyan-500/50"
                            />

                            {/* Post Button */}
                            <button
                                onClick={handlePost}
                                disabled={!newPost.trim()}
                                className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Send size={14} />
                                Post to Community
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Posts */}
            <div className="max-h-96 overflow-y-auto">
                {posts.map((post) => (
                    <div key={post.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                        {/* Author */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                                <User size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{post.username}</p>
                                <p className="text-[10px] text-gray-500">{formatTime(post.timestamp)} • {post.type}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-gray-300 mb-2">{post.content}</p>

                        {/* Trade Badge */}
                        {post.asset && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg mb-2 ${post.asset.direction === 'long'
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-red-500/10 border border-red-500/30'
                                }`}>
                                {post.asset.direction === 'long' ? (
                                    <TrendingUp size={12} className="text-green-400" />
                                ) : (
                                    <TrendingDown size={12} className="text-red-400" />
                                )}
                                <span className="text-sm font-bold text-white">{post.asset.symbol}</span>
                                {post.asset.pnl !== undefined && (
                                    <span className={`text-xs font-mono ${post.asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {post.asset.pnl >= 0 ? '+' : ''}{post.asset.pnl}%
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 text-gray-500">
                            <button
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center gap-1 text-xs hover:text-red-400 transition-colors ${post.liked ? 'text-red-400' : ''}`}
                            >
                                <Heart size={14} fill={post.liked ? 'currentColor' : 'none'} />
                                {post.likes}
                            </button>
                            <button className="flex items-center gap-1 text-xs hover:text-cyan-400 transition-colors">
                                <MessageCircle size={14} />
                                {post.comments}
                            </button>
                            <button className="flex items-center gap-1 text-xs hover:text-purple-400 transition-colors">
                                <Share2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
