
import prisma from '@/lib/prisma';
import { calculateReturns, calculateVolatility, calculateDrawdowns } from '@/lib/stats/calculations';
import { getOHLCV } from '@/lib/market-data/resolver';
import { AssetType } from '@/lib/market-data/types';

export interface ZenithScoreConfig {
    // Weight distribution (always sums to 1)
    weights: {
        lifetime: number;    // 40% - Performance since launch
        yearly: number;      // 20% - Yearly performance
        quarterly: number;   // 15% - Quarterly performance
        monthly: number;     // 15% - Monthly performance
        weekly: number;      // 10% - Weekly performance
    };

    // Scoring parameters
    minDataPoints: number;
    volatilityPenalty: number;
    consistencyBonus: number;
    recoveryMultiplier: number;
}

export const DEFAULT_CONFIG: ZenithScoreConfig = {
    weights: {
        lifetime: 0.40,   // 40% weight
        yearly: 0.20,     // 20% weight
        quarterly: 0.15,  // 15% weight
        monthly: 0.15,    // 15% weight
        weekly: 0.10,     // 10% weight
    },
    minDataPoints: 30,
    volatilityPenalty: 0.3,
    consistencyBonus: 0.2,
    recoveryMultiplier: 1.5
};

export class ZenithScoreCalculator {
    private symbol: string;
    private assetType: AssetType;
    private config: ZenithScoreConfig;

    constructor(symbol: string, assetType: AssetType, config = DEFAULT_CONFIG) {
        this.symbol = symbol;
        this.assetType = assetType;
        this.config = config;
    }

    /**
     * Calculate FINAL Zenith Score (timeframe-independent)
     */
    async calculateFinalScore(): Promise<{
        score: number;
        breakdown: Record<string, number>;
        confidence: number;
        lastUpdated: Date;
    }> {
        // 1. Get or fetch all-time data
        const allTimeData = await this.getAllTimeData();

        // 2. Calculate base lifetime score
        const lifetimeScore = await this.calculateLifetimeScore(allTimeData);

        // 3. Calculate timeframe scores with fixed weights
        const timeframeScores = await this.calculateTimeframeScores(allTimeData);

        // 4. Apply weighted combination
        const finalScore = this.combineScores(lifetimeScore, timeframeScores);

        // 5. Store in database
        await this.storeScore(finalScore, lifetimeScore, timeframeScores);

        return {
            score: finalScore.total,
            breakdown: finalScore.breakdown,
            confidence: finalScore.confidence,
            lastUpdated: new Date()
        };
    }

    /**
     * Get ALL historical data from launch to today
     */
    private async getAllTimeData(): Promise<any[]> {
        // Check cache first
        const cached = await prisma.assetLifetimeScore.findUnique({
            where: { symbol: this.symbol }
        });

        if (cached && cached.lastCalculated > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            // If we had a mechanism to store full history in DB we would fetch it here.
            // For now, allow re-fetching from provider as caching 20 years of candles in one row is heavy.
            // We rely on 'resolver' cache.
        }

        // Fetch fresh data from beginning (using 5Y/ALL proxy)
        // TODO: Implement true "ALL" if provider supports it. Using '1D' timeframe for adequate granularity over long term.
        const response = await getOHLCV(
            this.symbol,
            '1D',
            '5Y', // Best proxy for "lifetime" pending provider "MAX" support
            this.assetType
        );

        if (!response || !response.data || response.data.length === 0) {
            return [];
        }

        // Convert seconds timestamp to ms for calculation compatibility
        return response.data.map(d => ({
            ...d,
            timestamp: d.time * 1000
        }));
    }

    /**
     * Determine when this asset was launched/IPO'd
     * Used for metadata, not strictly for data fetching since we rely on provider max range.
     */
    private async getLaunchDate(): Promise<Date> {
        // Return 5 years ago as default for now, can be enriched via Company Profile API later
        return new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
    }

    /**
     * Calculate lifetime score (40% of total)
     */
    private async calculateLifetimeScore(data: any[]): Promise<{
        score: number;
        metrics: Record<string, any>;
    }> {
        if (data.length < this.config.minDataPoints) {
            return { score: 50, metrics: {} }; // Neutral score for insufficient data
        }

        // Calculate key lifetime metrics
        const returns = calculateReturns(data);
        const volatility = calculateVolatility(data);
        const drawdowns = calculateDrawdowns(data);
        const volumeAnalysis = this.analyzeVolume(data);

        // Normalize metrics to 0-100 scale
        const returnScore = this.normalizeReturn(returns.totalReturn);
        const volatilityScore = this.normalizeVolatility(volatility.annualizedVolatility);
        const consistencyScore = this.calculateConsistency(returns.periodicReturns);
        const recoveryScore = this.calculateRecoveryAbility(drawdowns);
        const volumeScore = volumeAnalysis.score;

        // Weighted combination
        const lifetimeScore = (
            returnScore * 0.35 +
            volatilityScore * 0.25 +
            consistencyScore * 0.20 +
            recoveryScore * 0.15 +
            volumeScore * 0.05
        );

        return {
            score: Math.min(100, Math.max(0, lifetimeScore)),
            metrics: {
                totalReturn: returns.totalReturn,
                annualizedVolatility: volatility.annualizedVolatility,
                maxDrawdown: drawdowns.maxDrawdown,
                recoveryTime: drawdowns.avgRecoveryDays,
                volumeConsistency: volumeAnalysis.consistency,
                recoveryScore, // Return explicitly for storage
                consistencyScore // Just use calculated score
            }
        };
    }

