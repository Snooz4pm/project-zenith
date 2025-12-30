'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Bell, Heart, UserPlus, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommunityTileProps {
    onClick: () => void;
}

interface Notification {
    type: 'mention' | 'like' | 'follow' | 'comment';
    message: string;
}

export default function CommunityTile({ onClick }: CommunityTileProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(3);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/community/notifications');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications?.slice(0, 2) || []);
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch (error) {
                // Return empty state on error
                setNotifications([]);
                setUnreadCount(0);
            }
        };
        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'mention': return <MessageSquare className="w-3 h-3 text-blue-400" />;
            case 'like': return <Heart className="w-3 h-3 text-pink-400" />;
            case 'follow': return <UserPlus className="w-3 h-3 text-green-400" />;
            default: return <Bell className="w-3 h-3 text-zinc-400" />;
        }
    };

    return (
        <motion.div
            className="col-span-1 row-span-1 relative overflow-hidden rounded-2xl bg-[#0a0a12] border border-white/5 p-5 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-pink-500/5 group cursor-pointer flex flex-col h-full"
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-white">Social</span>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className="mb-3">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium">
                        <Bell className="w-3 h-3" /> {unreadCount} new
                    </span>
                </div>

                <div className="space-y-2">
                    {notifications.length > 0 ? (
                        notifications.map((notif, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs text-zinc-400 bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                                <div className="min-w-5 h-5 rounded bg-white/5 flex items-center justify-center">
                                    {getIcon(notif.type)}
                                </div>
                                <span className="truncate">{notif.message}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-zinc-500 text-center py-2 italic">
                            No new notifications
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
