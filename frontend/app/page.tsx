/**
 * Homepage - Top Articles Across All Categories
 */

import ArticleCard from '@/components/ArticleCard';
import { newsAPI } from '@/lib/api';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function HomePage() {
    // Fetch top articles
    const data = await newsAPI.getTopArticles({
        limit: 20,
        hours: 24,
        minConfidence: 0.5,
    });

    // Fetch stats
    const stats = await newsAPI.getStats();

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Top News Stories
                </h1>
                <p className="text-gray-600">
                    {data.count} high-confidence articles from the last {data.hours} hours
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.total_articles.toLocaleString()}
                    </div>
                    <div className="text-gray-600 mt-1">Total Articles</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.categories.length}
                    </div>
                    <div className="text-gray-600 mt-1">Active Categories</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.top_sources.length}
                    </div>
                    <div className="text-gray-600 mt-1">News Sources</div>
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
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">📰</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No articles found
                    </h3>
                    <p className="text-gray-600">
                        Run the news pipeline to start collecting articles
                    </p>
                    <code className="mt-4 inline-block bg-gray-100 px-4 py-2 rounded text-sm">
                        python run_pipeline.py full
                    </code>
                </div>
            )}

            {/* Auto-refresh indicator */}
            <div className="mt-8 text-center text-sm text-gray-500">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Page auto-refreshes every 5 minutes
                </div>
            </div>
        </div>
    );
}
