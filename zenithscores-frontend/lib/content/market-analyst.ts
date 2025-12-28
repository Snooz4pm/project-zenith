import { ModuleContent } from '../learning-types';

export const MARKET_ANALYST_COURSES: ModuleContent[] = [{
    id: 'valuation-basics',
    title: 'Valuation & Analysis',
    subtitle: 'Finding Intrinsic Value',
    icon: '📊',
    estimatedTime: '60h 00min',
    difficulty: 'intermediate',
    parts: [{
        id: 'va-part-1',
        title: 'Foundations',
        estimatedTime: '10h',
        chapters: [{
            id: 'va-ch-1-1',
            title: 'Introduction',
            content: `# Market Analysis

Understanding true value.`
        }]
    }]
}];

export const DATA_RESEARCH_COURSES: ModuleContent[] = [];
