'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-[100]">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Brand - Premium Minimalist */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">
                        ZENITH<span className="text-gray-500 font-medium">SCORES</span>
                    </span>
                </Link>

                {/* Portal Links */}
                <div className="flex items-center gap-8">
                    <Link
                        href="/crypto"
                        className={`text-xs font-bold tracking-widest transition-colors uppercase ${isActive('/crypto') ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        Crypto
                    </Link>
                    <Link
                        href="/stocks"
                        className={`text-xs font-bold tracking-widest transition-colors uppercase ${isActive('/stocks') ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        Stocks
                    </Link>
                    <Link
                        href="/trading"
                        className={`text-xs font-bold tracking-widest transition-colors uppercase ${isActive('/trading') ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                    >
                        Trading
                    </Link>
                </div>

                {/* User Menu */}
                <UserMenu />
            </div>
        </nav>
    );
}