    /**
     * Calculate timeframe-specific scores with FIXED weights
     */
    private async calculateTimeframeScores(allTimeData: any[]): Promise<{
        yearly: number;
        quarterly: number;
        monthly: number;
        weekly: number;
        daily: number;
    }> {
        const now = new Date();

        // Define time periods
        const periods = {
            yearly: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
            quarterly: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
            monthly: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
            weekly: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            daily: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        };

        // Filter data for each period
        const yearlyData = allTimeData.filter(d => new Date(d.timestamp) >= periods.yearly);
        const quarterlyData = allTimeData.filter(d => new Date(d.timestamp) >= periods.quarterly);
        const monthlyData = allTimeData.filter(d => new Date(d.timestamp) >= periods.monthly);
        const weeklyData = allTimeData.filter(d => new Date(d.timestamp) >= periods.weekly);
        const dailyData = allTimeData.filter(d => new Date(d.timestamp) >= periods.daily);

        // Calculate scores for each period
        return {
            yearly: this.calculatePeriodScore(yearlyData),
            quarterly: this.calculatePeriodScore(quarterlyData),
            monthly: this.calculatePeriodScore(monthlyData),
            weekly: this.calculatePeriodScore(weeklyData),
            daily: this.calculatePeriodScore(dailyData)
        };
    }

    /**
     * Calculate score for a specific time period
     */
    private calculatePeriodScore(data: any[]): number {
        if (data.length < 10) return 50; // Insufficient data

        const returns = calculateReturns(data);
        const volatility = calculateVolatility(data);

        // Normalize
        const returnScore = this.normalizeReturn(returns.totalReturn);
        const volatilityScore = this.normalizeVolatility(volatility.annualizedVolatility);

        // Combined score (70% returns, 30% volatility)
        return returnScore * 0.7 + volatilityScore * 0.3;
    }

    /**
     * Combine all scores with fixed weights
     */
    private combineScores(
        lifetimeScore: { score: number; metrics: any },
        timeframeScores: Record<string, number>
    ): {
        total: number;
        breakdown: Record<string, number>;
        confidence: number;
    } {
        const weights = this.config.weights;

        // Apply weights
        const weightedScore =
            lifetimeScore.score * weights.lifetime +
            timeframeScores.yearly * weights.yearly +
            timeframeScores.quarterly * weights.quarterly +
            timeframeScores.monthly * weights.monthly +
            timeframeScores.weekly * weights.weekly;

        // Calculate confidence based on data quality
        const confidence = this.calculateConfidence(lifetimeScore.metrics);

        return {
            total: Math.min(100, Math.max(0, weightedScore)),
            breakdown: {
                lifetime: lifetimeScore.score,
                yearly: timeframeScores.yearly,
                quarterly: timeframeScores.quarterly,
                monthly: timeframeScores.monthly,
                weekly: timeframeScores.weekly
            },
            confidence
        };
    }

    /**
     * Normalize returns to 0-100 scale
     */
    private normalizeReturn(totalReturn: number): number {
        // Convert return percentage to score
        // Example: -100% = 0, 0% = 50, +100% = 80, +500% = 100
        if (totalReturn <= -1) return 0; // -100% or worse
        if (totalReturn >= 5) return 100; // +500% or better

        // Linear interpolation between points
        if (totalReturn < 0) {
            // Negative returns: -100% to 0%
            return 50 + (totalReturn * 50); // 50 at 0%, 0 at -100%
        } else {
            // Positive returns: 0% to 500%
            return 50 + (totalReturn * 6); // 50 at 0%, 80 at 100%, 100 at 500%
        }
    }

    /**
     * Normalize volatility to 0-100 scale (lower volatility = higher score)
     */
    private normalizeVolatility(volatility: number): number {
        // Convert annualized volatility to score
        // Example: 0% = 100, 50% = 80, 100% = 50, 200% = 0
        if (volatility <= 0) return 100;
        if (volatility >= 2) return 0; // 200% volatility

        // Higher volatility = lower score
        return 100 - (volatility * 25); // 100 at 0%, 75 at 100%, 50 at 200%
    }

