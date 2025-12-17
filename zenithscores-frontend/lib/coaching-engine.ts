/**
 * 🧠 TRADING COACH ENGINE
 * Generates actionable feedback for trades
 */

export interface Trade {
    id: number;
    symbol: string;
    trade_type: 'buy' | 'sell';
    quantity: number;
    price_at_execution: number;
    realized_pnl: number;
    executed_at: string;
    leverage: number;
    asset_name?: string;
}

export interface TradeFeedback {
    tradeId: number;
    symbol: string;
    result: 'win' | 'loss' | 'breakeven';
    pnl: number;
    pnlPercent: number;
    message: string;
    suggestions: string[];
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    emoji: string;
}

export interface WeeklySummary {
    period: string;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnl: number;
    bestTrade: { symbol: string; pnl: number } | null;
    worstTrade: { symbol: string; pnl: number } | null;
    patterns: string[];
    lessons: string[];
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// ═══════════════════════════════════════════════════════
// FEEDBACK GENERATION
// ═══════════════════════════════════════════════════════

const WIN_MESSAGES = [
    { condition: (pnlPct: number) => pnlPct > 10, message: "Excellent trade! You caught a major move.", grade: 'A' as const },
    { condition: (pnlPct: number) => pnlPct > 5, message: "Solid execution. Good risk-to-reward.", grade: 'A' as const },
    { condition: (pnlPct: number) => pnlPct > 2, message: "Nice profit. Consistency is key.", grade: 'B' as const },
    { condition: (pnlPct: number) => pnlPct > 0, message: "Small win. Consider holding winners longer.", grade: 'C' as const },
];

const LOSS_MESSAGES = [
    { condition: (pnlPct: number) => pnlPct < -10, message: "Large loss. Consider smaller position sizes.", grade: 'F' as const },
    { condition: (pnlPct: number) => pnlPct < -5, message: "Significant loss. Review your stop-loss strategy.", grade: 'D' as const },
    { condition: (pnlPct: number) => pnlPct < -2, message: "Controlled loss. Good risk management.", grade: 'C' as const },
    { condition: (pnlPct: number) => pnlPct < 0, message: "Minimal loss. Well-managed exit.", grade: 'B' as const },
];

const WIN_SUGGESTIONS = [
    "Document what worked — repeat winning setups",
    "Consider scaling into future similar setups",
    "Review if you could have held longer",
    "Check if momentum aligned with your entry",
];

const LOSS_SUGGESTIONS = [
    "Review entry timing — was there confirmation?",
    "Smaller position sizes reduce emotional pressure",
    "Wait for trend alignment before entering",
    "Consider tighter stop-loss on volatile assets",
    "Avoid trading against the prevailing trend",
];

export function generateTradeFeedback(trade: Trade): TradeFeedback {
    const pnl = trade.realized_pnl;
    const pnlPercent = (pnl / (trade.price_at_execution * trade.quantity)) * 100;

    const result = pnl > 0.01 ? 'win' : pnl < -0.01 ? 'loss' : 'breakeven';

    let message = "Trade completed.";
    let grade: TradeFeedback['grade'] = 'C';
    let emoji = '🔄';

    if (result === 'win') {
        emoji = pnlPercent > 5 ? '🚀' : '✅';
        const match = WIN_MESSAGES.find(m => m.condition(pnlPercent));
        if (match) {
            message = match.message;
            grade = match.grade;
        }
    } else if (result === 'loss') {
        emoji = pnlPercent < -5 ? '💔' : '⚠️';
        const match = LOSS_MESSAGES.find(m => m.condition(pnlPercent));
        if (match) {
            message = match.message;
            grade = match.grade;
        }
    }

    // Generate suggestions based on result
    const suggestions = result === 'win'
        ? WIN_SUGGESTIONS.slice(0, 2)
        : LOSS_SUGGESTIONS.slice(0, 3);

    // Add leverage-specific feedback
    if (trade.leverage > 2 && result === 'loss') {
        suggestions.unshift("High leverage amplified losses — consider reducing leverage");
    }

    return {
        tradeId: trade.id,
        symbol: trade.symbol,
        result,
        pnl,
        pnlPercent,
        message,
        suggestions,
        grade,
        emoji,
    };
}

// ═══════════════════════════════════════════════════════
// WEEKLY SUMMARY GENERATION
// ═══════════════════════════════════════════════════════

export function generateWeeklySummary(trades: Trade[]): WeeklySummary {
    const wins = trades.filter(t => t.realized_pnl > 0.01);
    const losses = trades.filter(t => t.realized_pnl < -0.01);
    const totalPnl = trades.reduce((sum, t) => sum + t.realized_pnl, 0);

    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

    // Find best and worst trades
    const sortedByPnl = [...trades].sort((a, b) => b.realized_pnl - a.realized_pnl);
    const bestTrade = sortedByPnl[0] ? { symbol: sortedByPnl[0].symbol, pnl: sortedByPnl[0].realized_pnl } : null;
    const worstTrade = sortedByPnl[sortedByPnl.length - 1] ?
        { symbol: sortedByPnl[sortedByPnl.length - 1].symbol, pnl: sortedByPnl[sortedByPnl.length - 1].realized_pnl } : null;

    // Pattern detection
    const patterns: string[] = [];
    const lessons: string[] = [];

    // Check for overtrading
    if (trades.length > 20) {
        patterns.push("High trade frequency this week");
        lessons.push("Consider being more selective with entries");
    }

    // Check win streak / loss streak
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    for (const trade of trades) {
        if (trade.realized_pnl > 0) {
            currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
            maxWinStreak = Math.max(maxWinStreak, currentStreak);
        } else if (trade.realized_pnl < 0) {
            currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
            maxLossStreak = Math.max(maxLossStreak, Math.abs(currentStreak));
        }
    }

    if (maxWinStreak >= 3) patterns.push(`${maxWinStreak}-trade winning streak 🔥`);
    if (maxLossStreak >= 3) {
        patterns.push(`${maxLossStreak}-trade losing streak`);
        lessons.push("After 2 consecutive losses, take a break");
    }

    // Leverage analysis
    const highLeverageTrades = trades.filter(t => t.leverage > 2);
    if (highLeverageTrades.length > trades.length / 2) {
        patterns.push("Heavy use of leverage");
        lessons.push("Consider reducing leverage to manage risk");
    }

    // Win rate feedback
    if (winRate >= 60) {
        lessons.push("Strong win rate — focus on position sizing for bigger wins");
    } else if (winRate < 40 && trades.length >= 5) {
        lessons.push("Low win rate — review entry criteria and wait for better setups");
    }

    // Overall grade
    let overallGrade: WeeklySummary['overallGrade'] = 'C';
    if (winRate >= 70 && totalPnl > 0) overallGrade = 'A';
    else if (winRate >= 55 && totalPnl > 0) overallGrade = 'B';
    else if (winRate >= 45 || totalPnl > 0) overallGrade = 'C';
    else if (winRate >= 30) overallGrade = 'D';
    else overallGrade = 'F';

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
        period: `${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`,
        totalTrades: trades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round(winRate),
        totalPnl,
        bestTrade,
        worstTrade,
        patterns,
        lessons,
        overallGrade,
    };
}
