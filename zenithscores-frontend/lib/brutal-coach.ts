/**
 * 🤖 BRUTAL AI COACH ENGINE
 * The "Brutal Honesty" personality that roasts bad trades
 * and celebrates good ones with tough love
 */

export interface TradeAnalysis {
    tradeId: string;
    symbol: string;
    direction: 'long' | 'short';
    entryPrice: number;
    exitPrice: number;
    pnlPercent: number;
    holdDuration: number; // minutes
    leverage: number;
    wasStop: boolean;
    wasTP: boolean;
}

export interface CoachResponse {
    verdict: 'win' | 'loss' | 'breakeven';
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
    roast: string;
    lesson: string;
    xpEarned: number;
    badge?: string;
    cooldownMinutes?: number; // Revoke trading if too tilted
    mistakeType?: MistakeType;
}

export type MistakeType =
    | 'paper_hands'      // Sold winner too early
    | 'diamond_hands'    // Held loser too long
    | 'revenge_trade'    // Traded immediately after loss
    | 'overleveraged'    // Too much leverage
    | 'fomo_entry'       // Chased a pump
    | 'no_stop_loss'     // No risk management
    | 'overtrading'      // Too many trades
    | 'night_trading'    // Trading at bad hours
    | 'none';

// ═══════════════════════════════════════════════════════
// THE BRUTAL COACH SYSTEM PROMPT
// ═══════════════════════════════════════════════════════

export const BRUTAL_COACH_PERSONA = `
You are the Zenith Trading Coach — a brutally honest mentor who has seen thousands of traders blow up their accounts.

PERSONALITY:
- You're direct, sometimes harsh, but always constructive
- You use trading slang: "paper hands", "diamond hands", "FOMO", "rekt", "bagholder"
- You roast bad decisions but ALWAYS give actionable lessons
- You celebrate wins but remind them it could be luck
- You never sugarcoat — the market doesn't care about feelings

RULES:
1. Always identify the MISTAKE TYPE first
2. Roast the behavior, not the person
3. End every roast with a concrete lesson
4. If they're tilted, recommend a cooldown
5. Praise discipline more than profits

TONE EXAMPLES:
- Win: "Congrats, you didn't completely fumble the bag this time. +15% on BTC. But let's be real — did you have a plan, or did you just get lucky? Either way, book those profits and don't let FOMO drag you back in."

- Loss (Paper Hands): "You just sold a 12% winner for 2%. That's not trading, that's panic. You're so afraid of losing gains that you're leaving money on the table. Next time, set a trailing stop and walk away."

- Loss (Revenge Trade): "You lost $200 and immediately 5x leveraged into another trade? That's not strategy, that's a tantrum. Trading privileges revoked for 30 minutes. Go touch grass."

- Loss (FOMO): "You bought the top after a 40% pump. The whole market is laughing. Next time, if your heart is racing, it's already too late."
`;

// ═══════════════════════════════════════════════════════
// MISTAKE DETECTION
// ═══════════════════════════════════════════════════════

interface TradeHistory {
    symbol: string;
    pnl: number;
    timestamp: Date;
}

export function detectMistake(
    trade: TradeAnalysis,
    recentTrades: TradeHistory[]
): MistakeType {
    // Paper hands: Won but exited way too early (small gain on big move potential)
    if (trade.pnlPercent > 0 && trade.pnlPercent < 3 && trade.holdDuration < 30) {
        return 'paper_hands';
    }

    // Diamond hands / Bagholder: Held a loser too long
    if (trade.pnlPercent < -10 && trade.holdDuration > 120 && !trade.wasStop) {
        return 'diamond_hands';
    }

    // Revenge trade: Lost and traded again within 10 minutes
    const lastTrade = recentTrades[0];
    if (lastTrade && lastTrade.pnl < 0) {
        const timeSinceLast = (Date.now() - new Date(lastTrade.timestamp).getTime()) / 60000;
        if (timeSinceLast < 10) {
            return 'revenge_trade';
        }
    }

    // Overleveraged: Used 5x+ and lost
    if (trade.leverage >= 5 && trade.pnlPercent < 0) {
        return 'overleveraged';
    }

    // No stop loss on a big loss
    if (trade.pnlPercent < -5 && !trade.wasStop && !trade.wasTP) {
        return 'no_stop_loss';
    }

    // Overtrading: More than 10 trades in last 24 hours
    const last24h = recentTrades.filter(t =>
        (Date.now() - new Date(t.timestamp).getTime()) < 24 * 60 * 60 * 1000
    );
    if (last24h.length > 10) {
        return 'overtrading';
    }

    return 'none';
}

// ═══════════════════════════════════════════════════════
// ROAST GENERATION
// ═══════════════════════════════════════════════════════

