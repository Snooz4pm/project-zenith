'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Database, Activity, Github, Twitter, Mail, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Footer() {
    const [showDataSources, setShowDataSources] = useState(false);

    const socialLinks = [
        { icon: Twitter, href: 'https://twitter.com/zenithscores', label: 'Twitter' },
        { icon: Github, href: 'https://github.com/zenithscores', label: 'GitHub' },
        { icon: Mail, href: 'mailto:contact@zenithscores.com', label: 'Email' },
    ];

    return (
        <footer className="relative z-10 border-t border-zinc-800 bg-[#0B0E14] overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />

            {/* Mesh Gradient Accent */}
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 py-12 relative">
                {/* Main Disclaimer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel rounded-2xl p-6 mb-8 border border-cyan-500/20 bg-cyan-950/10 backdrop-blur-xl"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                            <Activity className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-2 text-sm">Educational & Informational Use Only</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                ZenithScores provides market data, scores, and insights for <strong className="text-gray-300">informational purposes only</strong>.
                                No content on this site constitutes financial advice, investment recommendations, or trading suggestions.
                                All information is provided &quot;as-is&quot; for educational analysis.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Data Sources Attribution - Collapsible */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => setShowDataSources(!showDataSources)}
                        className="w-full glass-panel rounded-xl p-4 hover:bg-white/5 transition-all duration-300 flex items-center justify-between group border border-white/5 hover:border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
                                <Database className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                                Data Sources & Attribution
                            </span>
                        </div>
                        <motion.div
                            animate={{ rotate: showDataSources ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {showDataSources && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 glass-panel rounded-xl p-6 border border-white/5 bg-white/[0.02]">
                                    <p className="text-xs text-gray-400 mb-6">
                                        ZenithScores aggregates data from the following sources. We are grateful for their APIs and services:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                                        <div className="space-y-3">
                                            <h4 className="text-gray-200 font-semibold flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                                                Market Data
                                            </h4>
                                            <ul className="space-y-2 text-gray-500">
                                                <li className="hover:text-gray-300 transition-colors">• Yahoo Finance</li>
                                                <li className="hover:text-gray-300 transition-colors">• CoinGecko</li>
                                                <li className="hover:text-gray-300 transition-colors">• Alpha Vantage</li>
                                            </ul>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-gray-200 font-semibold flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                                                News & Sentiment
                                            </h4>
                                            <ul className="space-y-2 text-gray-500">
                                                <li className="hover:text-gray-300 transition-colors">• CryptoPanic</li>
                                                <li className="hover:text-gray-300 transition-colors">• NewsAPI</li>
                                                <li className="hover:text-gray-300 transition-colors">• Proprietary AI</li>
                                            </ul>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-gray-200 font-semibold flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                                                Analytics
                                            </h4>
                                            <ul className="space-y-2 text-gray-500">
                                                <li className="hover:text-gray-300 transition-colors">• Google Analytics</li>
                                                <li className="hover:text-gray-300 transition-colors">• Vercel Analytics</li>
                                            </ul>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-gray-200 font-semibold flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                                                Infrastructure
                                            </h4>
                                            <ul className="space-y-2 text-gray-500">
                                                <li className="hover:text-gray-300 transition-colors">• Neon Database</li>
                                                <li className="hover:text-gray-300 transition-colors">• Vercel</li>
                                                <li className="hover:text-gray-300 transition-colors">• GitHub</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Footer Links & Copyright */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5"
                >
                    {/* Left: Logo & Copyright */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-sm font-bold">
                                <span className="text-white">ZENITH</span>
                                <span className="text-gray-500">SCORES</span>
                            </span>
                        </div>
                        <span className="text-gray-600 text-xs font-mono">
                            © 2025 · Institutional-Grade Intelligence
                        </span>
                    </div>

                    {/* Center: Social Links */}
                    <div className="flex items-center gap-3">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                            >
                                <social.icon size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' }} />
                            </a>
                        ))}
                    </div>

                    {/* Right: Legal Links */}
                    <div className="flex items-center gap-6 text-sm">
                        <Link
                            href="/terms"
                            className="text-gray-400 hover:text-white transition-colors relative group"
                        >
                            Terms
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-gray-400 hover:text-white transition-colors relative group"
                        >
                            Privacy
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <a
                            href="mailto:legal@zenithscores.com"
                            className="text-gray-400 hover:text-white transition-colors relative group flex items-center gap-1"
                        >
                            Contact
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
