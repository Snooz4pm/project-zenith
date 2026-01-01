'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, MessageSquare, TrendingUp, User, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface Notification {
    id: string;
    type: 'signal' | 'trade' | 'social' | 'system';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
}

const ICON_MAP = {
    signal: Activity,
    trade: TrendingUp,
    social: User,
    system: Zap,
};

const COLOR_MAP = {
    signal: 'text-[var(--accent-mint)] bg-[var(--accent-mint)]/10',
    trade: 'text-blue-400 bg-blue-400/10',
    social: 'text-purple-400 bg-purple-400/10',
    system: 'text-amber-400 bg-amber-400/10',
};

export default function InboxPage() {
    const { data: session, status } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/auth/login');
        }
    }, [status]);

    useEffect(() => {
        // Load notifications from API
        async function loadNotifications() {
            setLoading(true);
            try {
                // TODO: Replace with actual API call
                // For now, show placeholder
                setNotifications([]);
            } catch (error) {
                console.error('Failed to load notifications');
            } finally {
                setLoading(false);
            }
        }
        loadNotifications();
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center pb-20 md:pb-0">
                <div className="text-zinc-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--void)] text-white pb-20 md:pb-0">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[var(--void)]/95 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent-mint)]/10 flex items-center justify-center">
                                <Bell size={20} className="text-[var(--accent-mint)]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Inbox</h1>
                                {unreadCount > 0 && (
                                    <p className="text-sm text-zinc-500">
                                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-[var(--accent-mint)] hover:text-[var(--accent-mint)]/80 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === 'all'
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === 'unread'
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                {filteredNotifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                            <Bell size={28} className="text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">
                            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </h3>
                        <p className="text-zinc-500 text-sm">
                            {filter === 'unread'
                                ? 'You have no unread notifications'
                                : 'Notifications will appear here when you have them'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filteredNotifications.map((notification, index) => {
                                const Icon = ICON_MAP[notification.type];
                                const colorClass = COLOR_MAP[notification.type];

                                return (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`relative p-4 rounded-xl border transition-all ${
                                            notification.read
                                                ? 'bg-white/[0.02] border-white/5'
                                                : 'bg-white/5 border-[var(--accent-mint)]/20'
                                        }`}
                                    >
                                        {!notification.read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[var(--accent-mint)]" />
                                        )}
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-white mb-1">
                                                    {notification.title}
                                                </h4>
                                                <p className="text-sm text-zinc-400 mb-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-zinc-600">
                                                    {new Date(notification.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={18} className="text-zinc-500" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} className="text-zinc-500 hover:text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
