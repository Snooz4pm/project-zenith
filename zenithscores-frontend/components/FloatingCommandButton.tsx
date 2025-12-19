'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Command, X, Home, TrendingUp, LineChart,
    BarChart3, Newspaper, Bell, Settings, FileText
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Scores', icon: Home, description: 'Main dashboard' },
    { href: '/crypto', label: 'Crypto', icon: TrendingUp, description: 'Crypto signals' },
    { href: '/stocks', label: 'Stocks', icon: LineChart, description: 'Stock analysis' },
    { href: '/trading', label: 'Signals', icon: BarChart3, description: 'Trading signals' },
    { href: '/news', label: 'News', icon: Newspaper, description: 'Market news' },
];

const secondaryItems = [
    { href: '#', label: 'Alerts', icon: Bell, description: 'Coming soon', disabled: true },
    { href: '/profile', label: 'Settings', icon: Settings, description: 'Preferences' },
    { href: '/terms', label: 'Legal', icon: FileText, description: 'Terms & Privacy' },
];

export default function FloatingCommandButton() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    return (
        <>
            {/* Floating Button - Only on mobile */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[90] md:hidden w-14 h-14 rounded-full 
                           bg-gradient-to-br from-cyan-500 to-purple-600 
                           flex items-center justify-center
                           shadow-[0_0_30px_rgba(0,240,255,0.4),0_4px_20px_rgba(0,0,0,0.5)]
                           border border-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
                <Command size={24} className="text-white" />

                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping opacity-30" />
            </motion.button>

            {/* Command Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm md:hidden"
                        />

                        {/* Command Panel (Bottom Sheet) */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[101] md:hidden
                                       bg-gradient-to-b from-gray-900 to-black
                                       rounded-t-3xl border-t border-white/10
                                       shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 rounded-full bg-white/20" />
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 
                                           flex items-center justify-center text-gray-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>

                            {/* Content */}
                            <div className="px-6 pb-8 pt-2">
                                {/* Header */}
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-white">Navigation</h2>
                                    <p className="text-xs text-gray-500">Quick access to all sections</p>
                                </div>

                                {/* Primary Navigation */}
                                <div className="space-y-1 mb-6">
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            // 🔧 WORKAROUND: Using <a> instead of <Link> due to Next.js routing freeze
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`
                                                    flex items-center gap-4 p-3 rounded-xl transition-all tap-feedback
                                                    ${active
                                                        ? 'bg-cyan-500/15 border border-cyan-500/30'
                                                        : 'hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-10 h-10 rounded-lg flex items-center justify-center
                                                    ${active
                                                        ? 'bg-cyan-500/20 text-cyan-400'
                                                        : 'bg-white/5 text-gray-400'
                                                    }
                                                `}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <div className={`font-medium ${active ? 'text-cyan-400' : 'text-white'}`}>
                                                        {item.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{item.description}</div>
                                                </div>
                                                {active && (
                                                    <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-white/10 mb-4" />

                                {/* Secondary Navigation */}
                                <div className="flex gap-2">
                                    {secondaryItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <a
                                                key={item.href}
                                                href={item.disabled ? '#' : item.href}
                                                onClick={(e) => {
                                                    if (item.disabled) {
                                                        e.preventDefault();
                                                    } else {
                                                        setIsOpen(false);
                                                    }
                                                }}
                                                className={`
                                                    flex-1 flex flex-col items-center gap-1 p-3 rounded-xl
                                                    ${item.disabled
                                                        ? 'opacity-40 cursor-not-allowed'
                                                        : 'hover:bg-white/5 tap-feedback'
                                                    }
                                                `}
                                            >
                                                <Icon size={18} className="text-gray-400" />
                                                <span className="text-xs text-gray-500">{item.label}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Safe area padding */}
                            <div className="pb-safe" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
