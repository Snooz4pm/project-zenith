/**
 * 🔥 3-HOUR PULSE ENGINE
 * Creates ritual engagement with users checking every 3 hours
 */

export interface PulseData {
    timestamp: Date;
    nextPulse: Date;
    timeUntilNext: string;
    marketMood: 'risk-on' | 'risk-off' | 'neutral';
    hotAssets: { symbol: string; score: number; change: number }[];
    coldAssets: { symbol: string; score: number; change: number }[];
    yourEdge: string;
    tradingBias: string;
    alertLevel: 'calm' | 'active' | 'volatile';
    missedOpportunities?: { symbol: string; move: string }[];
}

export interface UserStreak {
    currentStreak: number;
    longestStreak: number;
    lastCheckIn: Date | null;
    xp: number;
    level: number;
    nextLevelXp: number;
    dailyQuests: Quest[];
    achievements: Achievement[];
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    xpReward: number;
    completed: boolean;
    type: 'daily' | 'weekly';
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date | null;
}

export interface Prediction {
    id: string;
    userId: string;
    symbol: string;
    direction: 'up' | 'down';
    targetPercent: number;
    timeframe: '3h' | '24h' | '7d';
    createdAt: Date;
    expiresAt: Date;
    result: 'pending' | 'correct' | 'wrong' | null;
    actualMove?: number;
}

// ═══════════════════════════════════════════════════════
// 3-HOUR PULSE GENERATION
// ═══════════════════════════════════════════════════════

const MARKET_MOODS = [
    { mood: 'risk-on' as const, messages: ['Bulls in control', 'Momentum building', 'Breakout conditions'] },
    { mood: 'risk-off' as const, messages: ['Defensive positioning', 'Volatility rising', 'Caution advised'] },
    { mood: 'neutral' as const, messages: ['Range-bound action', 'Waiting for catalyst', 'Mixed signals'] },
];

const EDGE_MESSAGES = [
    'Volume surging in tech sector — watch for breakouts',
    'Smart money accumulating mid-caps quietly',
    'Unusual options activity in crypto derivatives',
    'Institutions rotating into defensive plays',
    'Retail FOMO building — contrarian alert',
    'Correlation breakdown spotted — pair trade opportunity',
    'Momentum divergence on multiple timeframes',
    'Liquidity thin — volatility spike incoming',
];

const TRADING_BIASES = [
    { bias: 'Favor longs in high-score assets', condition: (score: number) => score > 75 },
    { bias: 'Wait for pullbacks before entry', condition: (score: number) => score > 60 },
    { bias: 'Avoid new positions — consolidation phase', condition: (score: number) => score < 50 },
    { bias: 'Look for mean reversion plays', condition: (score: number) => score < 40 },
];

export function generatePulseData(assets: { symbol: string; score: number; change: number }[]): PulseData {
    const now = new Date();

    // Calculate next 3-hour pulse (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
    const currentHour = now.getHours();
    const nextPulseHour = Math.ceil((currentHour + 1) / 3) * 3;
    const nextPulse = new Date(now);
    nextPulse.setHours(nextPulseHour % 24, 0, 0, 0);
    if (nextPulseHour >= 24) nextPulse.setDate(nextPulse.getDate() + 1);

    const msUntilNext = nextPulse.getTime() - now.getTime();
    const hoursUntil = Math.floor(msUntilNext / (1000 * 60 * 60));
    const minsUntil = Math.floor((msUntilNext % (1000 * 60 * 60)) / (1000 * 60));

    // Determine market mood from average score
    const avgScore = assets.length > 0
        ? assets.reduce((sum, a) => sum + a.score, 0) / assets.length
        : 50;

    const marketMood = avgScore > 65 ? 'risk-on' : avgScore < 45 ? 'risk-off' : 'neutral';
    const moodData = MARKET_MOODS.find(m => m.mood === marketMood)!;

    // Sort assets by score
    const sorted = [...assets].sort((a, b) => b.score - a.score);
    const hotAssets = sorted.slice(0, 3);
    const coldAssets = sorted.slice(-3).reverse();

    // Generate edge message
    const yourEdge = EDGE_MESSAGES[Math.floor(Math.random() * EDGE_MESSAGES.length)];

    // Trading bias based on conditions
    const tradingBias = avgScore > 70
        ? 'Favor longs in high-score assets'
        : avgScore > 50
            ? 'Wait for pullbacks before entry'
            : 'Avoid new positions — consolidation phase';

    // Alert level
    const volatility = assets.reduce((sum, a) => sum + Math.abs(a.change), 0) / assets.length;
    const alertLevel = volatility > 5 ? 'volatile' : volatility > 2 ? 'active' : 'calm';

    return {
        timestamp: now,
        nextPulse,
        timeUntilNext: `${hoursUntil}h ${minsUntil}m`,
        marketMood,
        hotAssets,
        coldAssets,
        yourEdge,
        tradingBias,
        alertLevel,
    };
}

// ═══════════════════════════════════════════════════════
// XP & STREAK SYSTEM
// ═══════════════════════════════════════════════════════

const XP_PER_LEVEL = 100;
const STREAK_XP_MULTIPLIER = 1.5;

