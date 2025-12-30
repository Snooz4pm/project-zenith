'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SignalLabDashboard from '@/components/signals/SignalLabDashboard';
import ZeroExSwap from '@/components/trading/ZeroExSwap';
import Paywall from '@/components/Paywall';

export default function SignalsView() {
    const { data: session } = useSession();
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (!session) return; // Wait for session

            try {
                // Check if already paid
                const res = await fetch('/api/subscription/status');
                const data = await res.json();

                if (data.isPremium) return;

                // Check free visits
                const visits = parseInt(localStorage.getItem('zenith_signal_visits') || '0');
                if (visits >= 3) {
                    setShowPaywall(true);
                } else {
                    localStorage.setItem('zenith_signal_visits', (visits + 1).toString());
                }
            } catch (e) {
                console.error("Auth check failed", e);
            }
        };

        checkAccess();
    }, [session]);

    return (
        <div className="h-screen pt-16 md:pt-20 pb-4 px-4 md:px-6 bg-[#0B0E14] overflow-hidden flex gap-4 relative">
            <Paywall
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                featureName="Signal Lab"
            />

            <div className="flex-1 overflow-hidden">
                <SignalLabDashboard />
            </div>
            {/* Dedicated Trading Sidebar */}
            <div className="hidden md:flex flex-col justify-center w-[380px] shrink-0 border-l border-zinc-800 bg-[#0B0E14] z-10 transition-transform">
                <ZeroExSwap />
            </div>
        </div>
    );
}
