/**
 * News Signal Portal - Integrated into Zenith Scores
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import { newsAPI } from '@/lib/api';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function NewsPage() {
  // Fetch top articles
  const data = await newsAPI.getTopArticles({
    limit: 20,
    hours: 24,
    minConfidence: 0.5,
  });

  // Fetch stats
  const stats = await newsAPI.getStats();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Back to Zenith Scores
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">📰</div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              News Signal
            </h1>
            <p className="text-gray-400">
              {data.count} high-confidence articles from the last {data.hours} hours
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel rounded-lg p-6 border-l-4 border-emerald-500">
          <div className="text-3xl font-bold text-white">
            {stats.total_articles.toLocaleString()}
          </div>
          <div className="text-gray-400 mt-1">Total Articles</div>
        </div>

        <div className="glass-panel rounded-lg p-6 border-l-4 border-purple-500">
          <div className="text-3xl font-bold text-white">
            {stats.categories.length}
          </div>
          <div className="text-gray-400 mt-1">Active Categories</div>
        </div>

        <div className="glass-panel rounded-lg p-6 border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-white">
            {stats.top_sources.length}
          </div>
          <div className="text-gray-400 mt-1">News Sources</div>
        </div>
      </div>

      {/* Articles Grid */}
      {data.articles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No articles found
          </h3>
          <p className="text-gray-400 mb-4">
            Run the news pipeline to start collecting articles
          </p>
          <code className="inline-block bg-gray-900 px-4 py-2 rounded text-sm text-emerald-400">
            python run_pipeline.py full
          </code>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Page auto-refreshes every 5 minutes
        </div>
      </div>
    </div>
  );
}
