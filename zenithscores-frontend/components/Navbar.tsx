'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UserMenu from './UserMenu';
import ScoreAlerts from './ScoreAlerts';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/crypto', label: 'Crypto' },
        { href: '/stocks', label: 'Stocks' },
        { href: '/forex', label: 'Forex' },
        { href: '/signals', label: 'Signals' },
        { href: '/news', label: 'News' },
        { href: '/trading', label: 'Trading' },
        { href: '/learning', label: 'Learn' },
    ];

    return (
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
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`
                                relative h-full flex items-center px-1 transition-all duration-300
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
                        </Link>
                    ))}
                </div>

                {/* Right Side - Alerts + UserMenu */}
                <div className="flex items-center gap-3 relative z-10">
                    <ScoreAlerts />
                    <UserMenu />
                </div>
            </div>
        </nav>
    );
}

