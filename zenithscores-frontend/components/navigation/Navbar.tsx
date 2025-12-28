'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Wallet,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Bell
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: { label: string; href: string; description: string }[];
}

const NAV_LINKS: NavLink[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard size={18} />
  },
  {
    label: 'Markets',
    href: '/crypto',
    icon: <TrendingUp size={18} />,
    children: [
      { label: 'Crypto', href: '/crypto', description: 'Cryptocurrency markets and analysis' },
      { label: 'Stocks', href: '/stocks', description: 'Stock market intelligence' },
      { label: 'Forex', href: '/forex', description: 'Foreign exchange trading' },
      { label: 'Commodities', href: '/commodities', description: 'Commodity market data' }
    ]
  },
  {
    label: 'Learn',
    href: '/learning',
    icon: <BookOpen size={18} />,
    badge: 'New'
  },
  {
    label: 'Trading',
    href: '/trading',
    icon: <Wallet size={18} />
  },
  {
    label: 'Charts',
    href: '/charts',
    icon: <BarChart3 size={18} />
  }
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-lg border-b border-zinc-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900'}`}>
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              ZenithScores
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.href} className="relative">
                {link.children ? (
                  <div className="relative" onMouseEnter={() => setActiveDropdown(link.label)} onMouseLeave={() => setActiveDropdown(null)}>
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href) ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                      {link.icon}
                      <span>{link.label}</span>
                      <ChevronDown size={14} className={`transition-transform ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === link.label && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2">
                        {link.children.map((child) => (
                          <Link key={child.href} href={child.href} className="block px-4 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group">
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{child.label}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{child.description}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={link.href} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href) ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                    {link.icon}
                    <span>{link.label}</span>
                    {link.badge && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">{link.badge}</span>}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden md:flex p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {session ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{session.user?.name || 'User'}</span>
                </div>
                <button onClick={() => signOut()} className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                Sign In
              </Link>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="max-w-[1800px] mx-auto px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <div key={link.href}>
                {link.children ? (
                  <div>
                    <button onClick={() => setActiveDropdown(activeDropdown === link.label ? null : link.label)} className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <div className="flex items-center gap-3">
                        {link.icon}
                        <span className="font-medium">{link.label}</span>
                      </div>
                      <ChevronDown size={18} className={`transition-transform ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === link.label && (
                      <div className="pl-4 mt-2 space-y-1">
                        {link.children.map((child) => (
                          <Link key={child.href} href={child.href} className="block px-4 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(link.href) ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                    {link.icon}
                    <span className="font-medium">{link.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