const DAILY_QUESTS: Omit<Quest, 'progress' | 'completed'>[] = [
    { id: 'check-pulse', title: 'Check the Pulse', description: 'View the 3-hour market pulse', target: 1, xpReward: 10, type: 'daily' },
    { id: 'review-trades', title: 'Review Your Trades', description: 'Check your trade history', target: 1, xpReward: 15, type: 'daily' },
    { id: 'make-prediction', title: 'Price Prophet', description: 'Make 1 price prediction', target: 1, xpReward: 20, type: 'daily' },
    { id: 'check-3-times', title: 'Triple Check', description: 'Check ZenithScores 3 times today', target: 3, xpReward: 30, type: 'daily' },
];

const ACHIEVEMENTS: Achievement[] = [
    { id: '7-day-streak', title: 'Week Warrior', description: '7-day check-in streak', icon: '🔥', unlockedAt: null },
    { id: '30-day-streak', title: 'Monthly Master', description: '30-day check-in streak', icon: '👑', unlockedAt: null },
    { id: 'first-prediction', title: 'Fortune Teller', description: 'Make your first prediction', icon: '🔮', unlockedAt: null },
    { id: 'perfect-week', title: 'Perfect Week', description: '5 correct predictions in a week', icon: '💎', unlockedAt: null },
    { id: 'level-10', title: 'Rising Star', description: 'Reach level 10', icon: '⭐', unlockedAt: null },
    { id: 'level-25', title: 'Market Veteran', description: 'Reach level 25', icon: '🏆', unlockedAt: null },
];

export function calculateLevel(xp: number): { level: number; nextLevelXp: number; progress: number } {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = xp % XP_PER_LEVEL;
    const progress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

    return {
        level,
        nextLevelXp: XP_PER_LEVEL - xpInCurrentLevel,
        progress,
    };
}

export function getStreakXpBonus(streak: number): number {
    if (streak >= 30) return 50;
    if (streak >= 14) return 30;
    if (streak >= 7) return 20;
    if (streak >= 3) return 10;
    return 0;
}

export function initializeUserStreak(): UserStreak {
    const quests = DAILY_QUESTS.map(q => ({ ...q, progress: 0, completed: false }));
    const levelData = calculateLevel(0);

    return {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckIn: null,
        xp: 0,
        level: levelData.level,
        nextLevelXp: levelData.nextLevelXp,
        dailyQuests: quests,
        achievements: [...ACHIEVEMENTS],
    };
}

export function checkIn(streak: UserStreak): UserStreak {
    const now = new Date();
    const lastCheckIn = streak.lastCheckIn;

    let newStreak = streak.currentStreak;
    let xpEarned = 5; // Base check-in XP

    if (lastCheckIn) {
        const hoursSinceLastCheckIn = (now.getTime() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastCheckIn >= 24 && hoursSinceLastCheckIn < 48) {
            // Streak continues (checked in yesterday)
            newStreak += 1;
            xpEarned += getStreakXpBonus(newStreak);
        } else if (hoursSinceLastCheckIn >= 48) {
            // Streak broken
            newStreak = 1;
        }
        // If < 24 hours, streak stays same (already checked in today)
    } else {
        newStreak = 1;
    }

    const newXp = streak.xp + xpEarned;
    const levelData = calculateLevel(newXp);

    // Check achievements
    const achievements = streak.achievements.map(a => {
        if (a.unlockedAt) return a;

        if (a.id === '7-day-streak' && newStreak >= 7) return { ...a, unlockedAt: now };
        if (a.id === '30-day-streak' && newStreak >= 30) return { ...a, unlockedAt: now };
        if (a.id === 'level-10' && levelData.level >= 10) return { ...a, unlockedAt: now };
        if (a.id === 'level-25' && levelData.level >= 25) return { ...a, unlockedAt: now };

        return a;
    });

    return {
        ...streak,
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastCheckIn: now,
        xp: newXp,
        level: levelData.level,
        nextLevelXp: levelData.nextLevelXp,
        achievements,
    };
}

// ═══════════════════════════════════════════════════════
// PREDICTION SYSTEM
// ═══════════════════════════════════════════════════════

export function createPrediction(
    userId: string,
    symbol: string,
    direction: 'up' | 'down',
    timeframe: '3h' | '24h' | '7d'
): Prediction {
    const now = new Date();
    const expiresAt = new Date(now);

    switch (timeframe) {
        case '3h': expiresAt.setHours(expiresAt.getHours() + 3); break;
        case '24h': expiresAt.setDate(expiresAt.getDate() + 1); break;
        case '7d': expiresAt.setDate(expiresAt.getDate() + 7); break;
    }

    return {
        id: `pred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        symbol,
        direction,
        targetPercent: direction === 'up' ? 2 : -2,
        timeframe,
        createdAt: now,
        expiresAt,
        result: 'pending',
    };
}

export function evaluatePrediction(prediction: Prediction, currentPrice: number, entryPrice: number): Prediction {
    const actualMove = ((currentPrice - entryPrice) / entryPrice) * 100;
    const directionCorrect =
        (prediction.direction === 'up' && actualMove > 0) ||
        (prediction.direction === 'down' && actualMove < 0);

    return {
        ...prediction,
        result: directionCorrect ? 'correct' : 'wrong',
        actualMove,
    };
}
