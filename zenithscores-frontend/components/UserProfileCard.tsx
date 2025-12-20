'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Settings, Award, TrendingUp, Users, Calendar,
    Twitter, MessageSquare, Edit2, Save, X, Crown
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Badge, CAREER_BADGES } from '@/lib/badge-system';
import BadgeDisplay, { BadgeShowcase } from './BadgeDisplay';

interface UserProfile {
    id: string;
    displayName: string;
    bio: string;
    careerPath: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    twitterHandle?: string;
    discordHandle?: string;
    isPublic: boolean;
    showTrades: boolean;
    showBadges: boolean;
    stats: {
        totalTrades: number;
        winRate: number;
        portfolioValue: number;
        followers: number;
        following: number;
        postsCount: number;
    };
    badges: Badge[];
    joinedAt: Date;
    isPremium: boolean;
}

interface UserProfileCardProps {
    profile: UserProfile;
    isOwnProfile?: boolean;
    onFollow?: () => void;
    isFollowing?: boolean;
}

const EXPERIENCE_LEVELS = [
    { value: 'beginner', label: 'Beginner', color: 'text-gray-400' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-blue-400' },
    { value: 'advanced', label: 'Advanced', color: 'text-purple-400' },
    { value: 'expert', label: 'Expert', color: 'text-amber-400' }
];

const CAREER_PATHS = [
    { id: 'market-analyst', name: 'Market Analyst', icon: '📊' },
    { id: 'data-research', name: 'Data/Research', icon: '🔬' },
    { id: 'systematic-trading', name: 'Systematic Trading', icon: '🤖' },
    { id: 'execution-trader', name: 'Execution Trader', icon: '🎯' },
    { id: 'macro-observer', name: 'Macro Observer', icon: '🌍' }
];

export default function UserProfileCard({
    profile,
    isOwnProfile = false,
    onFollow,
    isFollowing = false
}: UserProfileCardProps) {
    const { data: session } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState(profile);

    const expLevel = EXPERIENCE_LEVELS.find(e => e.value === profile.experienceLevel);
    const careerPath = CAREER_PATHS.find(p => p.id === profile.careerPath);

    const handleSave = async () => {
        // TODO: API call to save profile
        setIsEditing(false);
    };

    return (
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
            {/* Header Banner */}
            <div className="h-32 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-blue-900/50 relative">
                {profile.isPremium && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 
                                  bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full">
                        <Crown className="w-4 h-4 text-black" />
                        <span className="text-xs font-bold text-black">PREMIUM</span>
                    </div>
                )}
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 
                                      border-4 border-gray-900 flex items-center justify-center text-4xl shadow-xl">
                            {session?.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt={profile.displayName}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-10 h-10 text-white" />
                            )}
                        </div>

                        {/* Experience Badge */}
                        {expLevel && (
                            <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full 
                                          text-xs font-bold bg-gray-800 border border-gray-700 ${expLevel.color}`}>
                                {expLevel.label}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 pt-4 sm:pt-14">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedProfile.displayName}
                                            onChange={e => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xl font-bold text-white"
                                        />
                                    ) : (
                                        <h2 className="text-xl font-bold text-white">{profile.displayName}</h2>
                                    )}

                                    {/* Career Path Badge */}
                                    {careerPath && (
                                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-sm">
                                            {careerPath.icon} {careerPath.name}
                                        </span>
                                    )}
                                </div>

                                {/* Showcase badges */}
                                {profile.showBadges && profile.badges.length > 0 && (
                                    <div className="mt-2">
                                        <BadgeShowcase badges={profile.badges.slice(0, 3)} />
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    isEditing ? (
                                        <>
                                            <button
                                                onClick={handleSave}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 
                                                         rounded-lg text-sm font-medium text-white"
                                            >
                                                <Save className="w-4 h-4" /> Save
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="p-1.5 bg-gray-700 rounded-lg text-gray-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 
                                                     rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-600"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit Profile
                                        </button>
                                    )
                                ) : (
                                    <button
                                        onClick={onFollow}
                                        className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium
                                            ${isFollowing
                                                ? 'bg-gray-700 text-gray-300 hover:bg-red-600/20 hover:text-red-400'
                                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'}`}
                                    >
                                        <Users className="w-4 h-4" />
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="mt-3">
                            {isEditing ? (
                                <textarea
                                    value={editedProfile.bio}
                                    onChange={e => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm resize-none"
                                    rows={2}
                                    placeholder="Tell us about your trading journey..."
                                />
                            ) : (
                                <p className="text-gray-400 text-sm">{profile.bio || 'No bio yet'}</p>
                            )}
                        </div>

                        {/* Social links */}
                        {(profile.twitterHandle || profile.discordHandle) && (
                            <div className="flex gap-4 mt-3">
                                {profile.twitterHandle && (
                                    <a
                                        href={`https://twitter.com/${profile.twitterHandle}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-400"
                                    >
                                        <Twitter className="w-4 h-4" />
                                        @{profile.twitterHandle}
                                    </a>
                                )}
                                {profile.discordHandle && (
                                    <span className="flex items-center gap-1 text-sm text-gray-400">
                                        <MessageSquare className="w-4 h-4" />
                                        {profile.discordHandle}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-800">
                    <StatItem label="Trades" value={profile.stats.totalTrades.toLocaleString()} />
                    <StatItem
                        label="Win Rate"
                        value={`${profile.stats.winRate.toFixed(1)}%`}
                        color={profile.stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}
                    />
                    <StatItem
                        label="Portfolio"
                        value={`$${(profile.stats.portfolioValue / 1000).toFixed(1)}K`}
                    />
                    <StatItem label="Followers" value={profile.stats.followers.toLocaleString()} />
                    <StatItem label="Following" value={profile.stats.following.toLocaleString()} />
                    <StatItem label="Posts" value={profile.stats.postsCount.toLocaleString()} />
                </div>

                {/* Badges Section */}
                {profile.showBadges && profile.badges.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-400" />
                                Badges ({profile.badges.length})
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {profile.badges.map(badge => (
                                <BadgeDisplay key={badge.id} badge={badge} size="sm" showDetails={false} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Member since */}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Member since {profile.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
    return (
        <div className="text-center">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    );
}
