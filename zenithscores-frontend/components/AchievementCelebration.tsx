'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, Star, Crown, Zap } from 'lucide-react';

interface Achievement {
    id: string;
    type: 'ath' | 'streak' | 'milestone' | 'profit' | 'badge';
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface AchievementCelebrationProps {
    portfolioValue: number;
    previousValue: number;
    winStreak: number;
    allTimeHigh: number;
}

// Confetti particle
const Confetti = ({ color, delay }: { color: string; delay: number }) => (
    <motion.div
        initial={{
            y: -20,
            x: Math.random() * 400 - 200,
            rotate: 0,
            opacity: 1
        }}
        animate={{
            y: 400,
            x: Math.random() * 600 - 300,
            rotate: Math.random() * 720 - 360,
            opacity: 0
        }}
        transition={{
            duration: 2 + Math.random(),
            delay,
            ease: 'easeOut'
        }}
        className={`absolute w-2 h-2 ${color} rounded-sm`}
        style={{ left: '50%' }}
    />
);

export default function AchievementCelebration({
    portfolioValue,
    previousValue,
    winStreak,
    allTimeHigh
}: AchievementCelebrationProps) {
    const [activeAchievements, setActiveAchievements] = useState<Achievement[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);

    const triggerAchievement = useCallback((achievement: Achievement) => {
        setActiveAchievements(prev => [...prev, achievement]);

        if (achievement.type === 'ath' || achievement.type === 'milestone') {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setActiveAchievements(prev => prev.filter(a => a.id !== achievement.id));
        }, 4000);
    }, []);

    useEffect(() => {
        // Check for All-Time High
        if (portfolioValue > allTimeHigh && portfolioValue > previousValue) {
            triggerAchievement({
                id: `ath-${Date.now()}`,
                type: 'ath',
                title: 'New All-Time High! 🎉',
                description: `Portfolio reached $${portfolioValue.toLocaleString()}`,
                icon: <Trophy className="text-yellow-400" size={24} />,
                color: 'from-yellow-500 to-orange-500'
            });
        }

        // Check for milestones
        const milestones = [10500, 11000, 12000, 15000, 20000, 25000, 50000, 100000];
        for (const milestone of milestones) {
            if (portfolioValue >= milestone && previousValue < milestone) {
                triggerAchievement({
                    id: `milestone-${milestone}`,
                    type: 'milestone',
                    title: `$${(milestone / 1000).toFixed(0)}K Milestone! 🚀`,
                    description: 'Keep up the great trading!',
                    icon: <Star className="text-purple-400" size={24} />,
                    color: 'from-purple-500 to-pink-500'
                });
            }
        }

        // Check for profit streak
        if (winStreak >= 3 && portfolioValue > previousValue) {
            triggerAchievement({
                id: `streak-${winStreak}`,
                type: 'streak',
                title: `${winStreak} Win Streak! 🔥`,
                description: "You're on fire!",
                icon: <Flame className="text-orange-400" size={24} />,
                color: 'from-orange-500 to-red-500'
            });
        }

        // Big profit celebration (5%+ gain)
        const gainPercent = ((portfolioValue - previousValue) / previousValue) * 100;
        if (gainPercent >= 5 && previousValue > 0) {
            triggerAchievement({
                id: `profit-${Date.now()}`,
                type: 'profit',
                title: `+${gainPercent.toFixed(1)}% Profit! 💰`,
                description: 'Exceptional trade performance',
                icon: <Zap className="text-emerald-400" size={24} />,
                color: 'from-emerald-500 to-cyan-500'
            });
        }
    }, [portfolioValue, previousValue, winStreak, allTimeHigh, triggerAchievement]);

    const confettiColors = ['bg-yellow-400', 'bg-pink-400', 'bg-cyan-400', 'bg-purple-400', 'bg-green-400', 'bg-orange-400'];

    return (
        <>
            {/* Confetti */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <Confetti
                                key={i}
                                color={confettiColors[i % confettiColors.length]}
                                delay={i * 0.03}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Achievement Notifications */}
            <div className="fixed top-20 right-4 z-[250] space-y-3 pointer-events-none">
                <AnimatePresence>
                    {activeAchievements.map((achievement) => (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            className="pointer-events-auto"
                        >
                            <div className={`relative overflow-hidden rounded-xl border border-white/20 bg-gradient-to-r ${achievement.color} p-0.5 shadow-2xl`}>
                                <div className="bg-black/90 backdrop-blur-xl rounded-xl p-4 flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-white/10">
                                        {achievement.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{achievement.title}</h4>
                                        <p className="text-xs text-gray-400">{achievement.description}</p>
                                    </div>
                                </div>
                                {/* Animated shine effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '200%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}
