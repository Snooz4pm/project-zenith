/**
 * Path Explainer - Reality-Aware Reporting
 * 
 * Adds context and honesty to brain results.
 * Explains WHY paths work or don't work, provides alternatives.
 */

import type { PathState, SearchableToken, BrainGoal } from '@/types/BrainV2';

export interface PathExplanation {
    summary: string;
    explanations: string[];
    recommendation: string;
    marketContext: {
        profitablePathsExist: boolean;
        typicalMaxROI: number;
        timeOfDayFactor: number;
    };
    alternatives: {
        lowerTarget?: number;
        differentStrategy?: string;
        waitSuggestion?: string;
    };
    insights: string[];
}

export class PathExplainer {
    /**
     * Generate full explanation for path result
     */
    explainPath(
        path: PathState,
        goal: BrainGoal,
        universe: SearchableToken[],
        allPaths?: PathState[]
    ): PathExplanation {
        const explanations: string[] = [];
        const insights: string[] = [];

        // Calculate profit
        const profit = path.currentAmountSOL - goal.startAmountSOL;
        const profitPct = (profit / goal.startAmountSOL) * 100;
        const targetProfitPct = ((goal.targetAmountSOL - goal.startAmountSOL) / goal.startAmountSOL) * 100;

        // 1. Explain token choices
        for (let i = 0; i < path.path.length; i++) {
            const hop = path.path[i];
            const token = universe.find(t => t.mint === hop.toToken);
            if (token) {
                if (token.isAlpha) {
                    explanations.push(`Hop ${i + 1}: ${token.symbol} chosen for momentum (alpha: ${(token.alphaScore! * 100).toFixed(0)}%)`);
                } else if (token.roundTripLoss < 3) {
                    explanations.push(`Hop ${i + 1}: ${token.symbol} chosen for low RTL (${token.roundTripLoss.toFixed(1)}%)`);
                } else {
                    explanations.push(`Hop ${i + 1}: ${token.symbol} - RTL ${token.roundTripLoss.toFixed(1)}%`);
                }
            }
        }

        // 2. Explain constraints
        if (path.cumulativeRTL > 15) {
            explanations.push(`⚠ High cumulative RTL (${path.cumulativeRTL.toFixed(1)}%) - path is fragile`);
        }
        if (path.hopsUsed > 5) {
            explanations.push(`⚠ Long path (${path.hopsUsed} hops) - requires multiple wallet signatures`);
        }

        // 3. Generate insights about universe
        const alphaTokens = universe.filter(t => t.isAlpha && t.hasRoute);
        const safeTokens = universe.filter(t => t.tier === 'SAFE' && t.hasRoute);
        const avgRTL = universe.filter(t => t.hasRoute).reduce((sum, t) => sum + t.roundTripLoss, 0) / universe.filter(t => t.hasRoute).length;

        insights.push(`Market has ${alphaTokens.length} alpha candidates, ${safeTokens.length} safe fuel tokens`);
        insights.push(`Average RTL: ${avgRTL.toFixed(1)}% (${avgRTL > 5 ? 'high slippage market' : 'liquid market'})`);

        if (alphaTokens.length < 10) {
            insights.push('Limited alpha opportunities currently');
        }

        // 4. Market context
        const bestProfitPct = allPaths ? Math.max(...allPaths.map(p =>
            ((p.currentAmountSOL - goal.startAmountSOL) / goal.startAmountSOL) * 100
        )) : profitPct;

        const marketContext = {
            profitablePathsExist: bestProfitPct > 0,
            typicalMaxROI: Math.max(0, bestProfitPct),
            timeOfDayFactor: this.getTimeOfDayFactor(),
        };

        // 5. Generate alternatives
        const alternatives: PathExplanation['alternatives'] = {};

        if (profitPct < targetProfitPct) {
            // Suggest lower target that would work
            const achievableTarget = goal.startAmountSOL * (1 + (marketContext.typicalMaxROI / 100));
            if (achievableTarget > goal.startAmountSOL) {
                alternatives.lowerTarget = achievableTarget;
            }

            // Suggest strategy change
            if (goal.maxPerHopRTL < 8) {
                alternatives.differentStrategy = 'Try "Aggressive" mode (allows 12% RTL per hop)';
            }

            // Suggest waiting
            if (marketContext.timeOfDayFactor < 0.7) {
                alternatives.waitSuggestion = 'Markets typically more volatile after 2PM UTC';
            }
        }

        // 6. Generate summary and recommendation
        const summary = this.getSummary(profitPct, targetProfitPct);
        const recommendation = this.getRecommendation(path, profitPct, targetProfitPct, marketContext);

        return {
            summary,
            explanations,
            recommendation,
            marketContext,
            alternatives,
            insights,
        };
    }

