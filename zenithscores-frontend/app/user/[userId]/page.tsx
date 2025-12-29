'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User, Trophy, TrendingUp, TrendingDown, BookOpen, ArrowLeft,
    Users, Activity, BarChart3, MessageCircle, Calendar, ExternalLink,
    CheckCircle, Clock, Zap, Target, UserPlus, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface SuggestedUser {
    id: string;
    name: string;
    image: string | null;
    bio: string | null;
    careerPath: string | null;
    followersCount: number;
}

export default function PublicProfilePage() {
    const params = useParams();
    const { data: session } = useSession();
    const userId = params.userId as string;
    const isOwnProfile = session?.user?.id === userId;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);

    // Post creation state (for own profile)
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostType, setNewPostType] = useState<'insight' | 'thesis' | 'question'>('insight');
    const [postingLoading, setPostingLoading] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch(`/api/profile/${userId}`);
                const data = await res.json();

                if (res.ok) {
                    setProfile(data);
                } else {
                    setError(data.error || 'Failed to load profile');
                }
            } catch (err) {
                console.error('[PUBLIC PROFILE] Error:', err);
                setError('Network error');
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            fetchProfile();
            fetchSuggestedUsers();
        }
    }, [userId]);

    const fetchSuggestedUsers = async () => {
        try {
            const res = await fetch(`/api/users/suggested?limit=4&exclude=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestedUsers(data.users || []);
            }
        } catch (e) {
            console.error('Failed to fetch suggested users:', e);
        }
    };

    const handleCreatePost = async () => {
        if (!session?.user?.id || !newPostContent.trim()) return;
        setPostingLoading(true);

        try {
            const res = await fetch('/api/community', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newPostContent.substring(0, 100),
                    body: newPostContent,
                    postType: newPostType
                })
            });

            if (res.ok) {
                setNewPostContent('');
                // Refresh profile to get new post
                const profileRes = await fetch(`/api/profile/${userId}`);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile(data);
                }
            }
        } catch (e) {
            console.error('Failed to create post:', e);
        } finally {
            setPostingLoading(false);
        }
    };

    const handleTogglePin = async (postId: string) => {
        try {
            const res = await fetch('/api/community/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            });

            if (res.ok) {
                // Refresh profile to see updated pinning
                const profileRes = await fetch(`/api/profile/${userId}`);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile(data);
                }
            }
        } catch (e) {
            console.error('Failed to toggle pin:', e);
        }
    };

    const handleFollow = async () => {
        if (!session?.user?.id) return;
        setFollowLoading(true);

        try {
            const res = await fetch('/api/community/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId })
            });

            if (res.ok) {
                setIsFollowing(!isFollowing);
                setProfile((prev: any) => ({
                    ...prev,
                    social: {
                        ...prev.social,
                        followers: prev.social.followers + (isFollowing ? -1 : 1)
                    }
                }));
            }
        } catch (e) {
            console.error('Follow error:', e);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-500">
                    <Activity className="w-5 h-5 animate-pulse" />
                    Loading profile...
                </div>
            </div>
        );
    }

    if (!profile || error) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
                    <p className="text-zinc-500 mb-6">{error || 'This profile doesn\'t exist or is private.'}</p>
                    <Link href="/community">
                        <button className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all">
                            Back to Community
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/community">
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <h1 className="text-lg font-bold">Public Profile</h1>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Profile Header Card */}
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 border border-white/10">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            {/* Avatar */}
                            {profile.image ? (
                                <img
                                    src={profile.image}
                                    alt={profile.name || 'User'}
                                    className="w-28 h-28 rounded-full border-4 border-emerald-500/30 shadow-lg shadow-emerald-500/20"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-4xl font-bold shadow-lg shadow-emerald-500/20">
                                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-1">{profile.name || 'Anonymous Trader'}</h2>
                                        {profile.careerPath && (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-3">
                                                <Target size={14} />
                                                {profile.careerPath}
                                            </div>
                                        )}
                                        {profile.bio && (
                                            <p className="text-zinc-400 max-w-xl mb-4">{profile.bio}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                Joined {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Zap size={14} />
                                                {profile.experienceLevel || 'Beginner'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Follow Button */}
                                    {!isOwnProfile && session?.user?.id && (
                                        <button
                                            onClick={handleFollow}
                                            disabled={followLoading}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isFollowing
                                                ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                                                : 'bg-emerald-500 text-black hover:bg-emerald-400'
                                                }`}
                                        >
                                            {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                                            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                </div>

                                {/* Social Stats */}
                                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-white">{profile.social?.followers || 0}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Followers</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-white">{profile.social?.following || 0}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Following</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-white">{profile.badges?.length || 0}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Badges</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Trading Stats */}
                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                                <BarChart3 size={14} />
                                Total Trades
                            </div>
                            <div className="text-2xl font-bold text-white font-mono">{profile.trading?.totalTrades || 0}</div>
                        </div>

                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                                <Trophy size={14} />
                                Win Rate
                            </div>
                            <div className={`text-2xl font-bold font-mono ${(profile.trading?.winRate || 0) >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {profile.trading?.winRate || 0}%
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                                {(profile.trading?.totalPnL || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                Total P&L
                            </div>
                            <div className={`text-2xl font-bold font-mono ${(profile.trading?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(profile.trading?.totalPnL || 0) >= 0 ? '+' : ''}${Math.abs(profile.trading?.totalPnL || 0).toLocaleString()}
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                                <BookOpen size={14} />
                                Courses
                            </div>
                            <div className="text-2xl font-bold text-white font-mono">{profile.learning?.coursesCompleted || 0}</div>
                            {(profile.learning?.coursesInProgress || 0) > 0 && (
                                <div className="text-xs text-blue-400 mt-1">{profile.learning.coursesInProgress} in progress</div>
                            )}
                        </div>
                    </div>

                    {/* Create Post Section (Own Profile Only) */}
                    {isOwnProfile && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 border border-emerald-500/20">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <MessageCircle className="text-emerald-400" size={20} />
                                Share Your Thoughts
                            </h3>
                            <div className="space-y-4">
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="What's on your mind? Share a thesis, insight, or question..."
                                    rows={3}
                                    maxLength={2000}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-500 resize-none"
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {(['insight', 'thesis', 'question'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewPostType(type)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${newPostType === type
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-white/5 text-zinc-400 border border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                {type === 'insight' ? '💡' : type === 'thesis' ? '📊' : '❓'} {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleCreatePost}
                                        disabled={!newPostContent.trim() || postingLoading}
                                        className="px-5 py-2 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {postingLoading ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Badges Section */}
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy className="text-amber-400" size={20} />
                                Achievement Wall
                            </h3>
                            {profile.badges && profile.badges.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {profile.badges.map((badge: any, i: number) => (
                                        <motion.div
                                            key={badge.id || i}
                                            whileHover={{ scale: 1.05 }}
                                            className={`p-4 rounded-xl text-center border transition-all ${badge.isPinned
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : 'bg-white/[0.02] border-white/5 hover:border-amber-500/20'
                                                }`}
                                        >
                                            <div className="text-3xl mb-2">{badge.icon}</div>
                                            <div className="text-xs font-medium text-white truncate">{badge.name}</div>
                                            <div className={`text-[10px] uppercase tracking-wider mt-1 ${badge.rarity === 'legendary' ? 'text-amber-400' :
                                                badge.rarity === 'rare' ? 'text-purple-400' :
                                                    badge.rarity === 'uncommon' ? 'text-blue-400' : 'text-zinc-500'
                                                }`}>{badge.rarity}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-zinc-500 text-sm">
                                    No badges earned yet
                                </div>
                            )}
                        </div>

                        {/* Thoughts & Feed Section */}
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <MessageCircle className="text-blue-400" size={20} />
                                Pinned & Recent Thoughts
                            </h3>
                            <div className="space-y-4">
                                {/* Pinned Posts First */}
                                {profile.pinnedPosts && profile.pinnedPosts.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold ml-1">Pinned</div>
                                        {profile.pinnedPosts.map((post: any) => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                isOwnProfile={isOwnProfile}
                                                onTogglePin={() => handleTogglePin(post.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Recent Posts */}
                                {profile.recentPosts && profile.recentPosts.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.pinnedPosts && profile.pinnedPosts.length > 0 && (
                                            <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold ml-1 pt-2">Recent</div>
                                        )}
                                        {profile.recentPosts.map((post: any) => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                isOwnProfile={isOwnProfile}
                                                onTogglePin={() => handleTogglePin(post.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    !(profile.pinnedPosts && profile.pinnedPosts.length > 0) && (
                                        <div className="py-8 text-center text-zinc-500 text-sm">
                                            No thoughts shared yet
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Shared Trades */}
                    {profile.showTrades && profile.sharedTrades && profile.sharedTrades.length > 0 && (
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Activity className="text-emerald-400" size={20} />
                                Recent Trades
                            </h3>
                            <div className="space-y-3">
                                {profile.sharedTrades.map((trade: any) => (
                                    <div key={trade.id} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {trade.type}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{trade.symbol}</div>
                                                <div className="text-xs text-zinc-500">@ ${trade.entryPrice?.toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {trade.isOpen ? (
                                                <div className="flex items-center gap-2 text-blue-400 text-sm">
                                                    <Clock size={14} />
                                                    Open
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`font-bold font-mono ${(trade.pnlPercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {(trade.pnlPercent || 0) >= 0 ? '+' : ''}{trade.pnlPercent?.toFixed(2)}%
                                                    </div>
                                                    <div className="text-xs text-zinc-500">
                                                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toLocaleString()}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Learning Progress */}
                    {(profile.learning?.totalProgress || 0) > 0 && (
                        <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <BookOpen className="text-blue-400" size={20} />
                                Learning Journey
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-zinc-400">Overall Progress</span>
                                        <span className="text-sm font-bold text-white">{profile.learning.totalProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                            style={{ width: `${profile.learning.totalProgress}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <CheckCircle size={20} />
                                    <span className="font-bold">{profile.learning.coursesCompleted} Completed</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suggested Profiles Widget */}
                    {suggestedUsers.length > 0 && (
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users className="text-purple-400" size={20} />
                                People You May Know
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Link href={`/user/${user.id}`}>
                                                {user.image ? (
                                                    <img src={user.image} alt="" className="w-12 h-12 rounded-full" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                                                        {user.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/user/${user.id}`} className="font-medium hover:text-purple-400 transition-colors truncate block">
                                                    {user.name}
                                                </Link>
                                                {user.careerPath && (
                                                    <div className="text-xs text-purple-400 truncate">{user.careerPath}</div>
                                                )}
                                                <div className="text-xs text-zinc-500 mt-1">
                                                    {user.followersCount} followers
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Link
                                                href={`/user/${user.id}`}
                                                className="flex-1 py-2 px-3 text-xs font-medium text-center bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all border border-purple-500/20"
                                            >
                                                <UserPlus className="inline mr-1" size={12} />
                                                View Profile
                                            </Link>
                                            <Link
                                                href={`/inbox?user=${user.id}`}
                                                className="py-2 px-3 text-xs font-medium bg-white/5 text-zinc-400 rounded-lg hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                            >
                                                <MessageCircle size={12} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={fetchSuggestedUsers}
                                className="w-full mt-4 py-2 text-sm text-zinc-500 hover:text-purple-400 transition-colors"
                            >
                                ↻ Show different people
                            </button>
                        </div>
                    )}

                </motion.div>
            </div>
        </div>
    );
}
// Helper component for Post items
function PostCard({ post, isOwnProfile, onTogglePin }: { post: any, isOwnProfile: boolean, onTogglePin: () => void }) {
    const typeIcon = post.postType === 'thesis' ? '📊' : post.postType === 'insight' ? '💡' : '❓';

    return (
        <div className={`p-4 rounded-xl border transition-all ${post.isPinned ? 'bg-blue-500/5 border-blue-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeIcon}</span>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">{post.postType}</div>
                    </div>
                    <Link href={`/community/post/${post.id}`}>
                        <div className="text-sm font-bold text-white mb-2 hover:text-blue-400 cursor-pointer transition-colors line-clamp-2">
                            {post.title}
                        </div>
                    </Link>
                    <p className="text-xs text-zinc-400 line-clamp-3 mb-3 leading-relaxed">
                        {post.body}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                        <div className="flex items-center gap-1">
                            <MessageCircle size={10} />
                            {post.commentsCount} comments
                        </div>
                        {post.asset && (
                            <div className="text-emerald-400 font-bold uppercase">{post.asset}</div>
                        )}
                        <div>{new Date(post.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>

                {isOwnProfile && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onTogglePin();
                        }}
                        className={`p-2 rounded-lg transition-all ${post.isPinned ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
                        title={post.isPinned ? "Unpin from profile" : "Pin to top of profile"}
                    >
                        <Zap size={14} fill={post.isPinned ? "currentColor" : "none"} />
                    </button>
                )}
            </div>
        </div>
    );
}
