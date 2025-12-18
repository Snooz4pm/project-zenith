/**
 * API Client for News Signal Portal
 */

import type {
    Article,
    ArticlesResponse,
    CategoriesResponse,
    StatsResponse,
    SearchResponse,
    CategorySlug,
} from './news-types';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://defioracleworkerapi.vercel.app';

class NewsAPI {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async fetchAPI<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get articles by category
     */
    async getArticlesByCategory(
        category: string,
        options?: {
            limit?: number;
            minConfidence?: number;
            sortBy?: 'confidence' | 'date' | 'importance';
        }
    ): Promise<ArticlesResponse> {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.minConfidence) params.append('min_confidence', options.minConfidence.toString());
        if (options?.sortBy) params.append('sort_by', options.sortBy);

        const query = params.toString();
        const endpoint = `/api/v1/news/articles/${category}${query ? `?${query}` : ''}`;

        return this.fetchAPI<ArticlesResponse>(endpoint);
    }

    /**
     * Get article by ID
     */
    async getArticleById(id: number): Promise<Article> {
        return this.fetchAPI<Article>(`/api/v1/news/articles/id/${id}`);
    }

    /**
     * Get top articles across all categories
     */
    async getTopArticles(options?: {
        limit?: number;
        hours?: number;
        minConfidence?: number;
    }): Promise<ArticlesResponse & { hours: number }> {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.hours) params.append('hours', options.hours.toString());
        if (options?.minConfidence) params.append('min_confidence', options.minConfidence.toString());

        const query = params.toString();
        return this.fetchAPI(`/api/v1/news/top-articles${query ? `?${query}` : ''}`);
    }

    /**
     * Get all categories with statistics
     */
    async getCategories(): Promise<CategoriesResponse> {
        return this.fetchAPI<CategoriesResponse>('/api/v1/news/categories');
    }

    /**
     * Search articles
     */
    async searchArticles(query: string, limit: number = 20): Promise<SearchResponse> {
        const params = new URLSearchParams({ q: query, limit: limit.toString() });
        return this.fetchAPI<SearchResponse>(`/api/v1/news/search?${params.toString()}`);
    }

    /**
     * Get overall statistics
     */
    async getStats(): Promise<StatsResponse> {
        return this.fetchAPI<StatsResponse>('/api/v1/news/stats');
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; total_articles: number }> {
        return this.fetchAPI('/');
    }
}

// Export singleton instance
export const newsAPI = new NewsAPI();

// Export categories configuration
export const CATEGORIES: Array<{
    slug: CategorySlug;
    name: string;
    icon: string;
    color: string;
    description: string;
}> = [
        {
            slug: 'technology',
            name: 'Technology',
            icon: '💻',
            color: 'from-blue-500 to-cyan-500',
            description: 'AI, Software, Hardware, Startups',
        },
        {
            slug: 'business',
            name: 'Business',
            icon: '💼',
            color: 'from-green-500 to-emerald-500',
            description: 'Markets, Finance, Corporate News',
        },
        {
            slug: 'politics',
            name: 'Politics',
            icon: '🏛️',
            color: 'from-red-500 to-rose-500',
            description: 'Government, Elections, Policy',
        },
        {
            slug: 'entertainment',
            name: 'Entertainment',
            icon: '🎬',
            color: 'from-purple-500 to-pink-500',
            description: 'Movies, Music, TV, Celebrity',
        },
        {
            slug: 'sports',
            name: 'Sports',
            icon: '⚽',
            color: 'from-orange-500 to-amber-500',
            description: 'Athletics, Games, Tournaments',
        },
        {
            slug: 'health',
            name: 'Health',
            icon: '🏥',
            color: 'from-teal-500 to-cyan-500',
            description: 'Medical, Wellness, Healthcare',
        },
        {
            slug: 'science',
            name: 'Science',
            icon: '🔬',
            color: 'from-indigo-500 to-purple-500',
            description: 'Research, Discovery, Environment',
        },
        {
            slug: 'world',
            name: 'World',
            icon: '🌍',
            color: 'from-slate-500 to-gray-500',
            description: 'International, Global Affairs',
        },
    ];

/**
 * Get category info by slug
 */
export function getCategoryBySlug(slug: string) {
    return CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

/**
 * Get confidence color class (dark theme compatible)
 */
export function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-emerald-400 bg-emerald-500/20';
    if (confidence >= 0.6) return 'text-blue-400 bg-blue-500/20';
    if (confidence >= 0.4) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-gray-400 bg-gray-500/20';
}

