'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, TrendingUp, TrendingDown, Heart,
    MessageCircle, Share2, Plus, X, Send, User, Users,
    Trash2, MoreHorizontal, UserPlus, UserMinus, Award,
    ChevronDown, Filter
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { isPremiumUser } from '@/lib/premium';

interface Comment {
    id: string;
    username: string;
    content: string;
    timestamp: Date;
}

interface SharedTrade {
    symbol: string;
    direction: 'long' | 'short';
    entryPrice: number;
    currentPrice?: number;
    pnl?: number;
    pnlPercent?: number;
    isOpen: boolean;
}

interface CommunityPost {
    id: string;
    userId: string;
    username: string;
    avatar?: string;
    type: 'trade' | 'prediction' | 'insight' | 'screenshot';
    content: string;
    imageUrl?: string;
    sharedTrade?: SharedTrade;
    likes: number;
    comments: number;
    timestamp: Date;
    liked?: boolean;
    replies?: Comment[];
    isFollowing?: boolean;
    isOwnPost?: boolean;
}

interface UserFollowStats {
    followers: number;
    following: number;
    isFollowing: boolean;
}

// Demo posts with enhanced data
// Initial state with no posts
const DEMO_POSTS: CommunityPost[] = [];

type FeedFilter = 'all' | 'following' | 'trades' | 'insights';