    /**
     * Calculate consistency of returns
     */
    private calculateConsistency(periodicReturns: number[]): number {
        if (periodicReturns.length < 2) return 50;

        // Calculate percentage of positive periods
        const positivePeriods = periodicReturns.filter(r => r > 0).length;
        const positivityRatio = positivePeriods / periodicReturns.length;

        // Calculate standard deviation of returns (lower = more consistent)
        const mean = periodicReturns.reduce((a, b) => a + b, 0) / periodicReturns.length;
        const variance = periodicReturns.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / periodicReturns.length;
        const stdDev = Math.sqrt(variance);

        // Normalize std dev (0-1, lower is better)
        const normalizedStdDev = Math.min(1, stdDev / 0.5); // Assume 50% std dev is max

        // Combine: 70% positivity, 30% consistency
        return (positivityRatio * 70) + ((1 - normalizedStdDev) * 30);
    }

    /**
     * Calculate recovery ability from drawdowns
     */
    private calculateRecoveryAbility(drawdowns: any): number {
        if (!drawdowns.recoveries || drawdowns.recoveries.length === 0) return 50;

        const avgRecoveryDays = drawdowns.avgRecoveryDays;
        const recoverySuccessRate = drawdowns.recoverySuccessRate;

        // Normalize recovery days (shorter = better)
        const normalizedDays = Math.min(1, avgRecoveryDays / 365); // 1 year max

        // Score: 60% success rate, 40% speed
        return (recoverySuccessRate * 60) + ((1 - normalizedDays) * 40);
    }

    /**
     * Analyze volume patterns
     */
    private analyzeVolume(data: any[]): {
        score: number;
        consistency: number;
        trend: number;
    } {
        if (data.length < 2) return { score: 50, consistency: 0.5, trend: 0 };

        const volumes = data.map(d => d.volume);
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

        // Calculate volume consistency (coefficient of variation)
        const variance = volumes.reduce((sq, n) => sq + Math.pow(n - avgVolume, 2), 0) / volumes.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / avgVolume; // Lower CV = more consistent

        // Normalize CV to 0-100 (lower CV = higher score)
        const consistencyScore = Math.max(0, 100 - (cv * 100));

        // Calculate volume trend
        const firstHalfAvg = volumes.slice(0, Math.floor(volumes.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(volumes.length / 2);
        const secondHalfAvg = volumes.slice(Math.floor(volumes.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(volumes.length / 2);
        const volumeTrend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        // Trending up volume is good
        const trendScore = Math.min(100, Math.max(0, 50 + (volumeTrend / 2)));

        return {
            score: (consistencyScore * 0.7 + trendScore * 0.3),
            consistency: 1 - cv, // 0-1, higher = more consistent
            trend: volumeTrend
        };
    }

    /**
     * Calculate confidence in the score
     */
    private calculateConfidence(metrics: any): number {
        let confidence = 100;

        // Penalize for high volatility
        if (metrics.annualizedVolatility > 1) { // >100% volatility
            confidence -= 20;
        }

        // Penalize for insufficient data points
        if (metrics.totalReturn === undefined) {
            confidence -= 30;
        }

        // Bonus for consistent performance
        if (metrics.recoveryTime < 90) { // Recovers in < 90 days on average
            confidence += 10;
        }

        return Math.min(100, Math.max(0, confidence));
    }

    /**
     * Store calculated score in database
     */
    private async storeScore(
        finalScore: any,
        lifetimeScore: any,
        timeframeScores: any
    ): Promise<void> {
        await prisma.assetLifetimeScore.upsert({
            where: { symbol: this.symbol },
            update: {
                baseScore: finalScore.total,
                currentScore: finalScore.total, // Same as base for now
                trendScore: 0, // Will be calculated separately
                lifetimeReturn: lifetimeScore.metrics.totalReturn,
                volatilityScore: this.normalizeVolatility(lifetimeScore.metrics.annualizedVolatility),
                consistencyScore: lifetimeScore.metrics.consistencyScore || 50,
                recoveryScore: lifetimeScore.metrics.recoveryScore || 50,
                volumeScore: lifetimeScore.metrics.volumeConsistency || 50,
                weights: this.config.weights,
                updatedAt: new Date(),
                lastCalculated: new Date()
            },
            create: {
                symbol: this.symbol,
                assetType: this.assetType,
                launchDate: await this.getLaunchDate(),
                firstPrice: 0, // Will be set from data
                baseScore: finalScore.total,
                currentScore: finalScore.total,
                trendScore: 0,
                lifetimeReturn: lifetimeScore.metrics.totalReturn,
                volatilityScore: this.normalizeVolatility(lifetimeScore.metrics.annualizedVolatility),
                consistencyScore: lifetimeScore.metrics.consistencyScore || 50,
                recoveryScore: lifetimeScore.metrics.recoveryScore || 50,
                volumeScore: lifetimeScore.metrics.volumeConsistency || 50,
                weights: this.config.weights,
                updatedAt: new Date(),
                lastCalculated: new Date()
            }
        });
    }
}
