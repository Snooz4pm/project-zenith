'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-[100]">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        ZenithScores
                    </span>
                </Link>

                {/* Portal Links */}
                <div className="flex items-center gap-8">
                    <Link
                        href="/crypto"
                        className={`text-sm font-bold transition-colors ${isActive('/crypto') ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        🪙 CRYPTO
                    </Link>
                    <Link
                        href="/stocks"
                        className={`text-sm font-bold transition-colors ${isActive('/stocks') ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        🏢 STOCKS
                    </Link>
                </div>

                {/* Global Search Trigger (Visual only for now, functionality in page content) */}
                <div className="hidden md:flex items-center gap-2 text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                    <Search size={14} />
                    <span className="text-xs">Search...</span>
                </div>
            </div>
        </nav>
    );
}
