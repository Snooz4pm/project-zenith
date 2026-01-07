'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Activity, Book, User, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Hide on scroll down, show on scroll up
            // threshold of 10px to prevent jitter
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const navItems = [
        { label: 'Home', href: '/command-center', icon: LayoutDashboard },
        { label: 'Markets', href: '/crypto', icon: TrendingUp }, // Default to crypto for markets
        { label: 'Signals', href: '/signals', icon: Activity },
        { label: 'Note', href: '/notebook', icon: Book },
        { label: 'Profile', href: '/profile', icon: User },
    ];

    const isActive = (href: string) => {
        if (href === '/command-center') return pathname === '/' || pathname === '/command-center';
        if (href === '/crypto') return pathname.startsWith('/crypto') || pathname.startsWith('/stocks') || pathname.startsWith('/forex');
        return pathname.startsWith(href);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.nav
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)] bg-[#0a0a0c]/80 backdrop-blur-xl border-t border-white/5"
                >
                    <div className="flex justify-around items-center h-16 px-2">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-[var(--accent-mint)]' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    <div className={`relative p-1 rounded-xl transition-all ${active ? 'bg-[var(--accent-mint)]/10' : ''
                                        }`}>
                                        <Icon size={20} strokeWidth={active ? 2.5 : 2} />

                                        {active && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 rounded-xl bg-[var(--accent-mint)]/10"
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium">{item.label}</span>

                                    {active && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute top-0 w-8 h-1 rounded-b-full bg-[var(--accent-mint)] shadow-[0_0_10px_var(--accent-mint)]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
