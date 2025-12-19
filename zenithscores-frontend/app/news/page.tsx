/**
 * Enhanced News Signal Portal
 * Features: Top Story, Category Filters, Refresh Controls, Bookmarks View
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Pause,
  Play,
  Bookmark,
  Filter,
  Clock,
  TrendingUp,
  Newspaper
} from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import UniversalLoader from '@/components/UniversalLoader';
import { newsAPI, CATEGORIES } from '@/lib/news-api';
import type { Article } from '@/lib/news-types';

interface StatsData {
  total_articles: number;
  categories: Array<{ name: string; count: number; avg_confidence: number }>;
  top_sources: Array<{ source: string; count: number; avg_confidence: number }>;
}

// Format date for display
function formatArticleDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

const ARTICLES_PER_PAGE = 12;

export default function NewsPage() {
  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Expandable top story
  const [expandedTopStory, setExpandedTopStory] = useState(false);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);

      let data;
      if (selectedCategory) {
        data = await newsAPI.getArticlesByCategory(selectedCategory, {
          limit: 100,
          minConfidence: 0.1,
        });
      } else {
        data = await newsAPI.getTopArticles({
          limit: 100,
          hours: 168,
          minConfidence: 0.1,
        });
      }

      const statsData = await newsAPI.getStats();

      setArticles(data.articles);
      setStats(statsData);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Load bookmarks from localStorage
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
    setBookmarkedIds(bookmarks);

    // Listen for bookmark changes
    const handleStorage = () => {
      const updated = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
      setBookmarkedIds(updated);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchArticles();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchArticles]);

  // Get top story (highest confidence in recent articles)
  const topStory = articles.length > 0
    ? articles.reduce((best, current) =>
      current.category_confidence > best.category_confidence ? current : best
    )
    : null;

  // Filter articles (excluding top story)
  const filteredArticles = articles.filter(a => a.id !== topStory?.id);

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  // Get bookmarked articles
  const bookmarkedArticles = articles.filter(a => bookmarkedIds.includes(a.id));

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Manual refresh
  const handleRefresh = () => {
    fetchArticles();
  };

  // Time since last refresh
  const timeSinceRefresh = () => {
    const diff = Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  // Error state
  if (error && !articles.length) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Zenith Scores
        </Link>

        <div className="glass-panel rounded-lg p-12 text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-6">⚠️</div>
          <h3 className="text-2xl font-semibold text-white mb-4">
            News Signal API Unavailable
          </h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 md:pt-24">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Inline Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-emerald-400" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">News Signal</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {stats?.total_articles.toLocaleString() || '...'} articles indexed
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Bookmarks toggle */}
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${showBookmarks
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
            >
              <Bookmark size={16} />
              <span className="text-sm font-medium">{bookmarkedIds.length}</span>
            </button>

            {/* Refresh controls */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-1.5 rounded transition-colors ${autoRefresh ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
              >
                {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`p-1.5 rounded transition-colors ${loading ? 'text-gray-600 animate-spin' : 'text-gray-400 hover:text-white'
                  }`}
                title="Refresh now"
              >
                <RefreshCw size={16} />
              </button>
              <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                {timeSinceRefresh()}
              </span>
            </div>
          </div>
        </div>
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-400">Filter by category</span>
          </div>
          <div className="flex overflow-x-auto pb-2 gap-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap flex-shrink-0 ${selectedCategory === cat.slug
                  ? `bg-gradient-to-r ${cat.color} text-white`
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && articles.length === 0 && (
          <UniversalLoader size="lg" message="Loading news..." />
        )}

        {/* Bookmarks View */}
        {showBookmarks && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Bookmark className="text-blue-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Saved Articles</h2>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                {bookmarkedArticles.length}
              </span>
            </div>

            {bookmarkedArticles.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {bookmarkedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-8 text-center">
                <Bookmark className="mx-auto mb-4 text-gray-600" size={40} />
                <p className="text-gray-400">No saved articles yet</p>
                <p className="text-gray-600 text-sm mt-1">Click the bookmark icon on any article to save it</p>
              </div>
            )}

            <div className="border-t border-white/10 my-12" />
          </div>
        )}

        {/* Top Story Section with Expandable Summary */}
        {!showBookmarks && topStory && !selectedCategory && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-yellow-400" size={24} />
                <h2 className="text-2xl font-bold text-white">Top Story</h2>
                <span className="text-xs text-gray-500">{formatArticleDate(topStory.fetched_at)}</span>
              </div>
              <button
                onClick={() => setExpandedTopStory(!expandedTopStory)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors"
              >
                {expandedTopStory ? 'Collapse' : 'Read Full Summary'}
              </button>
            </div>

            {/* Expandable Summary View */}
            {expandedTopStory ? (
              <div className="glass-panel rounded-2xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white`}>
                    {topStory.category}
                  </span>
                  <span className="text-gray-400 text-sm">{topStory.source}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400 text-sm">{formatArticleDate(topStory.fetched_at)}</span>
                </div>

                <h3 className="text-3xl font-bold text-white mb-6 leading-tight">
                  {topStory.title}
                </h3>

                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {topStory.article}
                  </p>
                </div>

                {topStory.why_it_matters && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-6">
                    <h4 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                      🤖 AI Analysis: Why It Matters
                    </h4>
                    <p className="text-gray-300 leading-relaxed">{topStory.why_it_matters}</p>
                  </div>
                )}

                {topStory.matched_keywords && topStory.matched_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {topStory.matched_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm bg-white/5 text-gray-400 rounded-full"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <span className="text-sm text-gray-500">
                    Confidence: {Math.round(topStory.category_confidence * 100)}%
                  </span>
                  <a
                    href={topStory.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Read Original Source →
                  </a>
                </div>
              </div>
            ) : (
              <ArticleCard article={topStory} isTopStory={true} />
            )}
          </div>
        )}

        {/* Stats Overview (only when not filtering) */}
        {!selectedCategory && !showBookmarks && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-panel rounded-xl p-5 border-l-4 border-emerald-500">
              <div className="text-2xl font-bold text-white">{articles.length}</div>
              <div className="text-gray-400 text-sm mt-1">Articles shown</div>
            </div>
            <div className="glass-panel rounded-xl p-5 border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-white">{stats.categories.length}</div>
              <div className="text-gray-400 text-sm mt-1">Categories</div>
            </div>
            <div className="glass-panel rounded-xl p-5 border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-white">{stats.top_sources.length}</div>
              <div className="text-gray-400 text-sm mt-1">Sources</div>
            </div>
          </div>
        )}

        {/* Articles Grid with Pagination */}
        {!showBookmarks && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {selectedCategory
                  ? `${CATEGORIES.find(c => c.slug === selectedCategory)?.icon || ''} ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} News`
                  : 'Latest Articles'
                }
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {filteredArticles.length} articles
                </span>
                {totalPages > 1 && (
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
            </div>

            {paginatedArticles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedArticles.map((article) => (
                    <div key={article.id} className="relative">
                      {/* Date badge */}
                      <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-gray-300">
                        {formatArticleDate(article.fetched_at)}
                      </div>
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-bold transition-colors ${currentPage === pageNum
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-panel rounded-xl p-12 text-center">
                <Newspaper className="mx-auto mb-4 text-gray-600" size={48} />
                <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                <p className="text-gray-400">
                  {selectedCategory
                    ? `No articles in ${selectedCategory} category yet`
                    : 'Waiting for news pipeline to collect articles'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 glass-panel px-5 py-3 rounded-full">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">
              {autoRefresh ? 'Auto-refresh every 5 minutes' : 'Auto-refresh paused'}
            </span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              Last updated: {timeSinceRefresh()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
