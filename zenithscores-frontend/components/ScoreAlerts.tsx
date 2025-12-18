'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, TrendingUp, TrendingDown, Zap, AlertTriangle, X, Check, Lock } from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';

interface Alert {
    id: string;
    symbol: string;
    type: 'score_up' | 'score_down' | 'breakout' | 'warning';
    message: string;
    timestamp: Date;
    read: boolean;
}

// Mock alerts for demo
const DEMO_ALERTS: Alert[] = [
    { id: '1', symbol: 'NVDA', type: 'score_up', message: 'Score jumped 62 → 84: Volume spike detected', timestamp: new Date(Date.now() - 1000 * 60 * 15), read: false },
    { id: '2', symbol: 'TSLA', type: 'breakout', message: 'Momentum breakout: Historically +3.2% in 24h', timestamp: new Date(Date.now() - 1000 * 60 * 45), read: false },
    { id: '3', symbol: 'BTC', type: 'warning', message: 'Score high but liquidity weak — caution', timestamp: new Date(Date.now() - 1000 * 60 * 120), read: true },
    { id: '4', symbol: 'AAPL', type: 'score_down', message: 'Score dropping: Trend weakness detected', timestamp: new Date(Date.now() - 1000 * 60 * 180), read: true },
];

export default function ScoreAlerts() {
    const [premium, setPremium] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());

        // Load read status from localStorage
        const readAlerts = JSON.parse(localStorage.getItem('zenith_read_alerts') || '[]') as string[];
        const initialAlerts = DEMO_ALERTS.map(a => ({
            ...a,
            read: readAlerts.includes(a.id)
        }));
        setAlerts(initialAlerts);
    }, []);

    const unreadCount = alerts.filter(a => !a.read).length;

    const markAsRead = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
        // Persist to localStorage
        const readAlerts = JSON.parse(localStorage.getItem('zenith_read_alerts') || '[]') as string[];
        if (!readAlerts.includes(id)) {
            readAlerts.push(id);
            localStorage.setItem('zenith_read_alerts', JSON.stringify(readAlerts));
        }
    };

    const markAllAsRead = () => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
        const allIds = alerts.map(a => a.id);
        localStorage.setItem('zenith_read_alerts', JSON.stringify(allIds));
    };

    const getAlertIcon = (type: Alert['type']) => {
        switch (type) {
            case 'score_up': return <TrendingUp size={14} className="text-green-400" />;
            case 'score_down': return <TrendingDown size={14} className="text-red-400" />;
            case 'breakout': return <Zap size={14} className="text-yellow-400" />;
            case 'warning': return <AlertTriangle size={14} className="text-orange-400" />;
        }
    };

    const formatTime = (date: Date) => {
        const mins = Math.floor((Date.now() - date.getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (!premium) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowSetupModal(true)}
                    className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300 transition-colors"
                >
                    <BellOff size={18} />
                    <Lock size={10} className="absolute -top-1 -right-1 text-purple-400" />
                </button>

                <AnimatePresence>
                    {showSetupModal && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-12 w-72 bg-[#1a1a2e] border border-purple-500/30 rounded-xl p-4 shadow-2xl z-50"
                        >
                            <button onClick={() => setShowSetupModal(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white">
                                <X size={14} />
                            </button>
                            <div className="text-center">
                                <Bell size={24} className="mx-auto mb-2 text-purple-400" />
                                <h4 className="text-white font-bold mb-1">Score Alerts</h4>
                                <p className="text-xs text-gray-400 mb-3">
                                    Get notified when scores spike, reverse, or show danger signals.
                                </p>
                                <div className="text-[10px] text-gray-500 space-y-1 mb-3 text-left">
                                    <div className="flex items-center gap-2"><TrendingUp size={10} className="text-green-400" /> Score crossed 80</div>
                                    <div className="flex items-center gap-2"><Zap size={10} className="text-yellow-400" /> Momentum breakout</div>
                                    <div className="flex items-center gap-2"><AlertTriangle size={10} className="text-orange-400" /> Risk warning</div>
                                </div>
                                <span className="text-[10px] text-purple-400 flex items-center justify-center gap-1">
                                    <Lock size={10} /> Premium Feature
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/30 transition-colors"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-12 w-80 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-white/5">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                <Bell size={14} className="text-cyan-400" />
                                Score Alerts
                            </h4>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Alerts List */}
                        <div className="max-h-80 overflow-y-auto">
                            {alerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!alert.read ? 'bg-cyan-500/5' : ''}`}
                                    onClick={() => markAsRead(alert.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-white/5">
                                            {getAlertIcon(alert.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-white text-sm">{alert.symbol}</span>
                                                {!alert.read && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">{alert.message}</p>
                                            <span className="text-[10px] text-gray-600">{formatTime(alert.timestamp)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-2 border-t border-white/5 text-center">
                            <button className="text-[10px] text-cyan-400 hover:text-cyan-300">
                                Configure Alert Rules →
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
