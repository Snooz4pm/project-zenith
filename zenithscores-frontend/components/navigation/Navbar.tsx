'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, BookOpen, Wallet, BarChart3, Menu, X, ChevronDown, User, LogOut, Newspaper } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={16} /> },
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
  { label: 'Learn', href: '/learning', icon: <BookOpen size={16} /> },
  { label: 'Trade', href: '/trading', icon: <Wallet size={16} /> },
  { label: 'Charts', href: '/charts', icon: <BarChart3 size={16} /> },
  { label: 'News', href: '/news', icon: <Newspaper size={16} /> }
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-black/80 backdrop-blur-xl border-b border-[#14f195]/20'
        : 'bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-lg bg-[#14f195] flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(20,241,149,0.5)]">
              <span className="text-black font-bold text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Z</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                ZenithScores
              </span>
              <div className="text-[9px] text-[#14f195] uppercase tracking-[0.2em] -mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Intelligence
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.href} className="relative">
                {link.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                        ? 'text-[#14f195]'
                        : 'text-zinc-400 hover:text-white'
                      }`} style={{ fontFamily: "'Syne', sans-serif" }}>
                      {link.icon}
                      <span>{link.label}</span>
                      <ChevronDown size={12} className={`transition-transform ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === link.label && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-black/95 backdrop-blur-xl rounded-xl border border-zinc-800 p-2 shadow-2xl">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-3 rounded-lg hover:bg-zinc-900 transition-colors group"
                          >
                            <div className="font-medium text-sm text-zinc-200 group-hover:text-[#14f195]" style={{ fontFamily: "'Syne', sans-serif" }}>
                              {child.label}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">{child.description}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                        ? 'text-[#14f195]'
                        : 'text-zinc-400 hover:text-white'
                      }`}
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-[#14f195] flex items-center justify-center">
                    <User size={12} className="text-black" />
                  </div>
                  <span className="text-sm text-zinc-300" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {session.user?.name || 'User'}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white border border-zinc-700 hover:border-zinc-500 transition-all"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#14f195] text-black hover:shadow-[0_0_20px_rgba(20,241,149,0.4)] transition-all"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Login →
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-black/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <div key={link.href}>
                {link.children ? (
                  <div>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === link.label ? null : link.label)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-zinc-300 hover:bg-zinc-900 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {link.icon}
                        <span style={{ fontFamily: "'Syne', sans-serif" }}>{link.label}</span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === link.label && (
                      <div className="pl-4 mt-2 space-y-1">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-900 hover:text-[#14f195] transition-all"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(link.href)
                        ? 'bg-zinc-900 text-[#14f195]'
                        : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                  >
                    {link.icon}
                    <span style={{ fontFamily: "'Syne', sans-serif" }}>{link.label}</span>
                  </Link>
                )}
              </div>
            ))}

            {/* Mobile Auth */}
            {!session && (
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <Link
                  href="/auth/register"
                  className="block w-full px-4 py-3 rounded-lg text-center text-sm font-medium text-white border border-zinc-700"
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/login"
                  className="block w-full px-4 py-3 rounded-lg text-center text-sm font-medium bg-[#14f195] text-black"
                >
                  Login →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
