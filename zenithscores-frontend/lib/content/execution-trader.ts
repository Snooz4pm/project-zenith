import { ModuleContent } from '../learning-types';

export const EXECUTION_TRADER_COURSES: ModuleContent[] = [{
    id: 'order-flow-dynamics',
    title: 'Order Flow & Execution',
    subtitle: 'Reading the Tape',
    icon: '🔢',
    estimatedTime: '40h 00min',
    difficulty: 'advanced',
    parts: [{
        id: 'of-part-1',
        title: 'Foundations',
        estimatedTime: '10h',
        chapters: [{
            id: 'of-ch-1-1',
            title: 'Introduction',
            content: `# Order Flow

Price discovery in action.`
        }]
    }]
}];
