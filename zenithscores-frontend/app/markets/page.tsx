'use client';

import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import MobileMarkets from '@/components/mobile/MobileMarkets';

export default function MarketsPage() {
    const isMobile = useIsMobile();

    // Mobile version
    if (isMobile) {
        return <MobileMarkets />;
    }

    // Desktop version - redirect to crypto-finds for now
    return (
        <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Markets</h1>
                <p className="text-[var(--text-muted)] mb-6">Desktop markets view coming soon...</p>
                <a
                    href="/markets/crypto-finds"
                    className="px-6 py-3 bg-[var(--accent-mint)] text-black font-bold rounded-lg hover:bg-[var(--accent-cyan)] transition-colors"
                >
                    View Crypto Finds
                </a>
            </div>
        </div>
    );
}