export default function CommunityFeedEnhanced() {
    const { data: session } = useSession();

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostType, setNewPostType] = useState<CommunityPost['type']>('insight');
    const [expandedComments, setExpandedComments] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [filter, setFilter] = useState<FeedFilter>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const isPremium = isPremiumUser();

    // Filter posts
    const filteredPosts = posts.filter(post => {
        if (filter === 'all') return true;
        if (filter === 'following') return post.isFollowing;
        if (filter === 'trades') return post.type === 'trade';
        if (filter === 'insights') return post.type === 'insight' || post.type === 'prediction';
        return true;
    });

    // Handle follow/unfollow
    const handleFollow = async (userId: string) => {
        setPosts(prev => prev.map(post =>
            post.userId === userId
                ? { ...post, isFollowing: !post.isFollowing }
                : post
        ));

        // TODO: API call to follow/unfollow
        // await fetch('/api/community/follow', { method: 'POST', body: JSON.stringify({ userId }) });
    };

    // Handle like
    const handleLike = async (postId: string) => {
        // Optimistic update
        setPosts(prev => prev.map(post =>
            post.id === postId
                ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
                : post
        ));

        try {
            await fetch('/api/community/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId }),
            });
        } catch (error) {
            console.error('Like failed:', error);
            // Revert on failure
            setPosts(prev => prev.map(post =>
                post.id === postId
                    ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
                    : post
            ));
        }
    };

    // Handle delete post
    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        setPosts(prev => prev.filter(post => post.id !== postId));
        setMenuOpen(null);

        // TODO: API call to delete
        // await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
    };

    // Handle comment
    const handleComment = async (postId: string) => {
        if (!commentText.trim()) return;

        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                const newComment: Comment = {
                    id: Date.now().toString(),
                    username: session?.user?.name || 'Anonymous',
                    content: commentText,
                    timestamp: new Date()
                };
                return {
                    ...post,
                    comments: post.comments + 1,
                    replies: [...(post.replies || []), newComment]
                };
            }
            return post;
        }));

        setCommentText('');
    };

    // Handle new post
    const handlePost = async () => {
        if (!newPostContent.trim()) return;

        const newPostData = {
            type: newPostType,
            content: newPostContent,
        };

        try {
            const res = await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPostData),
            });

            if (res.ok) {
                const createdPost = await res.json();
                // Add to list immediately
                setPosts(prev => [{
                    ...createdPost,
                    timestamp: new Date(createdPost.created_at || createdPost.timestamp),
                    isOwnPost: true,
                    liked: false
                }, ...prev]);

                setNewPostContent('');
                setShowNewPost(false);
            }
        } catch (error) {
            console.error('Failed to post:', error);
        }
    };

    // Load posts
    const [error, setError] = useState<string | null>(null);

    const loadPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/community/posts');
            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                // Convert timestamp strings to Date objects
                setPosts(data.map(p => ({ ...p, timestamp: new Date(p.timestamp) })));
            }
        } catch (err) {
            console.error('Error loading posts:', err);
            setError('Unable to load community posts. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
        // Poll for updates every 30s
        const interval = setInterval(loadPosts, 30000);
        return () => clearInterval(interval);
    }, []);

    // Format time
    const formatTime = (date: Date) => {
        if (!date) return '';
        const diff = Date.now() - new Date(date).getTime();
        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return `${Math.floor(diff / 86400000)}d`;
    };

    return (
        <div className="relative">
            {/* Header with Filters */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Community
                </h2>

                <div className="flex items-center gap-2">
                    {/* Filter dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 
                                     rounded-lg text-sm text-gray-300 hover:bg-gray-700"
                        >
                            <Filter className="w-4 h-4" />
                            {filter === 'all' ? 'All Posts' :
                                filter === 'following' ? 'Following' :
                                    filter === 'trades' ? 'Trades' : 'Insights'}
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 
                                             rounded-lg shadow-xl z-20 overflow-hidden"
                                >
                                    {(['all', 'following', 'trades', 'insights'] as FeedFilter[]).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => { setFilter(f); setShowFilters(false); }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 
                                                      ${filter === f ? 'bg-purple-600/20 text-purple-400' : 'text-gray-300'}`}
                                        >
                                            {f === 'all' ? 'All Posts' :
                                                f === 'following' ? 'Following' :
                                                    f === 'trades' ? 'Trades Only' : 'Insights Only'}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* New Post button */}
                    <button
                        onClick={() => setShowNewPost(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 
                                 rounded-lg text-sm font-medium text-white hover:opacity-90"
                    >
                        <Plus className="w-4 h-4" />
                        Post
                    </button>
                </div>
            </div>

            {/* New Post Modal */}
            <AnimatePresence>
                {showNewPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowNewPost(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">New Post</h3>
                                <button onClick={() => setShowNewPost(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Post Type Selection */}
                            <div className="flex gap-2 mb-4">
                                {(['insight', 'trade', 'prediction'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setNewPostType(type)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                                            ${newPostType === type
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        {type === 'insight' ? '💡 Insight' :
                                            type === 'trade' ? '📈 Trade' : '🔮 Prediction'}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share your trading insight or analysis..."
                                className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 
                                         text-white placeholder-gray-500 resize-none focus:outline-none 
                                         focus:border-purple-500"
                            />

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={handlePost}
                                    disabled={!newPostContent.trim()}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                                             rounded-lg font-medium text-white hover:opacity-90 
                                             disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Post
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error State */}
            {error && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-xl text-center">
                    <p className="text-red-400 mb-2">{error}</p>
                    <button
                        onClick={loadPosts}
                        className="px-4 py-2 bg-red-600/30 text-red-300 rounded-lg hover:bg-red-600/50 transition-colors text-sm"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p>Loading community...</p>
                    </div>
                ) : filteredPosts.length === 0 && !error ? (
                    <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No posts found.</p>
                        {filter === 'following' && (
                            <p className="text-sm mt-1">Start following traders to see their posts here!</p>
                        )}
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                        >
                            {/* Post Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 
                                                  flex items-center justify-center text-white font-bold">
                                        {post.avatar ? (
                                            <img src={post.avatar} alt={post.username} className="w-full h-full rounded-full" />
                                        ) : (
                                            post.username[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white">{post.username}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full 
                                                ${post.type === 'trade' ? 'bg-blue-600/20 text-blue-400' :
                                                    post.type === 'prediction' ? 'bg-purple-600/20 text-purple-400' :
                                                        'bg-gray-700 text-gray-400'}`}>
                                                {post.type}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">{formatTime(post.timestamp)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Follow button (not for own posts) */}
                                    {!post.isOwnPost && (
                                        <button
                                            onClick={() => handleFollow(post.userId)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all
                                                ${post.isFollowing
                                                    ? 'bg-gray-700 text-gray-300 hover:bg-red-600/20 hover:text-red-400'
                                                    : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'}`}
                                        >
                                            {post.isFollowing ? (
                                                <>
                                                    <UserMinus className="w-3 h-3" />
                                                    Following
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-3 h-3" />
                                                    Follow
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* More menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                                            className="p-1 text-gray-500 hover:text-white rounded"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        <AnimatePresence>
                                            {menuOpen === post.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute right-0 mt-1 w-36 bg-gray-800 border border-gray-700 
                                                             rounded-lg shadow-xl z-20 overflow-hidden"
                                                >
                                                    <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                                                        <Share2 className="w-4 h-4" /> Share
                                                    </button>
                                                    {post.isOwnPost && (
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-600/20 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Post Content */}
                            <p className="text-gray-300 mb-4">{post.content}</p>

                            {/* Shared Trade Card */}
                            {post.sharedTrade && (
                                <div className={`p-3 rounded-lg mb-4 border ${post.sharedTrade.direction === 'long'
                                    ? 'bg-emerald-950/30 border-emerald-800'
                                    : 'bg-red-950/30 border-red-800'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {post.sharedTrade.direction === 'long' ? (
                                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <TrendingDown className="w-5 h-5 text-red-400" />
                                            )}
                                            <span className="font-bold text-white">{post.sharedTrade.symbol}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${post.sharedTrade.direction === 'long'
                                                ? 'bg-emerald-600/30 text-emerald-400'
                                                : 'bg-red-600/30 text-red-400'
                                                }`}>
                                                {post.sharedTrade.direction.toUpperCase()}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${post.sharedTrade.isOpen
                                                ? 'bg-blue-600/30 text-blue-400'
                                                : 'bg-gray-700 text-gray-400'
                                                }`}>
                                                {post.sharedTrade.isOpen ? 'OPEN' : 'CLOSED'}
                                            </span>
                                        </div>

                                        {post.sharedTrade.pnlPercent !== undefined && (
                                            <span className={`text-lg font-bold ${post.sharedTrade.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                {post.sharedTrade.pnlPercent >= 0 ? '+' : ''}{post.sharedTrade.pnlPercent.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-400">
                                        Entry: ${post.sharedTrade.entryPrice.toLocaleString()}
                                        {post.sharedTrade.currentPrice && (
                                            <span className="ml-3">
                                                Current: ${post.sharedTrade.currentPrice.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Post Actions */}
                            <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className={`flex items-center gap-2 text-sm transition-colors ${post.liked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'
                                        }`}
                                >
                                    <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                                    {post.likes}
                                </button>
                                <button
                                    onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-400"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    {post.comments}
                                </button>
                                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-400">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Comments Section */}
                            <AnimatePresence>
                                {expandedComments === post.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 pt-4 border-t border-gray-800"
                                    >
                                        {/* Existing comments */}
                                        {post.replies?.map(reply => (
                                            <div key={reply.id} className="flex gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                                                    {reply.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-white text-sm">{reply.username}</span>
                                                    <p className="text-gray-400 text-sm">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add comment */}
                                        <div className="flex gap-2 mt-3">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={e => setCommentText(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                                                         text-sm text-white placeholder-gray-500 focus:outline-none 
                                                         focus:border-purple-500"
                                                onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                                            />
                                            <button
                                                onClick={() => handleComment(post.id)}
                                                className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700"
                                            >
                                                <Send className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
