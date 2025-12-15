/**
 * Category Page - Display articles for specific category
 */

import { notFound } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import { newsAPI, getCategoryBySlug } from '@/lib/api';

export const revalidate = 300; // Revalidate every 5 minutes

interface CategoryPageProps {
    params: {
        slug: string;
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const category = getCategoryBySlug(params.slug);

    if (!category) {
        notFound();
    }

    // Fetch articles for this category
    const data = await newsAPI.getArticlesByCategory(category.name, {
        limit: 30,
        minConfidence: 0.3,
        sortBy: 'confidence',
    });

    return (
        <div className="p-8">
            {/* Category Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`text-6xl p-4 bg-gradient-to-br ${category.color} rounded-2xl shadow-lg`}>
                        {category.icon}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
                        <p className="text-gray-600 mt-1">{category.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{data.count}</span>
                        <span>articles found</span>
                    </div>
                    {data.count > 0 && (
                        <>
                            <span className="text-gray-400">•</span>
                            <span>Sorted by confidence score</span>
                        </>
                    )}
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
                    <div className="text-6xl mb-4">{category.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No {category.name} articles yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Articles will appear here once the news pipeline collects them
                    </p>
                    <code className="inline-block bg-gray-100 px-4 py-2 rounded text-sm">
                        python run_pipeline.py{' '}
                        {category.slug}
                    </code>
                </div>
            )}

            {/* Stats Footer */}
            {data.count > 0 && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                    <h3 className="font-semibold text-gray-900 mb-3">Category Insights</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-gray-600">Total Articles</div>
                            <div className="text-2xl font-bold text-gray-900">{data.count}</div>
                        </div>
                        <div>
                            <div className="text-gray-600">Avg Confidence</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {Math.round(
                                    (data.articles.reduce((sum, a) => sum + a.category_confidence, 0) /
                                        data.articles.length) *
                                    100
                                )}
                                %
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-600">Unique Sources</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {new Set(data.articles.map((a) => a.source)).size}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-600">Avg Word Count</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {Math.round(
                                    data.articles
                                        .filter((a) => a.word_count)
                                        .reduce((sum, a) => sum + (a.word_count || 0), 0) /
                                    data.articles.filter((a) => a.word_count).length
                                ) || '—'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Generate static params for all categories
export async function generateStaticParams() {
    const { CATEGORIES } = await import('@/lib/api');
    return CATEGORIES.map((category) => ({
        slug: category.slug,
    }));
}
