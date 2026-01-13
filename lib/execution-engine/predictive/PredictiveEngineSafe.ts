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
import type { SearchableToken } from '@/types/LiquidityFilter';
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
    /**
     * Initialize - [LOBOTOMIZED] Do not load learnings.
     */
    async initialize(): Promise<void> {
        console.log('[PredictiveEngine] Memory Center Lobotomized. No learnings loaded.');
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
    /**
     * Learn from session comparison - [LOBOTOMIZED]
     */
    async learnFromComparison(comparison: SessionComparison): Promise<void> {
        // [LOBOTOMIED] Do nothing. Do not save. Do not learn.
        return;
    }

    /**
     * Get search bias for a token - NOT price prediction
     */
    /**
     * Get search bias for a token - [LOBOTOMIZED] Neutral Only
     */
    async getSearchBias(token: SearchableToken): Promise<SearchBias> {
        // [LOBOTOMIZED] Always return neutral bias.
        return {
            explorationPriority: 0.5, // Neutral
            constraintRelaxation: 0.0, // No relaxation
            holdConfidence: 0,
            beamBoost: 1.0, // No boost
        };
    }

    /**
     * Apply bias to search constraints - THE CORE CONNECTION
     */
    /**
     * Apply bias to search constraints - [LOBOTOMIZED] No Relaxation
     */
    applyBiasToConstraints(
        baseConstraints: SearchConstraints,
        bias: SearchBias,
        token: SearchableToken
    ): SearchConstraints {
        // [LOBOTOMIZED] Return constraints exactly as they are.
        // Adaptive constraints are DEAD.
        return baseConstraints;
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
