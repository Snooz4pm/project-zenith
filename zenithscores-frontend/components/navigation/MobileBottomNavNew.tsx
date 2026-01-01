'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, Activity, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home', href: '/command-center/mobile', icon: Home },
  { label: 'Markets', href: '/markets/mobile', icon: TrendingUp },
  { label: 'Signals', href: '/signals', icon: Activity },
  { label: 'Inbox', href: '/inbox', icon: Bell },
  { label: 'Profile', href: '/profile/mobile', icon: User },
] as const;

export default function MobileBottomNavNew() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/command-center/mobile') {
      return pathname === '/' || pathname === '/command-center' || pathname === '/command-center/mobile';
    }
    if (href === '/markets/mobile') {
      return pathname.startsWith('/markets') || pathname.startsWith('/crypto') || pathname.startsWith('/stocks') || pathname.startsWith('/forex');
    }
    if (href === '/profile/mobile') {
      return pathname.startsWith('/profile') || pathname.startsWith('/user');
    }
    if (href === '/inbox') {
      return pathname.startsWith('/inbox') || pathname.startsWith('/messages') || pathname.startsWith('/notifications');
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--void)] border-t border-white/5 backdrop-blur-xl">
      <div className="grid grid-cols-5 h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`relative flex flex-col items-center justify-center gap-1 transition-colors touch-target ${
                active ? 'text-[var(--accent-mint)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[var(--accent-mint)] rounded-b-full shadow-[0_0_10px_var(--glow-mint)]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Icon */}
              <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-bold tracking-wide ${active ? 'text-[var(--accent-mint)]' : 'text-[var(--text-muted)]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
