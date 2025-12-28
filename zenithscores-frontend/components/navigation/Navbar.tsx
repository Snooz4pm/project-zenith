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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B0E1A]/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_0_30px_rgba(14,184,166,0.1)]' : 'bg-[#0B0E1A] border-b border-[#2D3F5A]'}`}>
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(14,184,166,0.5)]">
              <span className="text-[#0B0E1A] font-bold text-lg font-mono">Z</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400/0 to-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                ZenithScores
              </span>
              <div className="text-[9px] text-cyan-600 uppercase tracking-widest font-mono -mt-1">Market Intelligence</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.href} className="relative">
                {link.children ? (
                  <div className="relative" onMouseEnter={() => setActiveDropdown(link.label)} onMouseLeave={() => setActiveDropdown(null)}>
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href) ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(14,184,166,0.15)]' : 'text-gray-400 hover:text-cyan-300 hover:bg-[#1A2332]'}`}>
                      {link.icon}
                      <span>{link.label}</span>
                      <ChevronDown size={14} className={`transition-transform ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === link.label && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-[#1A2332] rounded-xl shadow-2xl border border-[#2D3F5A] p-2 backdrop-blur-xl">
                        {link.children.map((child) => (
                          <Link key={child.href} href={child.href} className="block px-4 py-3 rounded-lg hover:bg-[#253447] transition-colors group">
                            <div className="font-medium text-sm text-gray-200 group-hover:text-cyan-400">{child.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{child.description}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={link.href} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href) ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(14,184,166,0.15)]' : 'text-gray-400 hover:text-cyan-300 hover:bg-[#1A2332]'}`}>
                    {link.icon}
                    <span>{link.label}</span>
                    {link.badge && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">{link.badge}</span>}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden md:flex p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-[#1A2332] transition-all relative group">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
            </button>

            {session ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A2332] border border-[#2D3F5A]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-[0_0_12px_rgba(14,184,166,0.3)]">
                    <User size={14} className="text-[#0B0E1A]" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">{session.user?.name || 'User'}</span>
                </div>
                <button onClick={() => signOut()} className="p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all" title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_16px_rgba(14,184,166,0.3)] hover:shadow-[0_0_24px_rgba(14,184,166,0.5)]">
                Sign In
              </Link>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-[#1A2332] transition-all">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#2D3F5A] bg-[#111827] backdrop-blur-xl">
          <div className="max-w-[1800px] mx-auto px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <div key={link.href}>
                {link.children ? (
                  <div>
                    <button onClick={() => setActiveDropdown(activeDropdown === link.label ? null : link.label)} className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1A2332] hover:text-cyan-400 transition-all">
                      <div className="flex items-center gap-3">
                        {link.icon}
                        <span className="font-medium">{link.label}</span>
                      </div>
                      <ChevronDown size={18} className={`transition-transform ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === link.label && (
                      <div className="pl-4 mt-2 space-y-1">
                        {link.children.map((child) => (
                          <Link key={child.href} href={child.href} className="block px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1A2332] hover:text-cyan-400 transition-all">
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(link.href) ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-300 hover:bg-[#1A2332] hover:text-cyan-400'}`}>
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
