/**
 * Trading Coach - Discipline Score & XP System
 * Core logic for the trading coach behavior engine
 */

// ===== TYPES =====
export interface TradeSession {
    id: string;
    userId: string;
    sessionId: string;
    trades: Trade[];
    analysisResult?: CoachAnalysis;
    createdAt: Date;
    analyzedAt?: Date;
}

export interface Trade {
    id: string;
    asset: string;
    type: 'long' | 'short';
    entry: number;
    exit?: number;
    positionSize: number;
    stopLoss?: number;
    takeProfit?: number;
    result?: 'win' | 'loss' | 'breakeven' | 'open';
    pnlPercent?: number;
    timestamp: Date;
    closedAt?: Date;
}

export interface CoachAnalysis {
    mode: 'brutal' | 'calm' | 'warning';
    message: string;
    lesson: string;
    disciplineScore: number;
    xpGained: number;
    violations: string[];
    praises: string[];
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface UserCoachStats {
    totalXp: number;
    currentRank: Rank;
    disciplineScore: number;
    currentStreak: number;
    bestStreak: number;
    tradesAnalyzed: number;
    avgGrade: string;
    topAsset: string | null;
    coachMemory: CoachMemoryItem[];
}

export interface CoachMemoryItem {
    type: 'warning' | 'praise' | 'pattern';
    message: string;
    timestamp: Date;
}

export type Rank = 'Rookie' | 'Disciplined' | 'Operator' | 'Sharpshooter' | 'Apex';

// ===== CONSTANTS =====
export const RANKS: { name: Rank; xpRequired: number; color: string }[] = [
    { name: 'Rookie', xpRequired: 0, color: '#6B7280' },
    { name: 'Disciplined', xpRequired: 300, color: '#10B981' },
    { name: 'Operator', xpRequired: 800, color: '#3B82F6' },
    { name: 'Sharpshooter', xpRequired: 1500, color: '#8B5CF6' },
    { name: 'Apex', xpRequired: 3000, color: '#F59E0B' }
];

export const DISCIPLINE_PENALTIES = {
    stopLossIgnored: -25,
    revengeTrade: -20,
    noStopLossSet: -20,
    oversizedRisk: -15,
    overtrading: -10
};

export const DISCIPLINE_REWARDS = {
    stopLossRespected: 5,
    riskControlled: 5,
    calmLoss: 5,
    walkedAway: 10
};

export const XP_GAINS = {
    sessionAnalyzed: 20,
    highDiscipline: 15,    // discipline >= 80
    stopLossRespected: 10,
    revengeAvoided: 10,
    smallWin: 5            // 0.5-1% gain
};

// ===== FUNCTIONS =====

export function getRankFromXp(xp: number): Rank {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].xpRequired) {
            return RANKS[i].name;
        }
    }
    return 'Rookie';
}

export function getRankColor(rank: Rank): string {
    return RANKS.find(r => r.name === rank)?.color || '#6B7280';
}

export function getNextRank(currentXp: number): { rank: Rank; xpNeeded: number } | null {
    const current = getRankFromXp(currentXp);
    const currentIndex = RANKS.findIndex(r => r.name === current);
    if (currentIndex >= RANKS.length - 1) return null;

    const next = RANKS[currentIndex + 1];
    return {
        rank: next.name,
        xpNeeded: next.xpRequired - currentXp
    };
}

export function calculateDisciplineScore(
    trades: Trade[],
    previousScore: number = 100
): { score: number; violations: string[]; praises: string[] } {
    let score = previousScore;
    const violations: string[] = [];
    const praises: string[] = [];

    for (const trade of trades) {
        // Check for stop-loss violations
        if (!trade.stopLoss) {
            score += DISCIPLINE_PENALTIES.noStopLossSet;
            violations.push('No stop-loss set');
        } else if (trade.result === 'loss' && trade.exit) {
            // Check if exited below stop-loss (ignored it)
            if (trade.type === 'long' && trade.exit < trade.stopLoss) {
                score += DISCIPLINE_PENALTIES.stopLossIgnored;
                violations.push('Stop-loss ignored');
            } else if (trade.type === 'short' && trade.exit > trade.stopLoss) {
                score += DISCIPLINE_PENALTIES.stopLossIgnored;
                violations.push('Stop-loss ignored');
            } else {
                score += DISCIPLINE_REWARDS.stopLossRespected;
                praises.push('Stop-loss respected');
            }
        }

        // Check for oversized risk (> 5% of typical position)
        if (trade.positionSize > 5) {
            score += DISCIPLINE_PENALTIES.oversizedRisk;
            violations.push('Position size too large');
        } else {
            score += DISCIPLINE_REWARDS.riskControlled;
            praises.push('Risk controlled');
        }
    }

    // Check for overtrading (> 5 trades in session)
    if (trades.length > 5) {
        score += DISCIPLINE_PENALTIES.overtrading;
        violations.push('Overtrading detected');
    }

    // Detect revenge trading (loss followed by trade within 10 min)
    for (let i = 1; i < trades.length; i++) {
        const prev = trades[i - 1];
        const curr = trades[i];
        if (prev.result === 'loss' && prev.closedAt && curr.timestamp) {
            const timeDiff = (curr.timestamp.getTime() - prev.closedAt.getTime()) / 60000;
            if (timeDiff < 10) {
                score += DISCIPLINE_PENALTIES.revengeTrade;
                violations.push('Revenge trading detected');
            }
        }
    }

    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, score));

    return { score, violations, praises };
}

