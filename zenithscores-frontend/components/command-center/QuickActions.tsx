'use client';

import { Zap, TrendingUp, FileText, BookOpen, Users, Newspaper, BarChart2, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface QuickAction {
    icon: any;
    label: string;
    href: string;
    color: string;
}

export default function QuickActions() {
    const router = useRouter();

    const actions: QuickAction[] = [
        { icon: Zap, label: 'Trade', href: '/trading', color: 'from-emerald-500 to-teal-500' },
        { icon: TrendingUp, label: 'Signals', href: '/signals', color: 'from-blue-500 to-cyan-500' },
        { icon: BarChart2, label: 'Markets', href: '/crypto', color: 'from-purple-500 to-pink-500' },
        { icon: FileText, label: 'Note', href: '/notebook', color: 'from-orange-500 to-amber-500' },
    ];

    return (
        <div className="px-4 py-6">
            <div className="grid grid-cols-4 gap-3">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={action.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            onClick={() => router.push(action.href)}
                            className="group flex flex-col items-center gap-2 p-4 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-white/5 rounded-2xl transition-all active:scale-95 touch-target"
                        >
                            {/* Icon Circle */}
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                <Icon size={20} className="text-white" strokeWidth={2.5} />
                            </div>

                            {/* Label */}
                            <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-white transition-colors">
                                {action.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
