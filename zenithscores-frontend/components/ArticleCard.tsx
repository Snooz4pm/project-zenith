/**
 * Enhanced Article Card Component
 * Dark theme with thumbnail, reading time, category badge, bookmark
 */

'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Bookmark, BookmarkCheck, Clock, TrendingUp, MessageCircle, Bell, Share2 } from 'lucide-react';
import type { Article } from '@/lib/news-types';
import { formatRelativeTime, getCategoryBySlug, CATEGORIES } from '@/lib/news-api';

interface ArticleCardProps {
    article: Article;
    isTopStory?: boolean;
}

// Calculate reading time from word count
function getReadingTime(wordCount?: number): string {
    if (!wordCount) return '2 min read';
    const minutes = Math.ceil(wordCount / 200); // Average reading speed
    return `${minutes} min read`;
}

// Get category color
function getCategoryColor(category: string): string {
    const cat = CATEGORIES.find(c => c.slug.toLowerCase() === category.toLowerCase());
    if (cat) return cat.color;
    return 'from-gray-500 to-gray-600';
}

// Get category icon
function getCategoryIcon(category: string): string {
    const cat = CATEGORIES.find(c => c.slug.toLowerCase() === category.toLowerCase());
    if (cat) return cat.icon;
    return '📰';
}

// Generate placeholder thumbnail based on category
function getThumbnailUrl(category: string, title: string): string {
    const encodedTitle = encodeURIComponent(title.slice(0, 30));
    const colors: Record<string, string> = {
        technology: '3b82f6',
        business: '10b981',
        politics: 'ef4444',
        entertainment: 'a855f7',
        sports: 'f97316',
        health: '14b8a6',
        science: '6366f1',
        world: '64748b',
    };
    const color = colors[category.toLowerCase()] || '6b7280';
    return `https://placehold.co/400x200/${color}/ffffff?text=${encodedTitle}`;
}

export default function ArticleCard({ article, isTopStory = false }: ArticleCardProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Load bookmark state from localStorage
    useEffect(() => {
        const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
        setIsBookmarked(bookmarks.includes(article.id));
    }, [article.id]);

    // Toggle bookmark
    const toggleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
        let newBookmarks;

        if (isBookmarked) {
            newBookmarks = bookmarks.filter((id: number) => id !== article.id);
        } else {
            newBookmarks = [...bookmarks, article.id];
        }

        localStorage.setItem('newsBookmarks', JSON.stringify(newBookmarks));
        setIsBookmarked(!isBookmarked);
    };

    const confidencePercent = Math.round(article.category_confidence * 100);
    const readingTime = getReadingTime(article.word_count);
    const isNew = new Date().getTime() - new Date(article.fetched_at).getTime() < 3600000; // 1 hour

    // Top Story variant
    if (isTopStory) {
        return (
            <article className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-white/20 transition-all duration-300">
                {/* Background gradient glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${getCategoryColor(article.category)} opacity-10 group-hover:opacity-20 transition-opacity`} />

                <div className="relative p-5 sm:p-8 lg:p-10">
                    {/* Top badges */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                                <TrendingUp size={14} />
                                <span className="hidden sm:inline">Top Story</span>
                                <span className="sm:hidden">Top</span>
                            </span>
                            {isNew && (
                                <span className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-pulse">
                                    NEW
                                </span>
                            )}
                        </div>
                        <button
                            onClick={toggleBookmark}
                            className={`p-2 rounded-lg transition-all ${isBookmarked
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                        </button>
                    </div>

                    {/* Category badge */}
                    <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(article.category)} text-white text-xs font-semibold`}>
                            {getCategoryIcon(article.category)} {article.category}
                        </span>
                        <span className="text-gray-500 text-xs sm:text-sm">•</span>
                        <span className="text-gray-400 text-xs sm:text-sm">{article.source}</span>
                    </div>

                    {/* Title */}
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group/link"
                    >
                        <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight group-hover/link:text-blue-400 transition-colors">
                            {article.title}
                        </h2>
                    </a>

                    {/* Article preview */}
                    <p className="text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
                        {article.article}
                    </p>

                    {/* Meta info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} />
                                {readingTime}
                            </span>
                            <span>{formatRelativeTime(article.fetched_at)}</span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono text-xs">
                                {confidencePercent}% match
                            </span>
                        </div>

                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs sm:text-sm hover:bg-gray-200 transition-colors w-full sm:w-auto"
                        >
                            Read Full Story
                            <ExternalLink size={14} />
                        </a>
                    </div>

                    {/* Keywords */}
                    {article.matched_keywords && article.matched_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                            {article.matched_keywords.slice(0, 4).map((keyword, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                >
                                    #{keyword}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </article>
        );
    }

    const handleShare = async () => {
        if (!confirm('Share this article to the community?')) return;

        try {
            await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'insight',
                    content: `Found this interesting article: ${article.title}`,
                    asset: { symbol: 'NEWS', name: article.source, price: 0, score: 0 } // Mock asset for now
                })
            });
            alert('Shared to community!');
        } catch (e) {
            console.error(e);
            alert('Failed to share.');
        }
    };

    // Regular card variant
    return (
        <article className="group relative overflow-hidden rounded-xl bg-gray-900/50 border border-white/10 hover:border-white/20 hover:bg-gray-900/80 transition-all duration-300">
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={imageError ? getThumbnailUrl(article.category, article.title) : getThumbnailUrl(article.category, article.title)}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

                {/* Floating badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(article.category)} text-white text-xs font-semibold shadow-lg`}>
                        {getCategoryIcon(article.category)} {article.category}
                    </span>

                    <div className="flex items-center gap-2">
                        {isNew && (
                            <span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg animate-pulse">
                                NEW
                            </span>
                        )}
                        <button
                            onClick={toggleBookmark}
                            className={`p-1.5 rounded-full shadow-lg transition-all ${isBookmarked
                                ? 'bg-blue-500 text-white'
                                : 'bg-black/50 text-white hover:bg-black/70'
                                }`}
                        >
                            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Source and time */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="font-medium text-gray-400">{article.source}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(article.fetched_at)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {readingTime}
                    </span>
                </div>

                {/* Title */}
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-3"
                >
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {article.title}
                    </h3>
                </a>

                {/* Article preview */}
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
                    {article.article}
                </p>

                {/* AI Summary (if available) */}
                {article.why_it_matters && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold mb-1">
                            <span>🤖</span> Why it matters
                        </div>
                        <p className="text-gray-300 text-xs italic line-clamp-2">{article.why_it_matters}</p>
                    </div>
                )}

                {/* Engagement Buttons */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        <Share2 size={14} />
                        Share to Community
                    </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1.5">
                        {article.matched_keywords?.slice(0, 3).map((keyword, index) => (
                            <span
                                key={index}
                                className="px-2 py-0.5 text-xs bg-white/5 text-gray-500 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                            >
                                #{keyword}
                            </span>
                        ))}
                    </div>

                    {/* Confidence */}
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${confidencePercent >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        confidencePercent >= 60 ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                        }`}>
                        {confidencePercent}%
                    </span>
                </div>
            </div>
        </article>
    );
}
