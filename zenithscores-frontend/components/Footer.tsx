'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Database, Activity } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
    const [showDataSources, setShowDataSources] = useState(false);

    return (
        <footer className="border-t border-white/5 bg-black/40 backdrop-blur-md relative z-10">
            {/* Main Disclaimer */}
            <div className="container mx-auto px-6 py-8">
                <div className="glass-panel rounded-xl p-6 mb-6 border border-blue-500/20 bg-blue-950/10">
                    <div className="flex items-start gap-3 mb-3">
                        <Activity className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-white mb-2 text-sm">Educational & Informational Use Only</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                ZenithScores provides market data, scores, and insights for <strong>informational purposes only</strong>.
                                No content on this site constitutes financial advice, investment recommendations, or trading suggestions.
                                All information is provided "as-is" for educational analysis.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Sources Attribution - Collapsible */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowDataSources(!showDataSources)}
                        className="w-full glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                                Data Sources & Attribution
                            </span>
                        </div>
                        {showDataSources ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {showDataSources && (
                        <div className="mt-2 glass-panel rounded-xl p-6 border border-white/5 bg-white/5">
                            <p className="text-xs text-gray-400 mb-4">
                                ZenithScores aggregates data from the following sources. We are grateful for their APIs and services:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <h4 className="text-gray-300 font-semibold mb-2">Market Data</h4>
                                    <ul className="space-y-1 text-gray-500">
                                        <li>• Yahoo Finance (Stock prices & fundamentals)</li>
                                        <li>• CoinGecko (Cryptocurrency prices & metrics)</li>
                                        <li>• Alpha Vantage (Technical indicators)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-gray-300 font-semibold mb-2">News & Sentiment</h4>
                                    <ul className="space-y-1 text-gray-500">
                                        <li>• CryptoPanic (Crypto news aggregation)</li>
                                        <li>• NewsAPI (Stock & market news)</li>
                                        <li>• Proprietary sentiment algorithms</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-gray-300 font-semibold mb-2">Analytics</h4>
                                    <ul className="space-y-1 text-gray-500">
                                        <li>• Google Analytics (Usage statistics)</li>
                                        <li>• Vercel Analytics (Performance monitoring)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-gray-300 font-semibold mb-2">Infrastructure</h4>
                                    <ul className="space-y-1 text-gray-500">
                                        <li>• Neon Database (Data storage)</li>
                                        <li>• Vercel (Hosting & deployment)</li>
                                        <li>• GitHub (Version control)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Links & Copyright */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
                    <p className="text-gray-600 text-sm font-mono">
                        &copy; 2025 Zenith Scores. Institutional-Grade Intelligence.
                    </p>

                    <div className="flex items-center gap-6 text-sm">
                        <Link
                            href="/terms"
                            className="text-gray-400 hover:text-white transition-colors hover:underline"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-gray-400 hover:text-white transition-colors hover:underline"
                        >
                            Privacy Policy
                        </Link>
                        <a
                            href="mailto:legal@zenithscores.com"
                            className="text-gray-400 hover:text-white transition-colors hover:underline"
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
