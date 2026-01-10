/**
 * Predictive Engine Safe
 * 
 * Memory-augmented search prioritization system.
 * Tracks DIRECTIONAL accuracy, never predicts numeric prices.
 * 
 * Core principle: Bias search priority, not value calculations.
 */

import type {
    TokenLearning,
    SessionComparison,
    MarketState,
    SearchBias,
    HoldSuggestion,
    SearchConstraints,
} from '@/types/PredictiveMemory';
import type { SearchableToken } from '@/types/BrainV2';
import { neonStorage } from './NeonStorage';

export class PredictiveEngineSafe {
    private learningCache: Map<string, TokenLearning> = new Map();
    private marketState: MarketState;
    private readonly MAX_LEARNING_AGE = 24 * 60 * 60 * 1000; // 24 hours

    constructor() {
        this.marketState = {
            regime: 'SIDEWAYS',
            volatilityIndex: 0.5,
            breadthRatio: 0.5,
            lastUpdate: Date.now(),
        };
    }

    /**
     * Initialize - load learnings from Neon
     */
    async initialize(): Promise<void> {
        try {
            const learnings = await neonStorage.getAllLearnings({ minConfidence: 0.3, limit: 200 });
            learnings.forEach(learning => {
                this.learningCache.set(learning.mint, learning);
            });
            console.log(`[PredictiveEngine] Loaded ${learnings.length} token learnings from Neon`);
        } catch (error) {
            console.error('[PredictiveEngine] Error initializing:', error);
        }
    }

    /**
     * Update market state using ACTUAL prices only
     */
    updateMarketState(tokens: SearchableToken[]): void {
        if (tokens.length < 10) return;

        // Filter tokens with valid prices
        const validTokens = tokens.filter(t => t.valueInSOL && t.valueInSOL > 0);
        if (validTokens.length < 5) return;

        // Calculate volatility (using RTL as proxy)
        const rtlValues = validTokens.map(t => t.roundTripLoss).filter(r => r > 0 && r < 50);
        if (rtlValues.length === 0) return;

        const medianRTL = this.median(rtlValues);
        const volatilityIndex = Math.min(1, medianRTL / 15); // Scale 0-15% to 0-1

        // Calculate breadth (% with positive alpha)
        const alphaTokens = validTokens.filter(t => t.alphaScore && t.alphaScore > 0.3);
        const breadthRatio = alphaTokens.length / validTokens.length;

        // Determine regime
        let regime: MarketState['regime'] = 'SIDEWAYS';
        if (volatilityIndex > 0.7) {
            regime = 'VOLATILE';
        } else if (breadthRatio > 0.6) {
            regime = 'BULL';
        } else if (breadthRatio < 0.4) {
            regime = 'BEAR';
        }

        this.marketState = { regime, volatilityIndex, breadthRatio, lastUpdate: Date.now() };
        console.log(`[PredictiveEngine] Market: ${regime}, Vol: ${(volatilityIndex * 100).toFixed(0)}%, Breadth: ${(breadthRatio * 100).toFixed(0)}%`);
    }

    /**
     * Learn from session comparison - DIRECTIONAL ONLY
     */
    async learnFromComparison(comparison: SessionComparison): Promise<void> {
        const learning = await this.getLearning(comparison.token);

        // Update direction accuracy
        const directionCorrect = comparison.actualDirection === comparison.predictedDirection;
        const learningRate = 0.1;
        learning.directionAccuracy = learning.directionAccuracy * 0.9 + (directionCorrect ? 1 : 0) * learningRate;

        // Update magnitude bucket accuracy
        const bucketCorrect = comparison.actualBucket === comparison.predictedBucket;
        learning.magnitudeBucketAccuracy = learning.magnitudeBucketAccuracy * 0.9 + (bucketCorrect ? 1 : 0) * learningRate;

        // Update overall confidence
        const wasAccurate = directionCorrect || bucketCorrect;
        learning.confidenceScore = Math.max(0, Math.min(1,
            learning.confidenceScore * 0.95 + (wasAccurate ? 0.05 : -0.02)
        ));

        learning.lastUpdated = Date.now();
        learning.learningCount++;

        // Save to cache and Neon
        this.learningCache.set(comparison.token, learning);
        await neonStorage.updateTokenLearning(learning);
        await neonStorage.recordSessionComparison(comparison);
    }

