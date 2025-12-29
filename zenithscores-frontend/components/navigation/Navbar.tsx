'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, BookOpen, Wallet, Menu, X, ChevronDown, User, LogOut, Newspaper, Book, Users, Mail, Settings } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import NotificationBell from '@/components/community/NotificationBell';

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; description: string }[];
}

// Public links - shown to everyone
const PUBLIC_LINKS: NavLink[] = [
  {
    label: 'Markets',
    href: '/crypto',
    icon: <TrendingUp size={16} />,
    children: [
      { label: 'Crypto', href: '/crypto', description: 'Cryptocurrency markets' },
      { label: 'Stocks', href: '/stocks', description: 'Stock market data' },
      { label: 'Forex', href: '/forex', description: 'Currency pairs' }
    ]
  },
  { label: 'News', href: '/news', icon: <Newspaper size={16} /> }
];

// Private links - shown only when logged in
const PRIVATE_LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/command-center', icon: <LayoutDashboard size={16} /> },
  { label: 'Learn', href: '/learning', icon: <BookOpen size={16} /> },
  { label: 'Notebook', href: '/notebook', icon: <Book size={16} /> },
  { label: 'Trade', href: '/trading', icon: <Wallet size={16} /> },
  { label: 'Community', href: '/community', icon: <Users size={16} /> }
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Combine nav links based on auth state
  const NAV_LINKS = useMemo(() => {
    if (session) {
      // Logged in: Dashboard first, then private links, then public
      return [...PRIVATE_LINKS, ...PUBLIC_LINKS];
    }
    // Logged out: Only public links
    return PUBLIC_LINKS;
  }, [session]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (activeDropdown && !target.closest('.user-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const isActive = (href: string) => {
    if (href === '/command-center') return pathname === '/command-center' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
      ? 'bg-[rgba(5,5,8,0.8)] backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]'
      : 'bg-transparent'
      }`}>
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-10 h-10 flex items-center justify-center transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(20,241,149,0.5)]">
              {/* Geometric Hexagon Logo */}
              <div
                className="absolute inset-0 bg-[var(--accent-mint)] opacity-20 group-hover:opacity-100 transition-opacity duration-300"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
              <div
                className="absolute inset-[2px] bg-[var(--surface-1)]"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
              <span className="relative text-[var(--accent-mint)] font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>Z</span>
            </div>

            <div className="hidden sm:block">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                  ZenithScores
                </span>
                <span className="text-[10px] text-[var(--accent-mint)] uppercase tracking-[0.3em] font-medium" style={{ fontFamily: "var(--font-data)" }}>
                  INTELLIGENCE
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden xl:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <div key={link.href} className="relative group">
                {link.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 ${isActive(link.href)
                      ? 'text-[var(--accent-mint)] text-glow'
                      : 'text-[var(--text-secondary)] hover:text-white'
                      }`} style={{ fontFamily: "var(--font-body)" }}>
                      <span>{link.label}</span>
                      <ChevronDown size={10} className={`opacity-50 transition-transform duration-300 ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 p-2 rounded-xl glass-panel origin-top transition-all duration-200 ${activeDropdown === link.label ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                      }`}>
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-3 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group/item"
                        >
                          <div className="font-medium text-sm text-[var(--text-primary)] group-hover/item:text-[var(--accent-mint)]" style={{ fontFamily: "var(--font-body)" }}>
                            {child.label}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">{child.description}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={`relative text-sm font-medium transition-all duration-300 ${isActive(link.href)
                      ? 'text-[var(--accent-mint)] text-glow'
                      : 'text-[var(--text-secondary)] hover:text-white'
                      }`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {link.label}
                    {isActive(link.href) && (
                      <span className="absolute -bottom-2 left-0 right-0 h-px bg-[var(--accent-mint)] shadow-[0_0_10px_var(--accent-mint)]" />
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="hidden md:flex items-center gap-3">
                {/* Inbox Link */}
                <Link
                  href="/inbox"
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Inbox"
                >
                  <Mail size={18} />
                </Link>

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Menu Dropdown */}
                <div className="relative user-dropdown">
                  <button
                    className="flex items-center gap-3 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--accent-mint)] transition-all"
                    onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  >
                    {session.user?.image ? (
                      <img src={session.user.image} alt={session.user.name || 'User'} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-mint)]/20 text-[var(--accent-mint)] flex items-center justify-center text-xs font-bold">
                        {session.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-body)" }}>
                      {session.user?.name || 'Operator'}
                    </span>
                    <ChevronDown size={12} className={`text-zinc-500 transition-transform ${activeDropdown === 'user' ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute top-full right-0 mt-2 w-56 p-2 rounded-xl glass-panel origin-top-right transition-all duration-200 ${activeDropdown === 'user' ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                    }`}>
                    <Link
                      href={`/user/${session.user?.id}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group/item"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <User size={16} className="text-[var(--accent-mint)]" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white group-hover/item:text-[var(--accent-mint)] transition-colors">Public Profile</div>
                        <div className="text-xs text-[var(--text-muted)]">View your profile</div>
                      </div>
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group/item"
                      onClick={() => setActiveDropdown(null)}
                    >
                      <Settings size={16} className="text-zinc-400 group-hover/item:text-white transition-colors" />
                      <div className="text-sm text-white">Settings</div>
                    </Link>

                    <div className="my-2 h-px bg-white/5" />

                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors text-left group/item"
                    >
                      <LogOut size={16} className="text-[var(--accent-danger)]" />
                      <div className="text-sm text-[var(--accent-danger)] group-hover/item:text-red-400 transition-colors">Sign Out</div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/auth/register"
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-white border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.02)] transition-all"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/login"
                  className="group relative px-6 py-2.5 rounded-lg text-sm font-bold text-[var(--void)] bg-[var(--accent-mint)] overflow-hidden transition-all hover:shadow-[0_0_20px_var(--glow-mint)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Login
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-[var(--text-secondary)] hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-20 bg-[var(--surface-1)] z-40 overflow-y-auto border-t border-[rgba(255,255,255,0.05)]">
          <div className="p-6 space-y-6">
            {NAV_LINKS.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--accent-mint)] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {link.icon}
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-9 mt-4 space-y-4 border-l border-[rgba(255,255,255,0.05)] pl-4">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm text-[var(--text-muted)] hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {!session && (
              <div className="pt-8 space-y-4">
                <Link
                  href="/auth/login"
                  className="block w-full py-3 text-center rounded-lg bg-[var(--accent-mint)] text-[var(--void)] font-bold"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full py-3 text-center rounded-lg border border-[rgba(255,255,255,0.1)] text-white"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
