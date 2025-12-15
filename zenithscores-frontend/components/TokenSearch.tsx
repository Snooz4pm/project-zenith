'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TokenSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('query') || '';
    const [searchTerm, setSearchTerm] = useState(initialQuery);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== initialQuery) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchTerm) {
                    params.set('query', searchTerm);
                } else {
                    params.delete('query');
                }
                router.push(`${window.location.pathname}?${params.toString()}`);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchTerm, router, searchParams, initialQuery]);

    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative flex items-center bg-gray-900 border border-gray-700 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <span className="pl-4 text-gray-400">🔍</span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search tokens by name or address..."
                        className="w-full bg-transparent border-none text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:ring-0"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="pr-4 text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