    /**
     * Get search bias for a token - NOT price prediction
     */
    async getSearchBias(token: SearchableToken): Promise<SearchBias> {
        const learning = await this.getLearning(token.mint);
        const ageFactor = this.getAgeFactor(learning.lastUpdated);

        // Bias components (all 0-1)
        const directionalTrust = learning.directionAccuracy * ageFactor;
        const magnitudeTrust = learning.magnitudeBucketAccuracy * ageFactor;
        const confidence = learning.confidenceScore * ageFactor;

        // Apply market regime adjustments
        const regimeBoost = this.getRegimeBoost(token, this.marketState.regime);

        return {
            explorationPriority: Math.min(1, (directionalTrust * 0.6 + magnitudeTrust * 0.4) * regimeBoost),
            constraintRelaxation: Math.min(0.3, confidence * 0.3), // Max 30% relaxation
            holdConfidence: directionalTrust > 0.7 ? directionalTrust : 0,
            beamBoost: Math.min(2, 1 + (confidence * 0.5)),
        };
    }

    /**
     * Apply bias to search constraints - THE CORE CONNECTION
     */
    applyBiasToConstraints(
        baseConstraints: SearchConstraints,
        bias: SearchBias,
        token: SearchableToken
    ): SearchConstraints {
        // ONLY relax constraints, never tighten them
        return {
            maxHops: Math.ceil(baseConstraints.maxHops * (1 + bias.constraintRelaxation * 0.3)),
            maxTotalRTL: baseConstraints.maxTotalRTL * (1 + bias.constraintRelaxation * 0.4),
            maxPerHopRTL: token.isAlpha
                ? baseConstraints.maxPerHopRTL * (1 + bias.constraintRelaxation * 0.5)
                : baseConstraints.maxPerHopRTL * (1 + bias.constraintRelaxation * 0.2),
            beamWidth: Math.ceil(baseConstraints.beamWidth * bias.beamBoost),
            maxRevisits: bias.explorationPriority > 0.7 ? 1 : 0,
        };
    }

    /**
     * Generate HOLD suggestion (not prediction)
     */
    generateHoldSuggestion(token: SearchableToken, bias: SearchBias): HoldSuggestion | null {
        if (bias.holdConfidence < 0.6) return null;

        const learning = this.learningCache.get(token.mint);
        if (!learning) return null;

        return {
            token: token.mint,
            symbol: token.symbol,
            confidence: bias.holdConfidence,
            suggestedDurationMinutes: learning.typicalHoldMinutes
                ? Math.min(10, learning.typicalHoldMinutes)
                : bias.holdConfidence > 0.8 ? 5 : 3,
            reasons: [
                `Token showed ${Math.round(learning.directionAccuracy * 100)}% directional consistency`,
                `Current market: ${this.marketState.regime.toLowerCase()}`,
                learning.volatilityProfile === 'HIGH'
                    ? 'High volatility - momentum may continue'
                    : 'Stable momentum pattern detected',
            ],
            emergencyExitAvailable: true,
            maxRecommendedHold: 10,
            stopSuggestedAtLoss: 3,
        };
    }

    // Helper methods
    private async getLearning(mint: string): Promise<TokenLearning> {
        // Check cache first
        if (this.learningCache.has(mint)) {
            return this.learningCache.get(mint)!;
        }

        // Try to load from Neon
        const stored = await neonStorage.getTokenLearning(mint);
        if (stored) {
            this.learningCache.set(mint, stored);
            return stored;
        }

        // Create new learning
        const newLearning: TokenLearning = {
            mint,
            symbol: '',
            directionAccuracy: 0.5,
            magnitudeBucketAccuracy: 0.5,
            confidenceScore: 0.3,
            lastUpdated: Date.now(),
            volatilityProfile: 'MEDIUM',
            learningCount: 0,
        };

        this.learningCache.set(mint, newLearning);
        return newLearning;
    }

    private getAgeFactor(lastUpdated: number): number {
        const ageHours = (Date.now() - lastUpdated) / (1000 * 60 * 60);
        return Math.max(0, 1 - (ageHours / 24)); // Decay over 24 hours
    }

    private getRegimeBoost(token: SearchableToken, regime: MarketState['regime']): number {
        switch (regime) {
            case 'BULL':
                return token.isAlpha ? 1.3 : 1.1;
            case 'BEAR':
                return token.isAlpha ? 0.7 : 0.9;
            case 'VOLATILE':
                return token.isAlpha ? 1.4 : 1.0;
            default: // SIDEWAYS
                return 1.0;
        }
    }

    private median(arr: number[]): number {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Get stats for monitoring
     */
    async getStats(): Promise<any> {
        return await neonStorage.getStats();
    }
}

// Singleton instance
export const predictiveEngine = new PredictiveEngineSafe();
