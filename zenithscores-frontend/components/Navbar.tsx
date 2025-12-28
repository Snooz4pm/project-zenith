'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import UserMenu from './UserMenu';
import ScoreAlerts from './ScoreAlerts';
import LoadingOverlay from './LoadingOverlay';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isNavigating, setIsNavigating] = useState(false);
    const isLoggedIn = !!session?.user;

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/crypto', label: 'Crypto' },
        { href: '/stocks', label: 'Stocks' },
        { href: '/forex', label: 'Forex' },
        { href: '/learning', label: 'Learn' },
        { href: '/notebook', label: 'Notebook' },
        { href: '/trading', label: 'Trade' },
        { href: '/signals', label: 'Signals' },
        { href: '/news', label: 'News' },
    ];

    return (
        <>
            {/* Loading overlay during navigation */}
            {isNavigating && <LoadingOverlay />}

            <nav
                className="fixed top-0 left-0 right-0 z-[1000] bg-black/80 backdrop-blur-xl border-b border-white/10 w-full"
            >
                {/* Reduced height on mobile (h-14), full height on desktop (md:h-16) */}
                <div className="container mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
                    {/* Brand - Premium Minimalist with Glow */}
                    <Link href="/" className="flex items-center gap-2 md:gap-3 group">
                        <motion.div
                            className="relative w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Glow effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute inset-0 bg-cyan-500/20 blur-md" />
                            </div>

                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-cyan-400 relative z-10 group-hover:text-cyan-300 transition-colors md:w-[18px] md:h-[18px]"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </motion.div>

                        <span className="text-base md:text-lg font-bold tracking-tight">
                            <span className="text-white group-hover:text-cyan-300 transition-colors">ZENITH</span>
                            <span className="text-gray-500 font-medium">SCORES</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 h-full">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsNavigating(true);
                                    // Small delay to show overlay before navigation
                                    setTimeout(() => {
                                        window.location.href = link.href;
                                    }, 50);
                                }}
                                className={`
                                relative h-full flex items-center px-1 transition-all duration-300 cursor-pointer
                                ${isActive(link.href) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
                            `}
                            >
                                <span className={`
                                text-xs font-bold tracking-[0.15em] uppercase transition-colors duration-300
                                ${isActive(link.href)
                                        ? 'text-cyan-400'
                                        : 'text-gray-400 hover:text-white'
                                    }
                            `}>
                                    {link.label}
                                </span>

                                {/* Animated underline */}
                                <div className={`
                                absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500
                                transition-all duration-300 ease-out pointer-events-none
                                ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'}
                            `} />

                                {/* Active glow dot */}
                                {isActive(link.href) && (
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] pointer-events-none" />
                                )}
                            </a>
                        ))}
                    </div>

                    {/* Right Side - Generic Mode Badge + Alerts + UserMenu */}
                    <div className="flex items-center gap-3 relative z-10">
                        {/* Generic Mode Badge - Shows for anonymous users */}
                        <AnimatePresence>
                            {!isLoggedIn && status !== 'loading' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700/50"
                                >
                                    <Eye size={14} className="text-gray-400" />
                                    <span className="text-xs text-gray-400 font-medium">Generic Mode</span>
                                    <Link
                                        href="/auth/login"
                                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                                    >
                                        Personalize
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Personalized badge for logged-in users */}
                        {isLoggedIn && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20"
                            >
                                <Sparkles size={12} className="text-cyan-400" />
                                <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wide">Personalized</span>
                            </motion.div>
                        )}

                        <ScoreAlerts />
                        <UserMenu />
                    </div>
                </div>
            </nav>
        </>
    );
}

