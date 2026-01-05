'use client';

import Link from 'next/link';

export default function Documentation() {
    return (
        <div className="min-h-screen bg-black text-[#EDEDED] p-8 font-sans selection:bg-emerald-500/30">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 border-b border-white/10 pb-8">
                    <h1 className="text-4xl font-medium tracking-tight">Documentation</h1>
                    <Link href="/" className="mt-4 sm:mt-0 text-zinc-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1">
                        ← Back to Terminal
                    </Link>
                </header>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-medium text-white mb-4">
                            Getting Started
                        </h2>
                        <div className="space-y-4 text-zinc-400 leading-relaxed">
                            <p>
                                ZenithScores is a non-custodial trading terminal built on Solana.
                                It aggregates liquidity from Jupiter and validates token quality via our strict Trust Engine.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-white">Connect Wallet:</strong> Use Phantom, Solflare, or Backpack. No email signup required.</li>
                                <li><strong className="text-white">Trust Engine:</strong> We automatically filter out low-liquidity (&lt;$50k) garbage.</li>
                                <li><strong className="text-white">Direct Execution:</strong> Swaps are routed through Jupiter for the best price.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-medium text-white mb-4">
                            Signals Engine
                        </h2>
                        <div className="space-y-4 text-zinc-400 leading-relaxed">
                            <p>
                                The Signals functionality detects assets with significant 24-hour momentum that pass our safety checks.
                            </p>
                            <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-lg text-sm font-mono">
                                <div className="mb-2 text-white font-bold">Launch Criteria:</div>
                                <ul className="space-y-1">
                                    <li className="flex justify-between"><span>Min Liquidity:</span> <span className="text-white">$100,000</span></li>
                                    <li className="flex justify-between"><span>Min Volume (24h):</span> <span className="text-white">$500,000</span></li>
                                    <li className="flex justify-between"><span>Price Change (24h):</span> <span className="text-white">&ge; 30%</span></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-medium text-white mb-4">
                            API & Developer Access
                        </h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            ZenithScores is built on open protocols. We plan to expose our Scoring Engine API in Q3 2026.
                        </p>
                        <div className="p-4 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-500">
                    // Example API Request (Coming Soon)<br />
                            GET https://api.zenithscores.com/v1/signals/latest<br />
                            Authorization: Bearer &lt;YOUR_API_KEY&gt;
                        </div>
                    </section>
                </div>

                <footer className="mt-20 pt-8 border-t border-white/10 text-center text-zinc-600 text-sm">
                    &copy; 2026 ZenithScores | Built on Solana
                </footer>
            </div>
        </div>
    );
}
