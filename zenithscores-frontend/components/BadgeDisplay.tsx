'use client';

import { motion } from 'framer-motion';
import { Badge, getRarityColor, getRarityGradient } from '@/lib/badge-system';

interface BadgeDisplayProps {
    badge: Badge;
    size?: 'sm' | 'md' | 'lg';
    showDetails?: boolean;
    isPinned?: boolean;
    onClick?: () => void;
}

export default function BadgeDisplay({
    badge,
    size = 'md',
    showDetails = true,
    isPinned = false,
    onClick
}: BadgeDisplayProps) {
    const sizeClasses = {
        sm: 'w-10 h-10 text-lg',
        md: 'w-14 h-14 text-2xl',
        lg: 'w-20 h-20 text-4xl'
    };

    const rarityColor = getRarityColor(badge.rarity);
    const rarityGradient = getRarityGradient(badge.rarity);

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative cursor-pointer ${onClick ? 'hover:brightness-110' : ''}`}
        >
            {/* Badge Icon */}
            <div
                className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${rarityGradient} 
                          flex items-center justify-center shadow-lg relative overflow-hidden`}
                style={{
                    boxShadow: `0 0 20px ${rarityColor}40, 0 4px 12px rgba(0,0,0,0.3)`
                }}
            >
                {/* Shine effect for legendary */}
                {badge.rarity === 'legendary' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                  animate-shimmer" />
                )}

                <span className="drop-shadow-lg">{badge.icon}</span>

                {/* Pinned indicator */}
                {isPinned && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full 
                                  flex items-center justify-center">
                        <span className="text-[8px]">📌</span>
                    </div>
                )}
            </div>

            {/* Details */}
            {showDetails && (
                <div className="mt-2 text-center">
                    <p className="font-semibold text-white text-sm truncate max-w-[80px]">
                        {badge.name}
                    </p>
                    <p
                        className="text-xs capitalize"
                        style={{ color: rarityColor }}
                    >
                        {badge.rarity}
                    </p>
                </div>
            )}
        </motion.div>
    );
}

// Badge Grid Component
interface BadgeGridProps {
    badges: (Badge & { earned?: boolean; pinnedAt?: number })[];
    onBadgeClick?: (badge: Badge) => void;
}

export function BadgeGrid({ badges, onBadgeClick }: BadgeGridProps) {
    // Sort: pinned first, then by rarity
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

    const sortedBadges = [...badges].sort((a, b) => {
        if (a.pinnedAt && !b.pinnedAt) return -1;
        if (!a.pinnedAt && b.pinnedAt) return 1;
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    return (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {sortedBadges.map(badge => (
                <BadgeDisplay
                    key={badge.id}
                    badge={badge}
                    size="md"
                    isPinned={!!badge.pinnedAt}
                    onClick={() => onBadgeClick?.(badge)}
                />
            ))}
        </div>
    );
}

// Badge Showcase (for profile header - shows top 3 pinned badges)
interface BadgeShowcaseProps {
    badges: Badge[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
    const topBadges = badges.slice(0, 3);

    if (topBadges.length === 0) return null;

    return (
        <div className="flex gap-2">
            {topBadges.map(badge => (
                <BadgeDisplay
                    key={badge.id}
                    badge={badge}
                    size="sm"
                    showDetails={false}
                />
            ))}
        </div>
    );
}

// Badge unlock notification
interface BadgeUnlockProps {
    badge: Badge;
    onClose: () => void;
}

export function BadgeUnlockNotification({ badge, onClose }: BadgeUnlockProps) {
    const rarityGradient = getRarityGradient(badge.rarity);
    const rarityColor = getRarityColor(badge.rarity);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-8 right-8 z-50"
        >
            <div
                className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl max-w-sm"
                style={{ boxShadow: `0 0 40px ${rarityColor}40` }}
            >
                <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">🎉 Badge Unlocked!</p>

                    <motion.div
                        initial={{ rotate: -10, scale: 0.5 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="flex justify-center mb-4"
                    >
                        <div
                            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${rarityGradient} 
                                      flex items-center justify-center text-4xl shadow-xl`}
                        >
                            {badge.icon}
                        </div>
                    </motion.div>

                    <h3 className="text-xl font-bold text-white mb-1">{badge.name}</h3>
                    <p
                        className="text-sm font-medium capitalize mb-2"
                        style={{ color: rarityColor }}
                    >
                        {badge.rarity}
                    </p>
                    <p className="text-gray-400 text-sm">{badge.description}</p>

                    <button
                        onClick={onClose}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                                 rounded-lg font-medium text-white hover:opacity-90"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// Add shimmer animation to global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer { animation: shimmer 2s infinite; }
