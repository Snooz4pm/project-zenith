/**
 * Decision Evaluation Logic
 * 
 * Penalizes bad reasoning even if profitable
 */

import { DecisionLog, DecisionEvaluation } from './types';

export function evaluateDecision(log: DecisionLog): DecisionEvaluation {
    const { action, intent, realizedEdgePct } = log;

    // HESITATION
    if (action === 'HESITATE') {
        if (intent.expectedDirection === 'UP') {
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

    if (realizedEdgePct === undefined || intent.expectedEdgePct === undefined) {
        return {
            outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
            penaltyScore: 4,
            explanation: 'Executed without measurable edge',
        };
    }

    const directionCorrect =
        (realizedEdgePct > 0 && intent.expectedDirection === 'UP') ||
        (realizedEdgePct < 0 && intent.expectedDirection === 'DOWN');

    if (directionCorrect && realizedEdgePct > 0) {
        return {
            outcomeClass: 'GOOD_DECISION_GOOD_OUTCOME',
            penaltyScore: 0,
            explanation: 'Thesis correct and outcome aligned',
        };
    }

    if (directionCorrect && realizedEdgePct < 0) {
        return {
            outcomeClass: 'GOOD_DECISION_BAD_OUTCOME',
            penaltyScore: 1,
            explanation: 'Correct reasoning, market randomness',
        };
    }

    if (!directionCorrect && realizedEdgePct > 0) {
        return {
            outcomeClass: 'BAD_DECISION_GOOD_OUTCOME',
            penaltyScore: 5,
            explanation: 'Profit by luck — dangerous reinforcement',
        };
    }

    return {
        outcomeClass: 'BAD_DECISION_BAD_OUTCOME',
        penaltyScore: 4,
        explanation: 'Incorrect thesis and loss',
    };
}
