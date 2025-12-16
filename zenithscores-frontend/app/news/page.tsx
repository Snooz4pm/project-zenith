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
import { newsAPI, CATEGORIES } from '@/lib/news-api';
import type { Article } from '@/lib/news-types';

interface StatsData {
  total_articles: number;
  categories: Array<{ name: string; count: number; avg_confidence: number }>;
  top_sources: Array<{ source: string; count: number; avg_confidence: number }>;
}

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

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);

      let data;
      if (selectedCategory) {
        data = await newsAPI.getArticlesByCategory(selectedCategory, {
          limit: 30,
          minConfidence: 0.4,
        });
      } else {
        data = await newsAPI.getTopArticles({
          limit: 30,
          hours: 48,
          minConfidence: 0.4,
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

  // Get bookmarked articles
  const bookmarkedArticles = articles.filter(a => bookmarkedIds.includes(a.id));

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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 md:gap-6">
              <Link
                href="/"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center gap-2 md:gap-3">
                <Newspaper className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
                <div>
                  <h1 className="text-base md:text-xl font-bold text-white">News Signal</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {stats?.total_articles.toLocaleString() || '...'} articles indexed
                  </p>
                </div>
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
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
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
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw size={40} className="mx-auto mb-4 text-emerald-400 animate-spin" />
              <p className="text-gray-400">Loading news...</p>
            </div>
          </div>
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

        {/* Top Story Section */}
        {!showBookmarks && topStory && !selectedCategory && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-yellow-400" size={24} />
              <h2 className="text-2xl font-bold text-white">Top Story</h2>
            </div>
            <ArticleCard article={topStory} isTopStory={true} />
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

        {/* Articles Grid */}
        {!showBookmarks && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {selectedCategory
                  ? `${CATEGORIES.find(c => c.slug === selectedCategory)?.icon || ''} ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} News`
                  : 'Latest Articles'
                }
              </h2>
              <span className="text-sm text-gray-500">
                {filteredArticles.length} articles
              </span>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
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
