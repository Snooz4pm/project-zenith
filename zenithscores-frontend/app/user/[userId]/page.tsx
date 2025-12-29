'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Trophy, TrendingUp, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PublicProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                console.log('[PUBLIC PROFILE] Fetching for userId:', userId);
                const res = await fetch(`/api/profile/${userId}`);
                const data = await res.json();
                console.log('[PUBLIC PROFILE] Response:', res.status, data);

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
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="text-zinc-500">Loading profile...</div>
            </div>
        );
    }

    if (!profile || error) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
                    <p className="text-zinc-500 mb-6">{error || 'This user profile doesn\'t exist or is private.'}</p>
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
                    <Link href="/profile">
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                    </Link>
                    <h1 className="text-lg font-bold">Public Profile</h1>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Profile Header */}
                    <div className="flex items-start gap-6">
                        {profile.image ? (
                            <img
                                src={profile.image}
                                alt={profile.name || 'User'}
                                className="w-24 h-24 rounded-full border-2 border-emerald-500/30"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-3xl font-bold">
                                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-2">{profile.name || 'Anonymous Trader'}</h2>
                            {profile.bio && (
                                <p className="text-zinc-400 mb-4">{profile.bio}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                                <span className="flex items-center gap-2">
                                    <User size={14} />
                                    {profile.experienceLevel || 'Beginner'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <Trophy size={16} />
                                Badges
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {profile.badges?.length || 0}
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <BookOpen size={16} />
                                Courses
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {profile.coursesCompleted || 0}
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <TrendingUp size={16} />
                                Path
                            </div>
                            <div className="text-lg font-bold text-emerald-400">
                                {profile.careerPath || 'Exploring'}
                            </div>
                        </div>
                    </div>

                    {/* Badges Section */}
                    {profile.showBadges && profile.badges && profile.badges.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Badges</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {profile.badges.map((badge: any, index: number) => (
                                    <div
                                        key={badge.id || index}
                                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center"
                                    >
                                        <div className="text-3xl mb-2">🏆</div>
                                        <div className="text-sm font-medium text-white">Badge {index + 1}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity Section (Placeholder) */}
                    <div>
                        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/5 text-center text-zinc-500">
                            Activity feed coming soon
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
