'use client';

import SignalLabDashboard from '@/components/signals/SignalLabDashboard';

export default function SignalLabPage() {
    return (
        <div className="h-screen pt-16 md:pt-20 pb-4 px-4 md:px-6 bg-[#0B0E14] overflow-hidden">
            <SignalLabDashboard />
        </div>
    );
}