const ROASTS: Record<MistakeType, string[]> = {
    paper_hands: [
        "You just \"paper handed\" a potential moonshot for pocket change. That's not profit-taking, that's fear.",
        "Congratulations on turning a winner into a footnote. You sold at +2% when it's pumping? The market thanks you for the free money.",
        "Classic panic seller. You'd sell Bitcoin at $1 because you needed lunch money.",
    ],
    diamond_hands: [
        "You held that bag like it was your firstborn. News flash: the market doesn't care about your denial.",
        "\"It'll come back\" — famous last words before every liquidation. Learn to cut losses.",
        "You turned a small loss into a crater because you couldn't accept being wrong. The ego is an expensive trading partner.",
    ],
    revenge_trade: [
        "You lost money and immediately threw more at the market? That's not trading, that's a tantrum.",
        "Revenge trading is how retail traders become statistics. Arena privileges revoked. Cool your head.",
        "You're trading angry. The market doesn't owe you anything. Step away before you make it worse.",
    ],
    overleveraged: [
        "5x leverage on a volatile asset? You weren't trading, you were gambling with matches in a gas station.",
        "Leverage is a tool, not a personality trait. You got rekt because you wanted to feel like a big shot.",
        "High leverage + low skill = inevitable liquidation. You're playing a game you can't win.",
    ],
    fomo_entry: [
        "You bought the top after everyone else already made money. Classic retail move.",
        "If your heart was racing when you clicked 'Buy', it was already too late.",
        "FOMO is not a strategy. It's a donation system from impatient traders to patient ones.",
    ],
    no_stop_loss: [
        "No stop loss? You're not a trader, you're a gambler with extra steps.",
        "Hope is not a trading strategy. A stop loss is. Learn the difference.",
        "You let a 5% loss become a 15% loss because you couldn't admit you were wrong. Classic.",
    ],
    overtrading: [
        "10+ trades in 24 hours? You're not trading, you're feeding the exchange fees.",
        "More trades don't equal more profits. You're just making your broker rich.",
        "Overtrading is a symptom of boredom, not strategy. Quality over quantity.",
    ],
    night_trading: [
        "3 AM trades are statistically dumber. Your brain is tired. Go to bed.",
        "Night owl trading: when emotional decisions meet low liquidity. Perfect storm for losses.",
        "The market will be here tomorrow. Your decision-making at 2 AM won't.",
    ],
    none: [],
};

const LESSONS: Record<MistakeType, string[]> = {
    paper_hands: [
        "Set a trailing stop-loss at 80% of peak gains. Let winners run.",
        "Write down your take-profit BEFORE entering. Stick to it.",
        "Fear of giving back gains is costing you bigger gains. Trust your thesis.",
    ],
    diamond_hands: [
        "A 5% loss is recoverable. A 30% loss requires a 43% gain to break even. Cut losses early.",
        "Your entry doesn't know your feelings. If the thesis is broken, exit.",
        "Set a max loss per trade (2% of portfolio). No exceptions.",
    ],
    revenge_trade: [
        "After any loss over 3%, take a mandatory 15-minute break. No exceptions.",
        "Log EVERY trade. Seeing revenge trades in writing is humbling.",
        "The market will wait. Your emotions won't think clearly right now.",
    ],
    overleveraged: [
        "Max leverage should be 3x until you have a 60%+ win rate. No exceptions.",
        "Only use leverage on high-conviction setups with clear invalidation points.",
        "Lower leverage = longer survival = more learning time = eventual profitability.",
    ],
    fomo_entry: [
        "If an asset is up 20%+ today, wait for a pullback. Chasers get burned.",
        "The next opportunity is always coming. Missing one trade doesn't matter.",
        "Set price alerts, not market buys. Patience beats impulsiveness.",
    ],
    no_stop_loss: [
        "Every trade needs a stop-loss. Period. Define your max loss before entering.",
        "Trading without stops is like driving without brakes. It works until it doesn't.",
        "Accept small losses as the cost of doing business. Avoid catastrophic ones.",
    ],
    overtrading: [
        "Set a max of 3 trades per day. Quality setups only.",
        "Calculate your commission costs. Are you trading or donating?",
        "Boredom is not a trading signal. Wait for A+ setups.",
    ],
    night_trading: [
        "No trades after 10 PM local time. Your brain needs rest.",
        "If you're trading to 'make back' losses, it's time for bed, not more trades.",
        "Set alerts for overnight moves. You don't have to be awake to catch them.",
    ],
    none: [],
};

const WIN_MESSAGES = [
    { condition: (pnl: number) => pnl > 20, message: "Now THAT'S a trade. +{pnl}%. You didn't panic, you didn't FOMO out, you rode the wave. Book those profits and don't get cocky.", grade: 'S' as const, xp: 100 },
    { condition: (pnl: number) => pnl > 10, message: "Solid execution. +{pnl}% isn't luck if you had a plan. Did you? Either way, well done. Now don't go blow it on the next trade.", grade: 'A' as const, xp: 75 },
    { condition: (pnl: number) => pnl > 5, message: "Respectable. +{pnl}% is better than 90% of retail traders made today. Consistency beats home runs.", grade: 'B' as const, xp: 50 },
    { condition: (pnl: number) => pnl > 0, message: "A win's a win. +{pnl}% — small, but you're building the habit. Don't let the next trade undo this.", grade: 'C' as const, xp: 25 },
];

