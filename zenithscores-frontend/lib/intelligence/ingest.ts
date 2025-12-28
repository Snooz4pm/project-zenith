// Intelligence Feed - News Ingestion Logic

import { prisma } from '@/lib/prisma';
import { getCompanyNews, ALL_STOCKS } from '@/lib/finnhub';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

interface RawFinnhubNews {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

/**
 * Fetch general market news from Finnhub
 */
export async function fetchMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<RawFinnhubNews[]> {
    if (!FINNHUB_API_KEY) {
        console.error('[Intelligence] FINNHUB_API_KEY not set');
        return [];
    }

    try {
        const response = await fetch(
            `${BASE_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 300 } } // Cache 5 minutes
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[Intelligence] Failed to fetch market news:', error);
        return [];
    }
}

/**
 * Fetch company-specific news for watched assets
 */
export async function fetchCompanyNewsForAssets(symbols: string[]): Promise<RawFinnhubNews[]> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = weekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];

    const allNews: RawFinnhubNews[] = [];

    // Fetch news for each symbol (limited to avoid rate limits)
    const limitedSymbols = symbols.slice(0, 5);

    for (const symbol of limitedSymbols) {
        const news = await getCompanyNews(symbol, from, to);
        if (news) {
            allNews.push(...news.slice(0, 3)); // Max 3 per symbol
        }
    }

    return allNews;
}

/**
 * Detect asset tags from headline and summary text
 */
export function detectAssetTags(headline: string, summary: string, related?: string): string[] {
    const text = `${headline} ${summary} ${related || ''}`.toUpperCase();
    const tags: string[] = [];

    // Check for crypto mentions
    const cryptoKeywords = ['BTC', 'BITCOIN', 'ETH', 'ETHEREUM', 'CRYPTO', 'XRP', 'SOL', 'SOLANA'];
    for (const kw of cryptoKeywords) {
        if (text.includes(kw)) tags.push(kw === 'BITCOIN' ? 'BTC' : kw === 'ETHEREUM' ? 'ETH' : kw);
    }

    // Check for stock symbols
    for (const stock of ALL_STOCKS.slice(0, 50)) {
        if (text.includes(` ${stock} `) || text.includes(`${stock}:`)) {
            tags.push(stock);
        }
    }

    // Check for macro indicators
    const macroKeywords = ['CPI', 'GDP', 'FED', 'FOMC', 'INTEREST RATE', 'INFLATION', 'UNEMPLOYMENT'];
    for (const kw of macroKeywords) {
        if (text.includes(kw)) tags.push('MACRO');
    }

    return [...new Set(tags)];
}

/**
 * Classify news category based on content
 */
export function classifyCategory(headline: string, summary: string): string {
    const text = `${headline} ${summary}`.toLowerCase();

    if (text.includes('earnings') || text.includes('quarterly') || text.includes('revenue')) return 'earnings';
    if (text.includes('cpi') || text.includes('fed') || text.includes('gdp') || text.includes('inflation')) return 'macro';
    if (text.includes('merge') || text.includes('acquire') || text.includes('deal')) return 'merger';
    if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum')) return 'crypto';
    if (text.includes('tech') || text.includes('ai') || text.includes('software')) return 'tech';

    return 'general';
}

/**
 * Simple sentiment analysis based on keywords
 */
export function analyzeSentiment(headline: string, summary: string): number {
    const text = `${headline} ${summary}`.toLowerCase();

    const bullishWords = ['surge', 'rally', 'gain', 'rise', 'bullish', 'upgrade', 'beat', 'strong', 'growth', 'record', 'high', 'soar'];
    const bearishWords = ['drop', 'fall', 'crash', 'decline', 'bearish', 'downgrade', 'miss', 'weak', 'loss', 'plunge', 'low', 'tumble'];

    let score = 0;
    for (const word of bullishWords) if (text.includes(word)) score += 0.15;
    for (const word of bearishWords) if (text.includes(word)) score -= 0.15;

    return Math.max(-1, Math.min(1, score)); // Clamp between -1 and 1
}

/**
 * Calculate impact score based on source, recency, and content
 */
export function calculateImpactScore(news: RawFinnhubNews, assetTags: string[]): number {
    let score = 30; // Base score

    // Source reputation boost
    const premiumSources = ['reuters', 'bloomberg', 'wsj', 'cnbc', 'ft'];
    if (premiumSources.some(s => news.source.toLowerCase().includes(s))) {
        score += 25;
    }

    // Recency boost (more recent = higher impact)
    const ageHours = (Date.now() - news.datetime * 1000) / (1000 * 60 * 60);
    if (ageHours < 1) score += 30;
    else if (ageHours < 6) score += 20;
    else if (ageHours < 24) score += 10;

    // Asset specificity boost
    if (assetTags.length > 0) score += 10;
    if (assetTags.includes('MACRO')) score += 5;

    return Math.min(100, score);
}

/**
 * Ingest and store news items in database
 */
export async function ingestNews(): Promise<{ ingested: number; skipped: number }> {
    let ingested = 0;
    let skipped = 0;

    try {
        // Fetch general market news
        const generalNews = await fetchMarketNews('general');
        const cryptoNews = await fetchMarketNews('crypto');
        const allNews = [...generalNews.slice(0, 20), ...cryptoNews.slice(0, 10)];

        for (const news of allNews) {
            const externalId = `finnhub-${news.id}`;

            // Check if already exists
            const existing = await prisma.intelligenceItem.findUnique({
                where: { externalId }
            });

            if (existing) {
                skipped++;
                continue;
            }

            const assetTags = detectAssetTags(news.headline, news.summary, news.related);
            const category = classifyCategory(news.headline, news.summary);
            const sentiment = analyzeSentiment(news.headline, news.summary);
            const impactScore = calculateImpactScore(news, assetTags);

            await prisma.intelligenceItem.create({
                data: {
                    source: 'finnhub',
                    externalId,
                    headline: news.headline.slice(0, 500),
                    summary: news.summary,
                    url: news.url,
                    imageUrl: news.image || null,
                    publishedAt: new Date(news.datetime * 1000),
                    assetTags,
                    category,
                    sentiment,
                    impactScore
                }
            });

            ingested++;
        }

        return { ingested, skipped };
    } catch (error) {
        console.error('[Intelligence] Ingestion error:', error);
        return { ingested, skipped };
    }
}

/**
 * Get recent intelligence items from database
 */
export async function getRecentIntelligence(limit: number = 20) {
    return await prisma.intelligenceItem.findMany({
        orderBy: { publishedAt: 'desc' },
        take: limit
    });
}
