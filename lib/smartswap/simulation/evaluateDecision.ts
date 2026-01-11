/**
 * Decision Evaluation Logic
 * 
 * Penalizes bad reasoning even if profitable
 */

import { DecisionLog, DecisionEvaluation } from './types';

export function evaluateDecision(log: DecisionLog): DecisionEvaluation {
    const { action, intent, realizedPnlSOL, unrealizedPnlSOL, skippedReason } = log;

    // NO-OP or GUARD REJECTS
    if (skippedReason) {
        return {
            outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
            penaltyScore: 5,
            explanation: `Invalid action: ${skippedReason}`,
        };
    }

    // SWAP (Opening a position)
    if (action === 'SWAP') {
        return {
            outcomeClass: 'POSITION_OPENED',
            penaltyScore: 0,
            explanation: `Opened position in ${log.toToken}. Entry cost: ${log.entryCostSOL?.toFixed(6)} SOL`,
        };
    }

    // EXIT (Closing a position)
    if (action === 'EXIT') {
        const isProfit = (realizedPnlSOL || 0) > 0;
        const correctReasoning = intent.expectedDirection === 'UP' && isProfit; // simplified

        if (isProfit) {
            return {
                outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
                penaltyScore: 0,
                explanation: `Successfully realized profit: +${realizedPnlSOL?.toFixed(6)} SOL`,
            };
        } else {
            return {
                outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
                penaltyScore: 3,
                explanation: `Realized loss on exit: ${realizedPnlSOL?.toFixed(6)} SOL`,
            };
        }
    }

    // HESITATE
    if (action === 'HESITATE') {
        // If we missed a big upside while hesitating
        if (intent.expectedDirection === 'UP' && (unrealizedPnlSOL || 0) > 0.001) {
            return {
                outcomeClass: 'HESITATION_COSTLY',
                penaltyScore: 2,
                explanation: 'Expected upside but hesitated and missed move',
            };
        }

        return {
            outcomeClass: 'HESITATION_CORRECT',
            penaltyScore: 0,
            explanation: 'Correctly avoided low-edge situation',
        };
    }

    // HOLD
    if (action === 'HOLD') {
        const isUp = (unrealizedPnlSOL || 0) > 0;

        if (isUp && intent.expectedDirection === 'UP') {
            return {
                outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
                penaltyScore: 0,
                explanation: 'Correct thesis: Holding through upside',
            };
        }

        if (!isUp && intent.expectedDirection === 'UP') {
            return {
                outcomeClass: 'GOOD_DECISION_BAD_OUTCOME',
                penaltyScore: 1,
                explanation: 'Correct reasoning, market drawdown',
            };
        }

        if (isUp && intent.expectedDirection === 'NEUTRAL') {
            return {
                outcomeClass: 'BAD_DECISION_GOOD_OUTCOME',
                penaltyScore: 3,
                explanation: 'Profit by luck: expected neutral but market moved up',
            };
        }

        return {
            outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
            penaltyScore: 2,
            explanation: 'Thesis incorrect: holding through loss',
        };
    }

    return {
        outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
        penaltyScore: 1,
        explanation: 'Undefined evaluation state',
    };
}
