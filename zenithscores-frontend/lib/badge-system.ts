'use client';

// ========================
// BADGE SYSTEM DEFINITIONS
// ========================

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'career' | 'achievement' | 'milestone' | 'community' | 'special';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    requirement?: string;
}

// Career Path Badges
export const CAREER_BADGES: Badge[] = [
    // Market Analyst
    {
        id: 'market-analyst-novice',
        name: 'Junior Analyst',
        description: 'Completed Market Analyst calibration',
        icon: '📊',
        category: 'career',
        rarity: 'common',
        requirement: 'Complete Market Analyst path calibration'
    },
    {
        id: 'market-analyst-pro',
        name: 'Senior Analyst',
        description: 'Mastered all Market Analyst modules',
        icon: '📈',
        category: 'career',
        rarity: 'rare',
        requirement: 'Complete all 4 Market Analyst modules with 80%+ quiz scores'
    },
    {
        id: 'valuation-wizard',
        name: 'Valuation Wizard',
        description: 'DCF master with perfect valuation scores',
        icon: '💰',
        category: 'career',
        rarity: 'epic',
        requirement: 'Score 100% on Valuation 101 quizzes'
    },

    // Data/Research
    {
        id: 'data-scientist-novice',
        name: 'Data Apprentice',
        description: 'Started the Data/Research path',
        icon: '🔬',
        category: 'career',
        rarity: 'common',
        requirement: 'Complete Data/Research path calibration'
    },
    {
        id: 'quant-researcher',
        name: 'Quant Researcher',
        description: 'Mastered statistical trading methods',
        icon: '🧮',
        category: 'career',
        rarity: 'rare',
        requirement: 'Complete all 4 Data/Research modules with 80%+ quiz scores'
    },
    {
        id: 'backtest-king',
        name: 'Backtest King',
        description: 'Proven ability to build robust strategies',
        icon: '🐍',
        category: 'career',
        rarity: 'epic',
        requirement: 'Complete Backtesting module with perfect score'
    },

    // Systematic Trading
    {
        id: 'systematic-starter',
        name: 'System Builder',
        description: 'Began systematic trading journey',
        icon: '⚙️',
        category: 'career',
        rarity: 'common',
        requirement: 'Complete Systematic Trading path calibration'
    },
    {
        id: 'algo-trader',
        name: 'Algo Trader',
        description: 'Mastered systematic trading principles',
        icon: '🤖',
        category: 'career',
        rarity: 'rare',
        requirement: 'Complete all 4 Systematic Trading modules with 80%+ quiz scores'
    },

    // Execution Trader
    {
        id: 'execution-rookie',
        name: 'Execution Rookie',
        description: 'Started execution trading path',
        icon: '🎯',
        category: 'career',
        rarity: 'common',
        requirement: 'Complete Execution Trader path calibration'
    },
    {
        id: 'order-flow-master',
        name: 'Order Flow Master',
        description: 'Expert in reading market microstructure',
        icon: '📋',
        category: 'career',
        rarity: 'rare',
        requirement: 'Complete all 4 Execution Trader modules with 80%+ quiz scores'
    },

    // Macro Observer
    {
        id: 'macro-watcher',
        name: 'Macro Watcher',
        description: 'Started macro analysis journey',
        icon: '🌍',
        category: 'career',
        rarity: 'common',
        requirement: 'Complete Macro Observer path calibration'
    },
    {
        id: 'global-strategist',
        name: 'Global Strategist',
        description: 'Mastered macroeconomic analysis',
        icon: '🏛️',
        category: 'career',
        rarity: 'rare',
        requirement: 'Complete all 4 Macro Observer modules with 80%+ quiz scores'
    }
];

// Achievement Badges
export const ACHIEVEMENT_BADGES: Badge[] = [
    {
        id: 'first-trade',
        name: 'First Trade',
        description: 'Executed your first paper trade',
        icon: '🚀',
        category: 'achievement',
        rarity: 'common'
    },
    {
        id: 'winning-streak-5',
        name: 'Hot Hand',
        description: '5 winning trades in a row',
        icon: '🔥',
        category: 'achievement',
        rarity: 'uncommon'
    },
    {
        id: 'winning-streak-10',
        name: 'Unstoppable',
        description: '10 winning trades in a row',
        icon: '⚡',
        category: 'achievement',
        rarity: 'rare'
    },
    {
        id: 'portfolio-10k',
        name: 'Ten Grand',
        description: 'Grew portfolio to $10,000',
        icon: '💵',
        category: 'achievement',
        rarity: 'common'
    },
    {
        id: 'portfolio-50k',
        name: 'Fifty Stack',
        description: 'Grew portfolio to $50,000',
        icon: '💰',
        category: 'achievement',
        rarity: 'uncommon'
    },
    {
        id: 'portfolio-100k',
        name: 'Six Figures',
        description: 'Grew portfolio to $100,000',
        icon: '🏆',
        category: 'achievement',
        rarity: 'rare'
    },
    {
        id: 'portfolio-1m',
        name: 'Millionaire',
        description: 'Paper trading millionaire',
        icon: '👑',
        category: 'achievement',
        rarity: 'legendary'
    },
    {
        id: 'risk-manager',
        name: 'Risk Manager',
        description: 'Never lost more than 2% on a single trade',
        icon: '🛡️',
        category: 'achievement',
        rarity: 'rare'
    },
    {
        id: 'diversified',
        name: 'Diversified',
        description: 'Held 5+ different assets simultaneously',
        icon: '🎯',
        category: 'achievement',
        rarity: 'uncommon'
    }
];

