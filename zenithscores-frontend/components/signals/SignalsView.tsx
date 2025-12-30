'use client';

import SignalLabDashboard from '@/components/signals/SignalLabDashboard';
import ZeroExSwap from '@/components/trading/ZeroExSwap';

export default function SignalsView() {
    return (
        <div className="h-screen pt-16 md:pt-20 pb-4 px-4 md:px-6 bg-[#0B0E14] overflow-hidden flex gap-4">
            <div className="flex-1 overflow-hidden">
                <SignalLabDashboard />
            </div>
            {/* Dedicated Trading Sidebar */}
            <div className="flex flex-col justify-center w-[380px] shrink-0 border-l border-zinc-800 bg-[#0B0E14] z-10 transition-transform">
                <ZeroExSwap />
            </div>
        </div>
    );
}
