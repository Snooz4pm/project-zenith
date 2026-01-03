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


const API_BASE_URL = ''; // Use relative path for Next.js API routes

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
        const endpoint = `/api/news/articles/${category}${query ? `?${query}` : ''}`;

        return this.fetchAPI<ArticlesResponse>(endpoint);
    }

    /**
     * Get article by ID
     */
    async getArticleById(id: number): Promise<Article> {
        return this.fetchAPI<Article>(`/api/news/articles/id/${id}`);
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
        return this.fetchAPI(`/api/news/top-articles${query ? `?${query}` : ''}`);
    }

    /**
     * Get all categories with statistics
     */
    async getCategories(): Promise<CategoriesResponse> {
        return this.fetchAPI<CategoriesResponse>('/api/news/categories');
    }

    /**
     * Search articles
     */
    async searchArticles(query: string, limit: number = 20): Promise<SearchResponse> {
        const params = new URLSearchParams({ q: query, limit: limit.toString() });
        return this.fetchAPI<SearchResponse>(`/api/news/search?${params.toString()}`);
    }

    /**
     * Get overall statistics
     */
    async getStats(): Promise<StatsResponse> {
        return this.fetchAPI<StatsResponse>('/api/news/stats');
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; total_articles: number }> {
        return this.fetchAPI('/api/news/stats');
    }
}

// Export singleton instance
export const newsAPI = new NewsAPI();

// ============================================
// NEWS STRATEGY: FOCUSED CATEGORIES ONLY
// ============================================
// REMOVED: Sports, Health, Science, World, Politics (noise, no edge)
// KEPT: Crypto, Markets/Tech, Entertainment (releases only)

export const CATEGORIES: Array<{
    slug: CategorySlug;
    name: string;
    icon: string;
    color: string;
    description: string;
}> = [
        {
            slug: 'crypto',
            name: 'Crypto',
            icon: '🪙',
            color: 'from-orange-500 to-yellow-500',
            description: 'Regulation, ETFs, Protocol upgrades',
        },
        {
            slug: 'technology',
            name: 'Markets & Tech',
            icon: '📊',
            color: 'from-blue-500 to-cyan-500',
            description: 'AI, Fintech, Market-moving tech',
        },
        {
            slug: 'entertainment',
            name: 'Releases',
            icon: '🎬',
            color: 'from-purple-500 to-pink-500',
            description: 'Movies, Series, Streaming drops',
        },
    ];

// ============================================
// CONTENT FILTERING RULES
// ============================================

// Crypto: Institutional-grade sources only
export const CRYPTO_TRUSTED_SOURCES = [
    'coindesk',
    'cointelegraph',
    'the block',
    'decrypt',
    'bloomberg',
    'reuters',
    'wsj',
];

// Keyword allowlists (article must contain at least one)
export const CRYPTO_ALLOWLIST = [
    'sec', 'etf', 'hack', 'exploit', 'upgrade', 'mainnet',
    'layer 2', 'governance', 'proposal', 'regulation', 'institutional',
    'adoption', 'bitcoin', 'ethereum', 'defi', 'stablecoin'
];

export const CRYPTO_BLOCKLIST = [
    'price prediction', 'to the moon', 'analyst says', 'influencer',
    'opinion', 'could reach', 'might hit', 'bullish target'
];

// Entertainment: Release-focused content only
export const ENTERTAINMENT_ALLOWLIST = [
    'release', 'now streaming', 'trailer', 'premiere', 'box office',
    'season premiere', 'official trailer', 'drops on netflix',
    'coming to', 'available on', 'launches on'
];

export const ENTERTAINMENT_BLOCKLIST = [
    'actor', 'actress', 'interview', 'relationship', 'divorce',
    'outfit', 'red carpet', 'statement', 'drama', 'scandal',
    'dating', 'married', 'broke up', 'feud'
];

/**
 * Filter article based on category-specific rules
 * Returns true if article should be KEPT
 */
export function shouldKeepArticle(article: {
    title: string;
    article: string;
    category: string;
    source: string
}): boolean {
    const text = `${article.title} ${article.article}`.toLowerCase();
    const source = article.source.toLowerCase();
    const category = article.category.toLowerCase();

    // Crypto filtering
    if (category === 'crypto') {
        // Check for blocked terms
        if (CRYPTO_BLOCKLIST.some(term => text.includes(term))) {
            return false;
        }
        // Must contain at least one allowed term
        if (!CRYPTO_ALLOWLIST.some(term => text.includes(term))) {
            return false;
        }
        return true;
    }

    // Entertainment filtering (releases only)
    if (category === 'entertainment') {
        // Check for blocked terms (gossip, drama)
        if (ENTERTAINMENT_BLOCKLIST.some(term => text.includes(term))) {
            return false;
        }
        // Must be about a release/drop
        if (!ENTERTAINMENT_ALLOWLIST.some(term => text.includes(term))) {
            return false;
        }
        return true;
    }

    // Technology/Markets: light filtering
    if (category === 'technology' || category === 'business') {
        // Block obvious noise
        const techBlocklist = ['opinion', 'review of'];
        if (techBlocklist.some(term => text.includes(term))) {
            return false;
        }
        return true;
    }

    // Block removed categories entirely
    const removedCategories = ['sports', 'health', 'science', 'world', 'politics'];
    if (removedCategories.includes(category)) {
        return false;
    }

    return true;
}

/**
 * Get category info by slug
 */
export function getCategoryBySlug(slug: string) {
    return CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Check if category is allowed
 */
export function isAllowedCategory(category: string): boolean {
    const allowed = ['crypto', 'technology', 'business', 'entertainment'];
    return allowed.includes(category.toLowerCase());
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