export function calculateXpGain(
    trades: Trade[],
    disciplineScore: number
): number {
    let xp = XP_GAINS.sessionAnalyzed;

    if (disciplineScore >= 80) {
        xp += XP_GAINS.highDiscipline;
    }

    const hasStopLossRespected = trades.some(t =>
        t.stopLoss && t.result !== 'open' && !(
            (t.type === 'long' && t.exit && t.exit < t.stopLoss) ||
            (t.type === 'short' && t.exit && t.exit > t.stopLoss)
        )
    );
    if (hasStopLossRespected) {
        xp += XP_GAINS.stopLossRespected;
    }

    // Small wins
    const smallWins = trades.filter(t =>
        t.pnlPercent && t.pnlPercent >= 0.5 && t.pnlPercent <= 1.0
    );
    xp += smallWins.length * XP_GAINS.smallWin;

    return xp;
}

export function getCoachMode(disciplineScore: number, hasViolations: boolean): 'brutal' | 'calm' | 'warning' {
    if (hasViolations) return 'warning';
    if (disciplineScore >= 85) return 'calm';
    return 'brutal';
}

export function getGrade(disciplineScore: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (disciplineScore >= 90) return 'A';
    if (disciplineScore >= 80) return 'B';
    if (disciplineScore >= 70) return 'C';
    if (disciplineScore >= 60) return 'D';
    return 'F';
}

// ===== COACH PROMPTS =====
export const COACH_PROMPTS = {
    brutal: `You are a professional trading coach with a brutal, no-nonsense tone.
You judge decisions, not outcomes.
You call out emotional trading, rule-breaking, and ego.
You reward discipline even on small wins.
You never give financial advice.
You never mention being an AI.
You speak in short, sharp feedback.

Focus on:
- Stop-loss discipline
- Risk consistency
- Emotional control
- Repetition of mistakes

Keep response under 100 words. End with one clear lesson.`,

    calm: `You are a calm, professional trading mentor.
You reinforce good habits and consistency.
You avoid hype and ego.
You focus on process over profit.
You speak clearly and concisely.
You never give financial advice.
You never mention being an AI.

Keep response under 80 words. End with one reinforcement statement.`,

    warning: `You are a strict risk manager.
You warn the trader clearly and firmly.
You highlight danger patterns.
You discourage immediate re-entry.
You never give financial advice.
You never mention being an AI.

Keep response under 80 words. End with a warning sentence.`
};

// Format trade summary for AI prompt
export function formatTradesSummary(trades: Trade[], disciplineScore: number): string {
    const winCount = trades.filter(t => t.result === 'win').length;
    const lossCount = trades.filter(t => t.result === 'loss').length;
    const winRate = trades.length > 0 ? Math.round((winCount / trades.length) * 100) : 0;

    const avgPnl = trades
        .filter(t => t.pnlPercent !== undefined)
        .reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / (trades.length || 1);

    const hasStopLossViolation = trades.some(t => !t.stopLoss);
    const hasOvertrading = trades.length > 5;

    return `User executed ${trades.length} trade(s).
Win rate: ${winRate}%
Average P&L: ${avgPnl >= 0 ? '+' : ''}${avgPnl.toFixed(2)}%
Discipline score: ${disciplineScore}/100
Stop-loss violations: ${hasStopLossViolation ? 'Yes' : 'No'}
Overtrading: ${hasOvertrading ? 'Yes' : 'No'}
Provide brief, sharp feedback in your assigned tone.`;
}
