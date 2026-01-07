'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, Users, BookOpen, Newspaper, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiscoverItem {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
}

const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    title: 'Community',
    description: 'Connect with traders',
    href: '/community',
    icon: Users,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Academy',
    description: 'Learn trading strategies',
    href: '/learning',
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Crypto Finds',
    description: 'Discover new tokens',
    href: '/markets/crypto-finds',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'News',
    description: 'Market updates',
    href: '/news',
    icon: Newspaper,
    color: 'from-orange-500 to-amber-500',
  },
];

export default function DiscoverWidget() {
  const router = useRouter();

  return (
    <div className="px-4 pb-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Discover
        </h2>
        <p className="text-xs text-[var(--text-muted)]">Explore features</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DISCOVER_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(item.href)}
              className="group relative p-5 bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/5 rounded-2xl active:scale-95 transition-transform overflow-hidden"
            >
              {/* Gradient Overlay (subtle) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-active:opacity-10 transition-opacity`} />

              {/* Icon */}
              <div className={`relative w-10 h-10 mb-3 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                <Icon size={18} className="text-white" strokeWidth={2.5} />
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">{item.description}</p>
              </div>

              {/* Arrow */}
              <div className="absolute top-3 right-3 opacity-0 group-active:opacity-100 transition-opacity">
                <ArrowRight size={14} className="text-[var(--accent-mint)]" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
