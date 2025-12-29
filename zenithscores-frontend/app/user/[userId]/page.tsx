import { getPublicProfile } from '@/lib/actions/profile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Calendar, Users, Edit2 } from 'lucide-react';
import ProfileCard from '@/components/ui/ProfileCard';
import DeletePostButton from './DeletePostButton';

interface PageProps {
    params: { userId: string };
}

export default async function PublicProfilePage({ params }: PageProps) {
    const session = await getServerSession(authOptions);
    const profile = await getPublicProfile(params.userId);

    if (!profile) {
        notFound();
    }

    const isOwnProfile = session?.user?.id === profile.id;
    const tradingStyleStr = profile.tradingStyle
        ? (typeof profile.tradingStyle === 'object' && profile.tradingStyle !== null
            ? (profile.tradingStyle as { style?: string }).style
            : String(profile.tradingStyle))
        : undefined;

    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/community"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Community</span>
                    </Link>

                    {isOwnProfile && (
                        <Link
                            href="/profile"
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
                        >
                            Edit Profile Settings
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
                    {/* Profile Card */}
                    <div className="flex justify-center lg:justify-start">
                        <ProfileCard
                            avatarUrl={profile.image || undefined}
                            name={profile.name || 'Trader'}
                            handle={profile.name?.toLowerCase().replace(/\s+/g, '') || 'trader'}
                            bio={profile.bio || undefined}
                            status="Active Trader"
                            experience={(profile.experience as 'beginner' | 'intermediate' | 'advanced') || 'beginner'}
                            tradingStyle={tradingStyleStr}
                            preferredMarkets={profile.preferredMarkets}
                            activeRooms={profile.activeRooms.map(r => r.name)}
                            memberSince={profile.createdAt}
                            contactText="Message"
                        />
                    </div>

                    {/* Posts Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <MessageCircle size={20} className="text-[var(--accent-mint)]" />
                                {isOwnProfile ? 'Your Posts' : 'Recent Posts'}
                            </h2>
                            <span className="text-sm text-zinc-500">
                                {profile.recentPosts.length} posts
                            </span>
                        </div>

                        {profile.recentPosts.length === 0 ? (
                            <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
                                <MessageCircle size={40} className="mx-auto mb-3 text-zinc-600" />
                                <p className="text-zinc-500">
                                    {isOwnProfile ? "You haven't posted yet" : 'No posts yet'}
                                </p>
                                {isOwnProfile && (
                                    <Link
                                        href="/community"
                                        className="inline-block mt-4 px-4 py-2 bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 rounded-lg text-sm text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 transition-colors"
                                    >
                                        Create Your First Post
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {profile.recentPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <Link href={`/community/${post.id}`} className="flex-1 min-w-0">
                                                <h3 className="font-medium text-white group-hover:text-[var(--accent-mint)] transition-colors line-clamp-1">
                                                    {post.title}
                                                </h3>
                                                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                                                    {post.body}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle size={12} />
                                                        {post._count.comments} comments
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] uppercase">
                                                        {post.postType}
                                                    </span>
                                                </div>
                                            </Link>

                                            {/* Edit/Delete for own profile */}
                                            {isOwnProfile && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/community/${post.id}`}
                                                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        title="View post"
                                                    >
                                                        <Edit2 size={14} />
                                                    </Link>
                                                    <DeletePostButton postId={post.id} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Active Rooms */}
                        {profile.activeRooms.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <Users size={20} className="text-[var(--accent-mint)]" />
                                    Active Rooms
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {profile.activeRooms.map((room) => (
                                        <Link
                                            key={room.id}
                                            href={`/community/rooms/${room.slug}`}
                                            className="px-4 py-2 bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 rounded-lg text-sm text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 transition-colors"
                                        >
                                            {room.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
