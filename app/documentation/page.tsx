import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Zap, Shield, Terminal, Wallet, ArrowRight, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
    title: "Documentation | ZenithScores",
    description: "Learn how ZenithScores works - non-custodial Solana trading terminal powered by Jupiter",
};

export default function Documentation() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-6 py-16 max-w-4xl">

                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Documentation</h1>
                    </div>
                    <p className="text-zinc-400 text-lg mt-4 max-w-2xl">
                        Everything you need to understand how ZenithScores works.
                        We believe in transparency—here's exactly what happens under the hood.
                    </p>
                </div>

                {/* Quick Start */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Quick Start
                    </h2>
                    <div className="grid gap-4">
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <span className="text-emerald-400 font-mono text-lg font-bold">1</span>
                                <div>
                                    <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Click "Connect Wallet" and approve the connection in Phantom.
                                        We use the official Solana Wallet Adapter—the same standard used by Jupiter, Raydium, and other trusted dApps.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <span className="text-emerald-400 font-mono text-lg font-bold">2</span>
                                <div>
                                    <h3 className="font-semibold mb-2">Select Tokens</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Choose which token to swap from your wallet balance, and which token you want to receive.
                                        We only show verified tokens from Jupiter's strict list.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <span className="text-emerald-400 font-mono text-lg font-bold">3</span>
                                <div>
                                    <h3 className="font-semibold mb-2">Review & Sign</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Review the quote, then click Swap. Phantom will open showing the exact transaction.
                                        You approve it. The swap executes on-chain. Done.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-cyan-400" />
                        How It Works
                    </h2>
                    <div className="space-y-6 text-zinc-300">
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <h3 className="font-semibold text-white mb-3">The Execution Path</h3>
                            <div className="font-mono text-sm bg-black/50 p-4 rounded-lg overflow-x-auto">
                                <div className="text-zinc-500">// What happens when you swap</div>
                                <div className="mt-2">
                                    <span className="text-emerald-400">You</span>
                                    <span className="text-zinc-500"> → </span>
                                    <span className="text-cyan-400">ZenithScores UI</span>
                                    <span className="text-zinc-500"> → </span>
                                    <span className="text-yellow-400">Jupiter API</span>
                                    <span className="text-zinc-500"> → </span>
                                    <span className="text-purple-400">Phantom</span>
                                    <span className="text-zinc-500"> → </span>
                                    <span className="text-emerald-400">Solana Blockchain</span>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-zinc-400">
                                We never touch your funds. Jupiter builds the transaction, you sign it in Phantom, and it's sent directly to Solana.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-xl border border-white/10">
                                <h4 className="font-semibold text-white mb-2">Jupiter Integration</h4>
                                <p className="text-sm text-zinc-400">
                                    All swaps route through Jupiter's aggregator—the same engine powering jup.ag.
                                    Jupiter finds the best price across all Solana DEXs automatically.
                                </p>
                            </div>
                            <div className="p-5 rounded-xl border border-white/10">
                                <h4 className="font-semibold text-white mb-2">Verified Token List</h4>
                                <p className="text-sm text-zinc-400">
                                    We only display tokens from Jupiter's strict verified list.
                                    This filters out scams and low-quality tokens by default.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Architecture */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        Architecture
                    </h2>
                    <div className="space-y-4 text-zinc-300">
                        <p>
                            ZenithScores is a <strong className="text-white">non-custodial interface</strong>. Here's what that means:
                        </p>
                        <ul className="space-y-3 ml-4">
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">No backend wallet storage.</strong> We don't have a database of keys or seeds.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">No fund custody.</strong> Tokens move directly from your wallet to the DEX and back.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Open protocols only.</strong> Jupiter API + Solana RPC. No proprietary black boxes.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Transaction transparency.</strong> Every swap is verifiable on Solscan/Solana Explorer.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Wallet Support */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-purple-400" />
                        Wallet Support
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                            <h4 className="font-semibold text-white mb-2">Phantom (Recommended)</h4>
                            <p className="text-sm text-zinc-400">
                                Full support. Direct connection via Solana Wallet Adapter.
                            </p>
                        </div>
                        <div className="p-5 rounded-xl border border-white/10">
                            <h4 className="font-semibold text-white mb-2">Solflare</h4>
                            <p className="text-sm text-zinc-400">
                                Supported via Wallet Adapter.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <details className="group p-5 rounded-xl border border-white/10 cursor-pointer">
                            <summary className="font-semibold text-white list-none flex justify-between items-center">
                                Is ZenithScores safe?
                                <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                            </summary>
                            <p className="mt-4 text-sm text-zinc-400">
                                We're a non-custodial interface. We can't access, move, or steal your funds because we never have custody.
                                All transactions require your explicit approval in your wallet.
                            </p>
                        </details>
                        <details className="group p-5 rounded-xl border border-white/10 cursor-pointer">
                            <summary className="font-semibold text-white list-none flex justify-between items-center">
                                Where do prices come from?
                                <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                            </summary>
                            <p className="mt-4 text-sm text-zinc-400">
                                Quotes come directly from Jupiter's API, which aggregates prices from Raydium, Orca, Phoenix, and other Solana DEXs.
                                You get the same prices as jup.ag.
                            </p>
                        </details>
                        <details className="group p-5 rounded-xl border border-white/10 cursor-pointer">
                            <summary className="font-semibold text-white list-none flex justify-between items-center">
                                What are the fees?
                                <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                            </summary>
                            <p className="mt-4 text-sm text-zinc-400">
                                ZenithScores charges no additional fees. You pay standard Solana network fees (~$0.001) and any DEX fees built into the swap route.
                            </p>
                        </details>
                        <details className="group p-5 rounded-xl border border-white/10 cursor-pointer">
                            <summary className="font-semibold text-white list-none flex justify-between items-center">
                                Can you recover my funds if I lose my wallet?
                                <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                            </summary>
                            <p className="mt-4 text-sm text-zinc-400">
                                No. We don't have access to your keys. If you lose your wallet seed phrase, only your wallet provider (Phantom, etc.) may be able to help.
                                This is the trade-off of non-custodial: you have full control, and full responsibility.
                            </p>
                        </details>
                    </div>
                </section>

                {/* External Resources */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">External Resources</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <a href="https://station.jup.ag/docs" target="_blank" rel="noopener noreferrer"
                           className="p-5 rounded-xl border border-white/10 hover:border-white/20 transition-colors flex items-center justify-between group">
                            <div>
                                <h4 className="font-semibold text-white">Jupiter Documentation</h4>
                                <p className="text-sm text-zinc-400">Learn about Jupiter's aggregator</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        </a>
                        <a href="https://solana.com/docs" target="_blank" rel="noopener noreferrer"
                           className="p-5 rounded-xl border border-white/10 hover:border-white/20 transition-colors flex items-center justify-between group">
                            <div>
                                <h4 className="font-semibold text-white">Solana Documentation</h4>
                                <p className="text-sm text-zinc-400">Understand the Solana blockchain</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                </section>

                {/* Footer */}
                <div className="pt-8 border-t border-white/10 text-center">
                    <p className="text-zinc-500 text-sm mb-6">
                        Questions? Reach out at{" "}
                        <a href="mailto:support@zenithscores.com" className="text-emerald-400 hover:underline">
                            support@zenithscores.com
                        </a>
                    </p>
                    <Link
                        href="/swap"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Launch Terminal
                        <ArrowRight size={16} />
                    </Link>
                </div>

            </div>
        </div>
    );
}
