'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getRelevantUsersForHub, startConversation } from '@/lib/actions/community';

interface HubUser {
    id: string;
    name: string | null;
    activeRooms: string[];
    lastActive: Date | string;
}

export default function HubTile() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<HubUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sendingTo, setSendingTo] = useState<string | null>(null);

    useEffect(() => {
        async function loadHubUsers() {
            if (!session?.user?.id) return;

            try {
                const data = await getRelevantUsersForHub(session.user.id);
                setUsers(data.slice(0, 5)); // Max 5 users
            } catch (error) {
                console.error('Failed to load hub users:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadHubUsers();
    }, [session?.user?.id]);

    const handleMessage = async (userId: string) => {
        if (!session?.user?.id || sendingTo) return;

        setSendingTo(userId);
        try {
            const conversation = await startConversation(session.user.id, userId, 'hub', null);
            if (conversation?.id) {
                router.push(`/inbox?conversation=${conversation.id}`);
            }
        } catch (error) {
            console.error('Failed to start conversation:', error);
        } finally {
            setSendingTo(null);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center">
                <div className="text-zinc-600 text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <div className="h-full p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[var(--accent-mint)]/20 transition-all">
            <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-[var(--accent-mint)]" />
                <h3 className="text-sm font-bold text-white">Hub</h3>
                <span className="text-[10px] text-zinc-500 ml-auto">Relevant Traders</span>
            </div>

            {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-center">
                    <Users size={24} className="text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-600">No active traders nearby</p>
                    <p className="text-[10px] text-zinc-700 mt-1">Join rooms to connect</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user.name || 'Anonymous'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {user.activeRooms.length > 0 && (
                                        <span className="text-[10px] text-zinc-500 truncate">
                                            {user.activeRooms.slice(0, 2).join(', ')}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                        {formatDistanceToNow(new Date(user.lastActive), { addSuffix: false })}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleMessage(user.id)}
                                disabled={sendingTo === user.id}
                                className="p-1.5 rounded-lg bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/20 transition-colors disabled:opacity-50"
                            >
                                <MessageCircle size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
