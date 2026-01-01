'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Activity, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { href: '/command-center/mobile', label: 'Home', icon: Home },
    { href: '/markets/mobile', label: 'Markets', icon: TrendingUp },
    { href: '/signals', label: 'Signals', icon: Activity },
    { href: '/inbox', label: 'Inbox', icon: Bell },
    { href: '/profile/mobile', label: 'Profile', icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--void)]/95 backdrop-blur-xl border-t border-white/10 pb-safe-bottom">
            <div className="flex items-center justify-around px-2 py-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center min-w-[64px] px-3 py-2 rounded-xl transition-colors active:scale-95"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute inset-0 bg-[var(--accent-mint)]/10 rounded-xl"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <Icon
                                    size={22}
                                    className={`transition-colors ${
                                        isActive ? 'text-[var(--accent-mint)]' : 'text-zinc-500'
                                    }`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span
                                    className={`text-[10px] font-medium transition-colors ${
                                        isActive ? 'text-white' : 'text-zinc-600'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
