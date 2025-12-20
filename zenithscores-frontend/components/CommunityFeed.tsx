'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Image, TrendingUp, TrendingDown, Heart,
    MessageCircle, Share2, Lock, Plus, X, Send, User
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { isPremiumUser } from '@/lib/premium';

interface Comment {
    id: string;
    username: string;
    content: string;
    timestamp: Date;
}

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
    replies?: Comment[];
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
];

export default function CommunityFeed() {
    const { data: session } = useSession();
    const [premium, setPremium] = useState(false);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showComposer, setShowComposer] = useState(false);
    const [newPost, setNewPost] = useState('');
    const [postType, setPostType] = useState<CommunityPost['type']>('insight');

    const [activePostComments, setActivePostComments] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        setError(null);
        try {
            const baseUrl = 'https://project-zenith-zexd.vercel.app'; // Fallback for local dev
            const session_id = session?.user?.email || 'guest';
            const url = `${process.env.NEXT_PUBLIC_API_URL || baseUrl}/api/v1/community/posts?session_id=${session_id}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

            if (!res.ok) {
                throw new Error(`API returned ${res.status}`);
            }

            const data = await res.json();
            if (data.status === 'success' && data.data?.length > 0) {
                const formattedPosts = data.data.map((p: CommunityPost) => ({
                    ...p,
                    timestamp: new Date(p.timestamp),
                    replies: p.replies?.map((r: Comment) => ({ ...r, timestamp: new Date(r.timestamp) })) || []
                }));
                setPosts(formattedPosts);
            } else {
                // Use demo posts if no real data
                setPosts(DEMO_POSTS);
            }
        } catch (err) {
            console.error('Fetch posts failed:', err);
            setError('Unable to load live feed');
            // Fallback to demo posts
            setPosts(DEMO_POSTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPremium(isPremiumUser());
        fetchPosts();
    }, [session]);

    const handleLike = async (postId: string) => {
        if (!session) {
            signIn('google', { callbackUrl: '/trading' });
            return;
        }

        try {
            const baseUrl = 'https://project-zenith-zexd.vercel.app';
            const url = `${process.env.NEXT_PUBLIC_API_URL || baseUrl}/api/v1/community/posts/${postId}/like?user_id=${session.user?.email}`;
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();

            if (data.status === 'success') {
                setPosts(posts.map((p: CommunityPost) => p.id === postId ? { ...p, liked: data.liked, likes: data.likes } : p));
            }
        } catch (error) {
            console.error('Like failed:', error);
        }
    };

    const handleComment = async (postId: string) => {
        if (!session) {
            signIn('google', { callbackUrl: '/trading' });
            return;
        }
        if (!commentText.trim()) return;

        try {
            const baseUrl = 'https://project-zenith-zexd.vercel.app';
            const url = `${process.env.NEXT_PUBLIC_API_URL || baseUrl}/api/v1/community/posts/${postId}/comment`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: session.user?.email,
                    username: session.user?.name || 'Anonymous',
                    content: commentText
                })
            });
            const data = await res.json();

            if (data.status === 'success') {
                setPosts(posts.map((p: CommunityPost) => p.id === postId ? {
                    ...p,
                    replies: [...(p.replies || []), { ...data.comment, timestamp: new Date(data.comment.timestamp) }],
                    comments: p.comments + 1
                } : p));
                setCommentText('');
            }
        } catch (error) {
            console.error('Comment failed:', error);
        }
    };

    const handlePost = async () => {
        if (!session) {
            signIn('google', { callbackUrl: '/trading' });
            return;
        }
        if (!newPost.trim()) return;

        try {
            const baseUrl = 'https://project-zenith-zexd.vercel.app';
            const url = `${process.env.NEXT_PUBLIC_API_URL || baseUrl}/api/v1/community/posts`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: session.user?.email,
                    username: session.user?.name || 'Anonymous',
                    avatar: session.user?.image,
                    type: postType,
                    content: newPost,
                    asset: null // Handle asset if needed
                })
            });
            const data = await res.json();

            if (data.status === 'success') {
                fetchPosts();
                setNewPost('');
                setShowComposer(false);
            }
        } catch (error) {
            console.error('Post failed:', error);
        }
    };

    const formatTime = (date: Date) => {
        const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    if (loading) {
        return (
            <div className="h-48 rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Loading Community...</p>
                </div>
            </div>
        );
    }

    if (!premium) {
        return (
            <div className="relative rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-sm text-white font-bold">Community Feed</p>
                    <p className="text-[10px] text-gray-400 text-center px-4">Share trades & insights with Zenith Pro</p>
                    <button
                        onClick={() => window.location.href = '#premium'}
                        className="mt-3 px-4 py-1.5 bg-purple-500 rounded-lg text-xs font-bold text-white hover:bg-purple-600 transition-colors"
                    >
                        Upgrade to Unlock
                    </button>
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
                {session ? (
                    <button
                        onClick={() => setShowComposer(!showComposer)}
                        className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                    >
                        {showComposer ? <X size={16} /> : <Plus size={16} />}
                    </button>
                ) : (
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/trading' })}
                        className="text-[10px] text-cyan-400 hover:underline"
                    >
                        Sign in to post
                    </button>
                )}
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
                {posts.map((post: CommunityPost) => (
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
                            <button
                                onClick={() => setActivePostComments(activePostComments === post.id ? null : post.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${activePostComments === post.id ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
                            >
                                <MessageCircle size={14} />
                                {post.comments}
                            </button>
                            <button className="flex items-center gap-1 text-xs hover:text-purple-400 transition-colors">
                                <Share2 size={14} />
                            </button>
                        </div>

                        {/* Comments Section */}
                        <AnimatePresence>
                            {activePostComments === post.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 space-y-3 pt-4 border-t border-white/5"
                                >
                                    {post.replies?.map((reply: Comment) => (
                                        <div key={reply.id} className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                                <User size={10} className="text-gray-400" />
                                            </div>
                                            <div className="flex-1 bg-white/5 rounded-lg p-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-white">{reply.username}</span>
                                                    <span className="text-[8px] text-gray-500">{formatTime(reply.timestamp)}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-300">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                        />
                                        <button
                                            onClick={() => handleComment(post.id)}
                                            disabled={!commentText.trim()}
                                            className="p-1.5 rounded-lg bg-cyan-500 text-white disabled:opacity-50"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}
