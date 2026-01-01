'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Loader2, Check } from 'lucide-react';
import { searchUsersToInvite, sendRoomInvitation } from '@/lib/actions/room-invitations';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    roomName: string;
    currentUserId: string;
}

interface SearchUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
}

export default function InviteUserModal({ isOpen, onClose, roomId, roomName, currentUserId }: InviteUserModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
    const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            setError(null);
            try {
                const results = await searchUsersToInvite(searchQuery, roomId, currentUserId);
                setSearchResults(results);
            } catch (err) {
                setError('Failed to search users');
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, roomId, currentUserId]);

    const handleInvite = async (userId: string) => {
        setInvitingUserId(userId);
        setError(null);

        try {
            await sendRoomInvitation(currentUserId, userId, roomId);
            setInvitedUsers(prev => new Set([...prev, userId]));

            // Remove from search results
            setSearchResults(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invitation');
        } finally {
            setInvitingUserId(null);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setInvitedUsers(new Set());
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 z-50 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Invite to {roomName}</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">Search for users to invite</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={18} className="text-zinc-500" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/50"
                                autoFocus
                            />
                            {isSearching && (
                                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Search Results */}
                        <div className="max-h-[320px] overflow-y-auto">
                            {searchQuery.length < 2 ? (
                                <div className="py-8 text-center text-zinc-500 text-sm">
                                    Type at least 2 characters to search
                                </div>
                            ) : searchResults.length === 0 && !isSearching ? (
                                <div className="py-8 text-center text-zinc-500 text-sm">
                                    No users found
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {/* Avatar */}
                                                {user.image ? (
                                                    <img
                                                        src={user.image}
                                                        alt={user.name || 'User'}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[var(--accent-mint)]/20 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-[var(--accent-mint)]">
                                                            {(user.name || user.email).charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-medium truncate">
                                                        {user.name || 'Anonymous'}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Invite Button */}
                                            <button
                                                onClick={() => handleInvite(user.id)}
                                                disabled={invitingUserId === user.id}
                                                className="ml-2 px-3 py-1.5 bg-[var(--accent-mint)] text-[var(--void)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                            >
                                                {invitingUserId === user.id ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Inviting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={12} />
                                                        Invite
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Invited Users Count */}
                        {invitedUsers.size > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-sm text-[var(--accent-mint)]">
                                    <Check size={14} />
                                    <span>
                                        {invitedUsers.size} invitation{invitedUsers.size > 1 ? 's' : ''} sent
                                    </span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
