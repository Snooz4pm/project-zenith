/**
 * Learning Module Types
 */

export interface ModuleContent {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    estimatedTime: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    parts: Part[];
}

export interface Part {
    id: string;
    title: string;
    estimatedTime: string;
    chapters: Chapter[];
}

export interface Chapter {
    id: string;
    title: string;
    content: string; // Markdown content
}