    /**
     * Explain why search failed
     */
    explainFailure(
        bestEffort: PathState | undefined,
        goal: BrainGoal,
        universe: SearchableToken[]
    ): PathExplanation {
        const insights: string[] = [];
        const explanations: string[] = [];

        // Analyze universe
        const routableTokens = universe.filter(t => t.hasRoute);
        const alphaTokens = routableTokens.filter(t => t.isAlpha);
        const avgRTL = routableTokens.reduce((sum, t) => sum + t.roundTripLoss, 0) / (routableTokens.length || 1);

        insights.push(`Only ${routableTokens.length} tokens are routable under current constraints`);
        insights.push(`Average RTL: ${avgRTL.toFixed(1)}% (${avgRTL > 8 ? 'very high' : avgRTL > 5 ? 'high' : 'moderate'})`);

        if (alphaTokens.length < 5) {
            insights.push('Very few alpha tokens available - markets may be flat');
            explanations.push('Limited momentum opportunities in current market');
        }

        if (goal.maxPerHopRTL < 5) {
            explanations.push('Strict RTL constraints may be blocking viable paths');
        }

        const bestEffortProfit = bestEffort
            ? ((bestEffort.currentAmountSOL - goal.startAmountSOL) / goal.startAmountSOL) * 100
            : -100;

        return {
            summary: 'No path found to target',
            explanations,
            recommendation: bestEffortProfit > -5
                ? `Best path got to ${bestEffortProfit.toFixed(1)}%. Consider lowering target or relaxing constraints.`
                : 'Market conditions unfavorable. Consider waiting or trying a different strategy.',
            marketContext: {
                profitablePathsExist: false,
                typicalMaxROI: Math.max(0, bestEffortProfit),
                timeOfDayFactor: this.getTimeOfDayFactor(),
            },
            alternatives: {
                lowerTarget: bestEffort ? bestEffort.currentAmountSOL : undefined,
                differentStrategy: goal.maxPerHopRTL < 8 ? 'Increase max per-hop RTL to 8-12%' : undefined,
                waitSuggestion: this.getTimeOfDayFactor() < 0.7 ? 'Try during peak volatility hours (2-8PM UTC)' : undefined,
            },
            insights,
        };
    }

    private getSummary(profitPct: number, targetPct: number): string {
        if (profitPct >= targetPct) {
            return `✓ Target achieved: +${profitPct.toFixed(1)}%`;
        } else if (profitPct >= 0) {
            return `Partial success: +${profitPct.toFixed(1)}% (target was +${targetPct.toFixed(1)}%)`;
        } else if (profitPct >= -2) {
            return `Best-effort loss minimization: ${profitPct.toFixed(1)}%`;
        } else {
            return `Market unfavorable: ${profitPct.toFixed(1)}% loss`;
        }
    }

    private getRecommendation(
        path: PathState,
        profitPct: number,
        targetPct: number,
        marketContext: PathExplanation['marketContext']
    ): string {
        if (profitPct >= targetPct) {
            return 'This path meets your target. Market conditions are favorable.';
        }

        if (profitPct >= targetPct * 0.5 && profitPct > 0) {
            return 'Path shows profit but below target. Consider accepting smaller gain or waiting for better conditions.';
        }

        if (profitPct >= 0) {
            return 'Small profit possible. Worth testing if you believe in token momentum.';
        }

        if (profitPct >= -2) {
            return 'Minimal loss expected. This is the best path under current market conditions.';
        }

        if (marketContext.timeOfDayFactor < 0.7) {
            return 'Markets currently quiet. Try during peak volatility hours or lower your target.';
        }

        return 'No profitable paths available. Consider waiting or significantly lowering target.';
    }

    private getTimeOfDayFactor(): number {
        // Simple heuristic: higher volatility 2PM-8PM UTC
        const hour = new Date().getUTCHours();
        if (hour >= 14 && hour <= 20) {
            return 1.0; // Peak hours
        } else if (hour >= 10 && hour <= 22) {
            return 0.8; // Active hours
        } else {
            return 0.5; // Quiet hours
        }
    }
}

// Singleton
export const pathExplainer = new PathExplainer();
