'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bell, Zap, Trophy, Target, Flame, Award, ChevronLeft, Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    loadNotifications, saveNotifications,
    type PushNotification
} from '@/lib/notification-engine';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<PushNotification[]>([]);

    useEffect(() => {
        setNotifications(loadNotifications());
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        saveNotifications(updated);
    };

    const markAllRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        saveNotifications(updated);
    };

    const clearAll = () => {
        setNotifications([]);
        saveNotifications([]);
    };

    const getIcon = (type: PushNotification['type']) => {
        switch (type) {
            case 'pulse': return <Zap size={18} className="text-cyan-400" />;
            case 'arena': return <Trophy size={18} className="text-yellow-400" />;
            case 'prediction': return <Target size={18} className="text-purple-400" />;
            case 'streak': return <Flame size={18} className="text-orange-400" />;
            case 'achievement': return <Award size={18} className="text-pink-400" />;
            case 'signal': return <Zap size={18} className="text-emerald-400" />;
        }
    };

    const formatTime = (date: Date) => {
        const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="min-h-screen bg-void text-white pt-16 pb-20">
            {/* Header */}
            <div className="sticky top-16 z-10 bg-void/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className="text-text-secondary" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Bell size={18} className="text-accent-mint" />
                            <h1 className="text-lg font-bold">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-accent-mint/20 text-accent-mint text-xs font-bold rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                    <Link
                        href="/profile/settings"
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Settings size={18} className="text-text-muted" />
                    </Link>
                </div>

                {/* Actions */}
                {notifications.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 border-t border-white/5">
                        <button
                            onClick={markAllRead}
                            className="text-xs text-accent-mint font-medium hover:text-accent-mint/80"
                        >
                            Mark all read
                        </button>
                        <span className="text-text-muted">•</span>
                        <button
                            onClick={clearAll}
                            className="text-xs text-text-muted font-medium hover:text-text-secondary"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Notifications List */}
            <div className="px-4 py-4 space-y-2">
                {notifications.length === 0 ? (
                    <div className="py-20 text-center">
                        <Bell size={48} className="mx-auto text-white/10 mb-4" />
                        <h3 className="text-lg font-bold text-text-secondary mb-2">No notifications</h3>
                        <p className="text-sm text-text-muted">
                            You're all caught up! New notifications will appear here.
                        </p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <Link
                            key={notif.id}
                            href={notif.action || '/command-center'}
                            onClick={() => markAsRead(notif.id)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border transition-colors ${
                                    !notif.read
                                        ? 'bg-accent-mint/5 border-accent-mint/20'
                                        : 'bg-surface-2 border-white/5'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-white/5 mt-0.5">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-white">
                                                {notif.title}
                                            </h3>
                                            {!notif.read && (
                                                <span className="w-2 h-2 bg-accent-mint rounded-full" />
                                            )}
                                        </div>
                                        <p className="text-sm text-text-secondary mb-2">
                                            {notif.body}
                                        </p>
                                        <span className="text-xs text-text-muted">
                                            {formatTime(notif.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
