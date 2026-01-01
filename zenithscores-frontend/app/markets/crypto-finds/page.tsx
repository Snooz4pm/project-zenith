import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const CryptoFindsLayout = dynamic(
    () => import('@/components/crypto-finds/CryptoFindsLayout'),
    { ssr: false }
);

export const metadata = {
    title: 'Crypto Finds | ZenithScores',
    description: 'Curated crypto discovery terminal with real-time market intelligence.'
};

export default function CryptoFindsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <CryptoFindsLayout />
        </Suspense>
    );
}

function LoadingSkeleton() {
    return (
        <div className="h-[calc(100vh-80px)] flex bg-[#0a0a0d]">
            {/* Left */}
            <div className="w-[280px] border-r border-white/[0.06] p-4">
                <div className="h-8 bg-white/5 rounded mb-4 animate-pulse" />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/[0.02] rounded-lg mb-2 animate-pulse" />
                ))}
            </div>
            {/* Main */}
            <div className="flex-1 p-4">
                <div className="h-12 bg-white/5 rounded mb-4 animate-pulse" />
                <div className="h-[60%] bg-white/[0.02] rounded-lg animate-pulse" />
            </div>
            {/* Right */}
            <div className="w-[320px] border-l border-white/[0.06] p-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-white/[0.02] rounded-lg mb-3 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
