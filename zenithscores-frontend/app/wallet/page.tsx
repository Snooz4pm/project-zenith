'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import WalletGate from '@/components/wallet/WalletGate';

export default function WalletPage() {
    return (
        <WalletGate>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">Your Wallet</h1>
                <EmptyState text="Portfolio Tracking" subtext="View your assets and history coming soon." />
            </div>
        </WalletGate>
    );
}
