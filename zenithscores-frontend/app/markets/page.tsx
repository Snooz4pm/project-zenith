import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Markets | ZenithScores',
    description: 'Explore cryptocurrency, stock, and forex markets with real-time data.',
};

export default function MarketsPage() {
    // 🚑 Emergency rollback: Desktop-only, no mobile code path
    return (
        <div className="min-h-screen bg-[var(--void)] py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Markets</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Crypto Finds */}
                    <Link
                        href="/markets/crypto-finds"
                        className="group p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-[var(--accent-mint)]/30 transition-all"
                    >
                        <div className="text-2xl mb-3">🔮</div>
                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--accent-mint)] transition-colors">
                            Crypto Finds
                        </h2>
                        <p className="text-sm text-zinc-500">
                            Live DEX pairs with flow intelligence across ETH, ARB, BASE, SOL, and more.
                        </p>
                    </Link>

                    {/* Stocks */}
                    <Link
                        href="/stocks"
                        className="group p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-[var(--accent-cyan)]/30 transition-all"
                    >
                        <div className="text-2xl mb-3">📈</div>
                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
                            Stocks
                        </h2>
                        <p className="text-sm text-zinc-500">
                            US equities with real-time quotes and analysis.
                        </p>
                    </Link>

                    {/* Forex */}
                    <Link
                        href="/forex"
                        className="group p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-purple-500/30 transition-all"
                    >
                        <div className="text-2xl mb-3">💱</div>
                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                            Forex
                        </h2>
                        <p className="text-sm text-zinc-500">
                            Major currency pairs with live exchange rates.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