// Milestone Badges
export const MILESTONE_BADGES: Badge[] = [
    {
        id: 'trades-10',
        name: 'Getting Started',
        description: 'Completed 10 trades',
        icon: '📈',
        category: 'milestone',
        rarity: 'common'
    },
    {
        id: 'trades-50',
        name: 'Active Trader',
        description: 'Completed 50 trades',
        icon: '📊',
        category: 'milestone',
        rarity: 'uncommon'
    },
    {
        id: 'trades-100',
        name: 'Veteran Trader',
        description: 'Completed 100 trades',
        icon: '🎖️',
        category: 'milestone',
        rarity: 'rare'
    },
    {
        id: 'trades-500',
        name: 'Trading Legend',
        description: 'Completed 500 trades',
        icon: '🏅',
        category: 'milestone',
        rarity: 'epic'
    },
    {
        id: 'week-streak-4',
        name: 'Monthly Trader',
        description: 'Active for 4 weeks straight',
        icon: '📅',
        category: 'milestone',
        rarity: 'uncommon'
    },
    {
        id: 'week-streak-12',
        name: 'Quarterly Warrior',
        description: 'Active for 12 weeks straight',
        icon: '🗓️',
        category: 'milestone',
        rarity: 'rare'
    }
];

// Community Badges
export const COMMUNITY_BADGES: Badge[] = [
    {
        id: 'first-post',
        name: 'Voice Heard',
        description: 'Made your first community post',
        icon: '💬',
        category: 'community',
        rarity: 'common'
    },
    {
        id: 'helpful-10',
        name: 'Helpful',
        description: 'Received 10 likes on your posts',
        icon: '❤️',
        category: 'community',
        rarity: 'uncommon'
    },
    {
        id: 'influencer-100',
        name: 'Influencer',
        description: 'Received 100 likes on your posts',
        icon: '⭐',
        category: 'community',
        rarity: 'rare'
    },
    {
        id: 'followers-10',
        name: 'Rising Star',
        description: '10 people following you',
        icon: '🌟',
        category: 'community',
        rarity: 'uncommon'
    },
    {
        id: 'followers-50',
        name: 'Community Leader',
        description: '50 people following you',
        icon: '👥',
        category: 'community',
        rarity: 'rare'
    },
    {
        id: 'shared-trade-winner',
        name: 'Called It',
        description: 'Shared a trade that hit 20%+ profit',
        icon: '📢',
        category: 'community',
        rarity: 'rare'
    }
];

// Special Badges
export const SPECIAL_BADGES: Badge[] = [
    {
        id: 'early-adopter',
        name: 'Early Adopter',
        description: 'Joined during beta',
        icon: '🌅',
        category: 'special',
        rarity: 'epic'
    },
    {
        id: 'premium-member',
        name: 'Premium',
        description: 'Zenith Premium subscriber',
        icon: '💎',
        category: 'special',
        rarity: 'rare'
    },
    {
        id: 'completionist',
        name: 'Completionist',
        description: 'Completed all learning paths',
        icon: '🏆',
        category: 'special',
        rarity: 'legendary'
    },
    {
        id: 'perfect-calibration',
        name: 'Self-Aware',
        description: 'Achieved 90%+ calibration confidence',
        icon: '🎯',
        category: 'special',
        rarity: 'epic'
    }
];

// All badges combined
export const ALL_BADGES: Badge[] = [
    ...CAREER_BADGES,
    ...ACHIEVEMENT_BADGES,
    ...MILESTONE_BADGES,
    ...COMMUNITY_BADGES,
    ...SPECIAL_BADGES
];

// Get badge by ID
export function getBadgeById(id: string): Badge | undefined {
    return ALL_BADGES.find(b => b.id === id);
}

// Get badges by category
export function getBadgesByCategory(category: Badge['category']): Badge[] {
    return ALL_BADGES.filter(b => b.category === category);
}

// Get rarity color
export function getRarityColor(rarity: Badge['rarity']): string {
    const colors: Record<Badge['rarity'], string> = {
        common: '#9CA3AF',
        uncommon: '#10B981',
        rare: '#3B82F6',
        epic: '#8B5CF6',
        legendary: '#F59E0B'
    };
    return colors[rarity];
}

// Get rarity gradient
export function getRarityGradient(rarity: Badge['rarity']): string {
    const gradients: Record<Badge['rarity'], string> = {
        common: 'from-gray-400 to-gray-600',
        uncommon: 'from-emerald-400 to-emerald-600',
        rare: 'from-blue-400 to-blue-600',
        epic: 'from-purple-400 to-purple-600',
        legendary: 'from-amber-400 to-orange-500'
    };
    return gradients[rarity];
}
