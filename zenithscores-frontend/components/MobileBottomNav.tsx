'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, LineChart, TrendingUp, Wallet } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Scores', icon: Home },
    { href: '/crypto', label: 'Crypto', icon: TrendingUp },
    { href: '/stocks', label: 'Stocks', icon: LineChart },
    { href: '/trading', label: 'Trading', icon: Wallet },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-t border-white/10" />

            {/* Safe area padding for notched devices */}
            <div className="relative flex items-center justify-around h-16 pb-safe">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-full h-full group"
                        >
                            {/* Active indicator glow */}
                            {active && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}

                            {/* Icon with tap feedback */}
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                transition={{ duration: 0.1 }}
                                className={`
                                    flex items-center justify-center w-12 h-12 rounded-xl
                                    transition-all duration-200
                                    ${active
                                        ? 'text-cyan-400'
                                        : 'text-gray-500 group-hover:text-gray-300'
                                    }
                                `}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={active ? 2.5 : 2}
                                    className={active ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : ''}
                                />
                            </motion.div>

                            {/* Label */}
                            <span className={`
                                text-[10px] font-medium tracking-wide uppercase mt-0.5
                                transition-colors duration-200
                                ${active
                                    ? 'text-cyan-400'
                                    : 'text-gray-600 group-hover:text-gray-400'
                                }
                            `}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
