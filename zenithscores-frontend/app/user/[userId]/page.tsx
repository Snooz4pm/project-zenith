import { getPublicProfile } from '@/lib/actions/profile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Calendar, Users, Edit2 } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
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
                            Edit Profile
                        </Link>
                    )}
                </div>

                {/* Profile Header */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4">
                        {profile.image ? (
                            <img
                                src={profile.image}
                                alt={profile.name || 'User'}
                                className="w-20 h-20 rounded-full border-2 border-[var(--accent-mint)]/30"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-mint)]/30 to-cyan-500/30 flex items-center justify-center text-2xl font-bold">
                                {profile.name?.[0]?.toUpperCase() || 'T'}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{profile.name || 'Trader'}</h1>
                            <p className="text-sm text-zinc-500">
                                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                        {!isOwnProfile && (
                            <Link
                                href={`/inbox?startWith=${profile.id}`}
                                className="ml-auto px-4 py-2 bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 rounded-lg text-sm text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 transition-colors"
                            >
                                Message
                            </Link>
                        )}
                    </div>
                </div>

                {/* Active Rooms */}
                {profile.activeRooms.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                            <Users size={14} />
                            Active Rooms
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.activeRooms.map((room) => (
                                <Link
                                    key={room.id}
                                    href={`/community/rooms/${room.slug}`}
                                    className="px-3 py-1.5 bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 rounded-lg text-sm text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 transition-colors"
                                >
                                    {room.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts Section */}
                <div>
                    <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <MessageCircle size={14} />
                        {isOwnProfile ? 'Your Posts' : 'Recent Posts'} ({profile.recentPosts.length})
                    </h2>

                    {profile.recentPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <MessageCircle size={32} className="mx-auto mb-2 text-zinc-600" />
                            <p className="text-zinc-500 text-sm">
                                {isOwnProfile ? "You haven't posted yet" : 'No posts yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {profile.recentPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <Link href={`/community/${post.id}`} className="flex-1 min-w-0">
                                            <h3 className="font-medium text-white group-hover:text-[var(--accent-mint)] transition-colors line-clamp-1">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                                                {post.body}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle size={10} />
                                                    {post._count.comments}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] uppercase">
                                                    {post.postType}
                                                </span>
                                            </div>
                                        </Link>

                                        {isOwnProfile && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DeletePostButton postId={post.id} userId={session?.user?.id || ''} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
