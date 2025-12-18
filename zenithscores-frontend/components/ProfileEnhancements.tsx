'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Trophy, Star, Shield, Bell, Trash2, X, AlertTriangle,
    Mic, Brain, Zap, Target, TrendingUp, Award, Flame, ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

// AI Persona Options
const AI_PERSONAS = [
    { id: 'analytic', name: 'Analytic', icon: <Brain size={18} />, description: 'Data-driven, logical analysis', color: 'from-blue-500 to-cyan-500' },
    { id: 'mentor', name: 'Mentor', icon: <Shield size={18} />, description: 'Supportive, educational tone', color: 'from-emerald-500 to-green-500' },
    { id: 'aggressive', name: 'Brutal', icon: <Flame size={18} />, description: 'No sugarcoating, direct roasts', color: 'from-orange-500 to-red-500' },
];

// Achievement Definitions
const ACHIEVEMENTS = [
    { id: 'first_trade', name: 'First Blood', icon: '🩸', description: 'Complete your first trade', unlocked: true },
    { id: 'ten_trades', name: 'Trader', icon: '📊', description: '10 trades executed', unlocked: true },
    { id: 'profitable', name: 'Green Day', icon: '💚', description: 'First profitable day', unlocked: true },
    { id: 'ath', name: 'All-Time High', icon: '🏔️', description: 'Hit a new portfolio ATH', unlocked: false },
    { id: 'streak_3', name: 'Win Streak', icon: '🔥', description: '3 wins in a row', unlocked: false },
    { id: 'comeback', name: 'Comeback King', icon: '👑', description: 'Recover from -10% drawdown', unlocked: false },
    { id: 'zeroed', name: 'Diamond Hands', icon: '💎', description: 'Hold a position for 7 days', unlocked: false },
    { id: 'century', name: 'Century Club', icon: '💯', description: '100 trades milestone', unlocked: false },
];

// Skill Categories
const SKILLS = [
    { name: 'Technical Analysis', value: 65, color: '#8b5cf6' },
    { name: 'Risk Management', value: 45, color: '#f59e0b' },
    { name: 'Zenith Scoring', value: 30, color: '#10b981' },
    { name: 'Psychology', value: 25, color: '#ef4444' },
    { name: 'Market Timing', value: 55, color: '#3b82f6' },
    { name: 'Portfolio Mgmt', value: 40, color: '#ec4899' },
];

interface ProfileEnhancementsProps {
    userId?: number;
    sessionId?: string;
    onAccountDeleted?: () => void;
}

export default function ProfileEnhancements({ userId, sessionId, onAccountDeleted }: ProfileEnhancementsProps) {
    // State
    const [aiPersona, setAiPersona] = useState('mentor');
    const [weeklyDigest, setWeeklyDigest] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') return;

        setDeleting(true);
        try {
            // Call backend to delete all user data
            const res = await fetch(`${API_URL}/api/v1/auth/delete-account`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, session_id: sessionId })
            });

            if (res.ok) {
                // Clear local storage
                localStorage.clear();
                onAccountDeleted?.();
                // Redirect to home after deletion
                window.location.href = '/';
            }
        } catch (e) {
            console.error('Delete failed:', e);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* AI Persona Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-2xl p-6"
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Bot className="text-purple-400" size={20} />
                    AI Assistant Persona
                </h3>
                <p className="text-sm text-gray-400 mb-4">Choose how Zenith AI communicates with you</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {AI_PERSONAS.map(persona => (
                        <button
                            key={persona.id}
                            onClick={() => setAiPersona(persona.id)}
                            className={`relative p-4 rounded-xl border transition-all text-left ${aiPersona === persona.id
                                    ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                                    : 'border-white/10 hover:border-white/20 bg-black/20'
                                }`}
                        >
                            {aiPersona === persona.id && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                            )}
                            <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${persona.color} bg-opacity-20 mb-2`}>
                                {persona.icon}
                            </div>
                            <div className="font-medium text-white">{persona.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{persona.description}</div>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Achievement Gallery */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-2xl p-6"
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="text-yellow-400" size={20} />
                    Achievement Gallery
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    {ACHIEVEMENTS.filter(a => a.unlocked).length}/{ACHIEVEMENTS.length} unlocked
                </p>

                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {ACHIEVEMENTS.map(achievement => (
                        <div
                            key={achievement.id}
                            className={`relative group ${achievement.unlocked ? '' : 'opacity-40 grayscale'}`}
                            title={achievement.description}
                        >
                            <div className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-transform ${achievement.unlocked
                                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 group-hover:scale-110'
                                    : 'bg-black/30 border border-white/5'
                                }`}>
                                {achievement.icon}
                            </div>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                                <div className="w-full bg-black/80 text-[8px] text-center text-white px-1 py-0.5 rounded-b-xl truncate">
                                    {achievement.name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Skills Radar Visualization */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-2xl p-6"
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="text-cyan-400" size={20} />
                    Skill Radar
                </h3>

                <div className="space-y-3">
                    {SKILLS.map(skill => (
                        <div key={skill.name}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">{skill.name}</span>
                                <span className="text-white font-medium">{skill.value}%</span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.value}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: skill.color }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Security & Preferences */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-2xl p-6"
            >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="text-emerald-400" size={20} />
                    Security & Preferences
                </h3>

                <div className="space-y-4">
                    {/* Weekly Digest Toggle */}
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-gray-400" />
                            <div>
                                <div className="text-sm font-medium text-white">Weekly Watchlist Digest</div>
                                <div className="text-xs text-gray-500">Get email reports on your tracked assets</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setWeeklyDigest(!weeklyDigest)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${weeklyDigest ? 'bg-emerald-500' : 'bg-gray-600'
                                }`}
                        >
                            <motion.div
                                animate={{ x: weeklyDigest ? 24 : 4 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                            />
                        </button>
                    </div>

                    {/* Delete Account */}
                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete Account & All Data
                        </button>
                        <p className="text-[10px] text-gray-600 mt-1">
                            This permanently removes all your data including watchlists, trade history, and AI chat history.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-full bg-red-500/20">
                                    <AlertTriangle className="text-red-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Delete Account</h3>
                                    <p className="text-sm text-red-400">This action is permanent</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="ml-auto p-1 rounded-lg hover:bg-white/10"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                                <p className="text-sm text-gray-300">
                                    All your data will be permanently deleted:
                                </p>
                                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                                    <li>• Paper Trading history & portfolio</li>
                                    <li>• Watchlists & saved assets</li>
                                    <li>• AI Coach chat history</li>
                                    <li>• Learning progress & achievements</li>
                                </ul>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm text-gray-400">
                                    Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                                    placeholder="DELETE"
                                    className="w-full mt-2 px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono uppercase tracking-widest text-center focus:outline-none focus:border-red-500/50"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmation !== 'DELETE' || deleting}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleting ? 'Deleting...' : 'Delete Forever'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