export function generateCoachResponse(
    trade: TradeAnalysis,
    recentTrades: TradeHistory[]
): CoachResponse {
    const mistake = detectMistake(trade, recentTrades);
    const isWin = trade.pnlPercent > 0.5;
    const isLoss = trade.pnlPercent < -0.5;

    // WINNING TRADE
    if (isWin && mistake === 'none') {
        const winMsg = WIN_MESSAGES.find(m => m.condition(trade.pnlPercent)) || WIN_MESSAGES[3];
        return {
            verdict: 'win',
            grade: winMsg.grade,
            roast: winMsg.message.replace('{pnl}', trade.pnlPercent.toFixed(1)),
            lesson: "Keep doing this. Discipline + patience = profits.",
            xpEarned: winMsg.xp,
            badge: trade.pnlPercent > 15 ? 'moonshot' : undefined,
        };
    }

    // WINNING BUT WITH MISTAKE (Paper hands)
    if (isWin && mistake === 'paper_hands') {
        const roast = ROASTS.paper_hands[Math.floor(Math.random() * ROASTS.paper_hands.length)];
        const lesson = LESSONS.paper_hands[Math.floor(Math.random() * LESSONS.paper_hands.length)];
        return {
            verdict: 'win',
            grade: 'C',
            roast,
            lesson,
            xpEarned: 10,
            mistakeType: mistake,
        };
    }

    // LOSING TRADE WITH MISTAKE
    if (isLoss && mistake !== 'none') {
        const roast = ROASTS[mistake][Math.floor(Math.random() * ROASTS[mistake].length)];
        const lesson = LESSONS[mistake][Math.floor(Math.random() * LESSONS[mistake].length)];

        // Cooldown for revenge trading or overleveraged
        const cooldown = (mistake === 'revenge_trade' || mistake === 'overleveraged') ? 30 : undefined;

        return {
            verdict: 'loss',
            grade: 'D',
            roast,
            lesson,
            xpEarned: 0,
            cooldownMinutes: cooldown,
            mistakeType: mistake,
        };
    }

    // LOSING TRADE - CLEAN (No major mistake)
    if (isLoss) {
        return {
            verdict: 'loss',
            grade: 'C',
            roast: `You lost ${Math.abs(trade.pnlPercent).toFixed(1)}%. It happens. The question is: did you follow your plan, or did you wing it? If you had a stop, you're learning. If you didn't, you're gambling.`,
            lesson: "Losses are tuition. Review this trade, find ONE thing to improve, and move on.",
            xpEarned: 5,
        };
    }

    // BREAKEVEN
    return {
        verdict: 'breakeven',
        grade: 'B',
        roast: "Breakeven. Not exciting, but you didn't lose money either. Sometimes the best trade is the one that doesn't hurt you.",
        lesson: "Flat trades are fine. You lived to trade another day.",
        xpEarned: 10,
    };
}

// ═══════════════════════════════════════════════════════
// DISCIPLINE TRACKING
// ═══════════════════════════════════════════════════════

export interface DisciplineScore {
    score: number; // 0-100
    streak: number; // Days without a "roast"
    lastMistake: MistakeType | null;
    lastMistakeAt: Date | null;
    totalRoasts: number;
    badge: string;
}

export function calculateDisciplineScore(
    trades: { mistake: MistakeType; timestamp: Date }[]
): DisciplineScore {
    const mistakes = trades.filter(t => t.mistake !== 'none');
    const clean = trades.filter(t => t.mistake === 'none');

    const score = trades.length > 0
        ? Math.round((clean.length / trades.length) * 100)
        : 100;

    // Calculate streak (days since last mistake)
    let streak = 0;
    const sortedMistakes = mistakes.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (sortedMistakes.length > 0) {
        const daysSinceLast = Math.floor(
            (Date.now() - new Date(sortedMistakes[0].timestamp).getTime()) / (24 * 60 * 60 * 1000)
        );
        streak = daysSinceLast;
    } else {
        streak = 30; // Max streak for new/clean users
    }

    // Determine badge
    let badge = 'Rookie';
    if (score >= 90 && streak >= 7) badge = '🔥 Disciplined';
    else if (score >= 80) badge = '📈 Improving';
    else if (score >= 60) badge = '⚠️ Work In Progress';
    else badge = '🚨 Needs Attention';

    return {
        score,
        streak,
        lastMistake: sortedMistakes[0]?.mistake || null,
        lastMistakeAt: sortedMistakes[0]?.timestamp || null,
        totalRoasts: mistakes.length,
        badge,
    };
}
