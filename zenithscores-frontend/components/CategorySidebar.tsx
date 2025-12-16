/**
 * Category Sidebar Component
 * Navigation sidebar with all news categories
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORIES } from '@/lib/api';

export default function CategorySidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white shadow-lg h-screen sticky top-0 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <Link href="/" className="block">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        📰 News Signal
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Autonomous Intelligence</p>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                {/* All News */}
                <Link
                    href="/"
                    className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ${pathname === '/'
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 text-blue-900 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <span className="text-xl">🏠</span>
                    <span>All News</span>
                </Link>

                <div className="my-4 px-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                </div>

                {/* Category Links */}
                <div className="space-y-1">
                    {CATEGORIES.map((category) => {
                        const isActive = pathname === `/category/${category.slug}`;

                        return (
                            <Link
                                key={category.slug}
                                href={`/category/${category.slug}`}
                                className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 group ${isActive
                                        ? `bg-gradient-to-r ${category.color} bg-opacity-10 border-l-4 border-current text-gray-900 font-semibold`
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className="text-xl">{category.icon}</span>
                                <div className="flex-1">
                                    <div className="font-medium">{category.name}</div>
                                    {!isActive && (
                                        <div className="text-xs text-gray-500 line-clamp-1 group-hover:text-gray-700 transition-colors">
                                            {category.description}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="my-4 px-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                </div>

                {/* Search Link */}
                <Link
                    href="/search"
                    className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ${pathname === '/search'
                            ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-600 text-gray-900 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <span className="text-xl">🔍</span>
                    <span>Search</span>
                </Link>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gradient-to-b from-transparent to-gray-50">
                <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-between">
                        <span>Powered by AI</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">
                            LIVE
                        </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                        Auto-updated every hour
                    </div>
                </div>
            </div>
        </aside>
    );
}
