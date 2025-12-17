'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import UserMenu from './UserMenu';

export default function Navbar() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => pathname?.startsWith(path);

    // Track scroll for enhanced navbar effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/crypto', label: 'Crypto' },
        { href: '/stocks', label: 'Stocks' },
        { href: '/news', label: 'News' },
        { href: '/trading', label: 'Trading' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`
                fixed top-0 left-0 right-0 z-[100]
                transition-all duration-500 ease-out
                ${isScrolled
                    ? 'bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
                    : 'bg-transparent border-b border-transparent'
                }
            `}
        >
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Brand - Premium Minimalist with Glow */}
                <Link href="/" className="flex items-center gap-3 group">
                    <motion.div
                        className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden"
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
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-cyan-400 relative z-10 group-hover:text-cyan-300 transition-colors"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </motion.div>

                    <span className="text-lg font-bold tracking-tight">
                        <span className="text-white group-hover:text-cyan-300 transition-colors">ZENITH</span>
                        <span className="text-gray-500 font-medium">SCORES</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative group"
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
                            <span className={`
                                absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500
                                transition-all duration-300 ease-out
                                ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'}
                            `} />

                            {/* Active glow dot */}
                            {isActive(link.href) && (
                                <motion.span
                                    layoutId="nav-indicator"
                                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]"
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    <UserMenu />

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <AnimatePresence mode="wait">
                            {isMobileMenuOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X size={20} className="text-white" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu size={20} className="text-white" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="md:hidden overflow-hidden bg-black/90 backdrop-blur-xl border-b border-white/10"
                    >
                        <div className="container mx-auto px-6 py-6 space-y-2">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`
                                            block py-3 px-4 rounded-lg transition-all duration-200
                                            ${isActive(link.href)
                                                ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }
                                        `}
                                    >
                                        <span className="text-sm font-bold tracking-widest uppercase">
                                            {link.label}
                                        </span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
