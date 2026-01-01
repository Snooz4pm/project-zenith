'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Settings, Crown, LogOut, HelpCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileTopNav() {
  const { data: session } = useSession();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 md:hidden bg-[var(--void)]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between h-16 px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Logo */}
          <Link href="/command-center" className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-[var(--accent-mint)] opacity-20"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
              <div
                className="absolute inset-[2px] bg-[var(--void)]"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
              <span className="relative text-[var(--accent-mint)] font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>Z</span>
            </div>
            <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Zenith</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link href="/notifications" className="p-2 hover:bg-white/5 rounded-lg transition-colors touch-target">
              <div className="relative">
                <Bell size={20} className="text-[var(--text-muted)]" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-[var(--accent-mint)] rounded-full shadow-[0_0_10px_var(--glow-mint)]" />
              </div>
            </Link>

            {/* Avatar - Opens Account Menu */}
            {session ? (
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="p-1 hover:bg-white/5 rounded-full transition-colors touch-target"
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-mint)] to-[var(--accent-cyan)] flex items-center justify-center text-xs font-bold text-white">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-[var(--accent-mint)] text-black font-bold text-sm rounded-lg active:scale-95 transition-transform"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Account Menu Slide-In (from right) */}
      <AnimatePresence>
        {showAccountMenu && session && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccountMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              style={{ top: '64px' }}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-16 right-0 bottom-0 w-[280px] bg-[var(--surface-1)] z-50 md:hidden border-l border-white/5 overflow-y-auto"
            >
              {/* Account Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" className="w-12 h-12 rounded-full border-2 border-[var(--accent-mint)]/30" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-mint)] to-[var(--accent-cyan)] flex items-center justify-center text-lg font-bold text-white">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">{session.user?.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{session.user?.email}</div>
                  </div>
                </div>
                {session.user?.isPremium && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg">
                    <Crown size={14} className="text-yellow-400" />
                    <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      Premium Member
                    </span>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2">
                <Link
                  href="/profile/settings"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors touch-target"
                >
                  <Settings size={18} className="text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-white">Settings</span>
                </Link>

                <Link
                  href="/profile/subscription"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors touch-target"
                >
                  <Crown size={18} className={session.user?.isPremium ? "text-yellow-400" : "text-[var(--text-muted)]"} />
                  <span className="text-sm font-medium text-white">
                    {session.user?.isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
                  </span>
                </Link>

                <Link
                  href="/help"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors touch-target"
                >
                  <HelpCircle size={18} className="text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-white">Help</span>
                </Link>

                <div className="my-4 h-px bg-white/5" />

                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl transition-colors touch-target"
                >
                  <LogOut size={18} className="text-[var(--accent-danger)]" />
                  <span className="text-sm font-medium text-[var(--accent-danger)]">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
