'use client';

import { useState } from 'react';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { Filters } from '@/components/discover/Filters';
import { TokenGrid } from '@/components/discover/TokenGrid';

export default function DiscoverPage() {
    const [search, setSearch] = useState("");

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <DiscoverHeader />
            <Filters search={search} onSearchChange={setSearch} />
            <div className="min-h-[500px]">
                <TokenGrid search={search} />
            </div>
        </div>
    );
}
