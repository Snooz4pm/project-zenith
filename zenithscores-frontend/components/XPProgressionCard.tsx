'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Award, Zap, Target, CheckCircle, Lock } from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';
import {
    initializeUserStreak, checkIn, calculateLevel,
    type UserStreak, type Quest, type Achievement
} from '@/lib/pulse-engine';

const STORAGE_KEY = 'zenith_user_streak';

export default function XPProgressionCard() {
    const [premium, setPremium] = useState(false);
    const [streak, setStreak] = useState<UserStreak | null>(null);
    const [justCheckedIn, setJustCheckedIn] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());

        // Load streak from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setStreak(JSON.parse(stored));
        } else {
            setStreak(initializeUserStreak());
        }
    }, []);

    const handleCheckIn = () => {
        if (!streak) return;

        const updated = checkIn(streak);
        setStreak(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setJustCheckedIn(true);

        setTimeout(() => setJustCheckedIn(false), 2000);
    };

    if (!streak) return null;

    // Locked for free users
    if (!premium) {
        return (
            <div className="relative rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-sm text-white font-bold">XP & Streaks</p>
                    <p className="text-[10px] text-gray-400">Track your progress</p>
                </div>
                <div className="blur-sm opacity-40">
                    <div className="h-16 bg-white/5 rounded-xl mb-3" />
                    <div className="h-8 bg-white/5 rounded-lg" />
                </div>
            </div>
        );
    }

    const levelData = calculateLevel(streak.xp);
    const progressPercent = (streak.xp % 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-5"
        >
            {/* Header with Level */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">{streak.level}</span>
                        </div>
                        <Star size={12} className="absolute -top-1 -right-1 text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">LEVEL</p>
                        <p className="font-bold text-white">Market Analyst</p>
                    </div>
                </div>

                {/* Streak Badge */}
                <motion.div
                    animate={justCheckedIn ? { scale: [1, 1.2, 1] } : {}}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30"
                >
                    <Flame size={14} className="text-orange-400" />
                    <span className="font-bold text-orange-400">{streak.currentStreak}</span>
                    <span className="text-xs text-gray-500">day streak</span>
                </motion.div>
            </div>

            {/* XP Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">XP Progress</span>
                    <span className="text-cyan-400">{streak.xp} XP</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{streak.nextLevelXp} XP to level {streak.level + 1}</p>
            </div>

            {/* Daily Quests */}
            <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Target size={10} className="text-purple-400" />
                    DAILY QUESTS
                </p>
                <div className="space-y-2">
                    {streak.dailyQuests.slice(0, 3).map((quest) => (
                        <div key={quest.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2">
                                {quest.completed ? (
                                    <CheckCircle size={14} className="text-green-400" />
                                ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                                )}
                                <span className={`text-xs ${quest.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                                    {quest.title}
                                </span>
                            </div>
                            <span className="text-[10px] text-cyan-400">+{quest.xpReward} XP</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Check-in Button */}
            <button
                onClick={handleCheckIn}
                disabled={justCheckedIn}
                className={`w-full py-3 rounded-xl font-bold transition-all ${justCheckedIn
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400'
                    }`}
            >
                {justCheckedIn ? '✓ Checked In!' : 'Check In (+5 XP)'}
            </button>

            {/* Achievements Preview */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-gray-500 mb-2">ACHIEVEMENTS</p>
                <div className="flex gap-2">
                    {streak.achievements.slice(0, 4).map((achievement) => (
                        <div
                            key={achievement.id}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${achievement.unlockedAt
                                    ? 'bg-yellow-500/20'
                                    : 'bg-white/5 grayscale opacity-40'
                                }`}
                            title={achievement.title}
                        >
                            {achievement.icon}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
