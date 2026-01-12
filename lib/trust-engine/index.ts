/**
 * Trust Engine - Index
 * 
 * Pillar 9: Trust / Authority Compounding
 */

export { TrustLevel, getTrustConfig, getTrustLevelName, canExecute, canExecuteReal } from './trustLevels';
export type { TrustDecision } from './trustDecision';
export { isExecutionAllowed, formatTrustDecision } from './trustDecision';
export type { TrustHistorySummary, TrustViolation, TrustChange, ViolationType } from './trustDecision';
export { evaluateTrust } from './trustEvaluator';
export { evaluatePromotion } from './promotionRules';
export { evaluateDemotion } from './demotionRules';
