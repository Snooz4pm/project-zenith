import { ModuleContent, Part, Chapter } from './learning-types';

// Re-export types for consumers
export type { ModuleContent, Part, Chapter };
import { TRADING_FUNDAMENTALS } from './content/trading-fundamentals';
import { TECHNICAL_ANALYSIS } from './content/technical-analysis';
import { ZENITH_MASTERY } from './content/zenith-mastery';
import { RISK_MANAGEMENT } from './content/risk-management';
import { MARKET_ANALYST_COURSES, DATA_RESEARCH_COURSES } from './content/market-analyst';
import { SYSTEMATIC_TRADING_COURSES } from './content/systematic-trading';
import { EXECUTION_TRADER_COURSES } from './content/execution-trader';
import { MACRO_OBSERVER_COURSES } from './content/macro-observer';

/**
 * Learning Module Course Content
 * Comprehensive trading education courses
 */

export const COURSES: ModuleContent[] = [
    TRADING_FUNDAMENTALS,
    ZENITH_MASTERY,
    TECHNICAL_ANALYSIS,
    RISK_MANAGEMENT,
    ...MARKET_ANALYST_COURSES,
    ...DATA_RESEARCH_COURSES,
    ...SYSTEMATIC_TRADING_COURSES,
    ...EXECUTION_TRADER_COURSES,
    ...MACRO_OBSERVER_COURSES
];

export const getCourseById = (id: string): ModuleContent | undefined => {
    return COURSES.find(course => course.id === id);
};
