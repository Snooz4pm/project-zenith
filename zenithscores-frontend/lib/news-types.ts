/**
 * API Types for News Signal Portal
 */

export interface Article {
    id: number;
    title: string;
    article: string;
    url: string;
    source: string;
    category: string;
    category_confidence: number;
    matched_keywords: string[];
    word_count?: number;
    ai_importance?: number;
    sentiment_score?: number;
    why_it_matters?: string;
    fetched_at: string;
}

export interface ArticlesResponse {
    articles: Article[];
    count: number;
}

export interface CategoryStat {
    category: string;
    article_count: number;
    avg_confidence: number;
    last_fetched: string;
}

export interface CategoriesResponse {
    categories: CategoryStat[];
}

export interface SourceStat {
    source: string;
    count: number;
    avg_confidence: number;
}

export interface StatsResponse {
    total_articles: number;
    categories: Array<{
        name: string;
        count: number;
        avg_confidence: number;
    }>;
    top_sources: SourceStat[];
}

export interface SearchResponse {
    articles: Array<{
        id: number;
        title: string;
        source: string;
        category: string;
        fetched_at: string;
    }>;
    count: number;
    query: string;
}

// Only allowed categories (removed: sports, health, science, world, politics)
export type CategorySlug =
    | 'crypto'
    | 'technology'
    | 'business'
    | 'entertainment';

export interface CategoryInfo {
    slug: CategorySlug;
    name: string;
    icon: string;
    color: string;
    description: string;
}
