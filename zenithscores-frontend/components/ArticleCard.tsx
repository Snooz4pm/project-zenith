/**
 * Article Card Component
 * Displays individual news article with confidence score, keywords, and AI summary
 */

import Link from 'next/link';
import type { Article } from '@/lib/news-types';
import { formatRelativeTime, getConfidenceColor } from '@/lib/news-api';

interface ArticleCardProps {
    article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
    const confidencePercent = Math.round(article.category_confidence * 100);
    const confidenceColor = getConfidenceColor(article.category_confidence);

    return (
        <article className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                        {article.title}
                    </a>
                </div>

                {/* Confidence Badge */}
                <div className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${confidenceColor}`}>
                    {confidencePercent}%
                </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                <span className="font-medium">{article.source}</span>
                <span className="text-gray-400">•</span>
                <span>{formatRelativeTime(article.fetched_at)}</span>
                {article.word_count && (
                    <>
                        <span className="text-gray-400">•</span>
                        <span>{article.word_count} words</span>
                    </>
                )}
            </div>

            {/* Article Preview */}
            <p className="text-gray-700 mb-4 line-clamp-3">{article.article}</p>

            {/* AI Summary (if available) */}
            {article.why_it_matters && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border-l-4 border-purple-500">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-purple-600 font-semibold text-sm">🤖 Why it matters</span>
                    </div>
                    <p className="text-gray-800 text-sm italic">{article.why_it_matters}</p>
                </div>
            )}

            {/* AI Importance Score */}
            {article.ai_importance !== undefined && article.ai_importance !== null && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium">AI Importance</span>
                        <span className="font-bold text-purple-600">
                            {Math.round(article.ai_importance * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${article.ai_importance * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Keywords */}
            {article.matched_keywords && article.matched_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {article.matched_keywords.slice(0, 5).map((keyword, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            #{keyword}
                        </span>
                    ))}
                </div>
            )}

            {/* Read More Link */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                    Read full article
                    <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                    </svg>
                </a>
            </div>
        </article>
    );
}
