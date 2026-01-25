"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Zap, Shield, BarChart3, Wallet, ArrowRight, Target, Globe, Lock } from "lucide-react";

export default function ZenithPlatformPage() {
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
                <div className="mb-16 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl font-bold text-emerald-400">Z</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">ZenithScores</h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        A non-custodial Solana trading terminal.
                        Powered by Jupiter. Built for transparency.
                    </p>
                </div>

                {/* What We Are */}
                <section className="mb-16">
                    <div className="p-8 rounded-2xl border border-white/10 bg-zinc-900/30">
                        <h2 className="text-2xl font-bold mb-4">What ZenithScores Is</h2>
                        <p className="text-zinc-300 leading-relaxed mb-6">
                            ZenithScores is an interface for trading tokens on Solana. We aggregate liquidity through Jupiter's API
                            and provide a clean, focused trading experience. When you swap, the transaction executes directly on-chain—
                            we're just the window, not the bank.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-black/50 border border-white/5">
                                <Zap className="w-5 h-5 text-yellow-400 mb-2" />
                                <h3 className="font-semibold text-white text-sm">Real Execution</h3>
                                <p className="text-xs text-zinc-500 mt-1">Live swaps on Solana mainnet</p>
                            </div>
                            <div className="p-4 rounded-xl bg-black/50 border border-white/5">
                                <Lock className="w-5 h-5 text-emerald-400 mb-2" />
                                <h3 className="font-semibold text-white text-sm">Non-Custodial</h3>
                                <p className="text-xs text-zinc-500 mt-1">Your keys, your control</p>
                            </div>
                            <div className="p-4 rounded-xl bg-black/50 border border-white/5">
                                <Globe className="w-5 h-5 text-cyan-400 mb-2" />
                                <h3 className="font-semibold text-white text-sm">Open Protocols</h3>
                                <p className="text-xs text-zinc-500 mt-1">Jupiter API, public RPCs</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Features */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-8">Core Features</h2>
                    <div className="space-y-6">
                        <div className="flex items-start gap-6 p-6 rounded-xl border border-white/10">
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Token Discovery</h3>
                                <p className="text-zinc-400">
                                    Browse Solana tokens with real-time prices. We filter for quality using Jupiter's verified token list—
                                    you see established tokens, not every random memecoin.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-6 p-6 rounded-xl border border-white/10">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Target className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Swap Terminal</h3>
                                <p className="text-zinc-400">
                                    Execute swaps through Jupiter's aggregator. Best-price routing across Raydium, Orca, Phoenix, and other Solana DEXs.
                                    Same engine powering jup.ag.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-6 p-6 rounded-xl border border-white/10">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Wallet className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Wallet Integration</h3>
                                <p className="text-zinc-400">
                                    Connect with Phantom or Solflare using the official Solana Wallet Adapter.
                                    Standard integration trusted by all major Solana dApps.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How We're Different */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-8">Our Approach</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                            <h3 className="font-semibold text-white mb-3">Transparency First</h3>
                            <p className="text-sm text-zinc-400">
                                No black boxes. We tell you exactly what happens: Jupiter builds the transaction, you sign it, it executes on Solana.
                                Every swap is verifiable on-chain.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                            <h3 className="font-semibold text-white mb-3">Minimal Footprint</h3>
                            <p className="text-sm text-zinc-400">
                                We don't require accounts, emails, or KYC. Connect your wallet, swap, disconnect.
                                Your trading activity stays between you and the blockchain.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-purple-500/20 bg-purple-500/5">
                            <h3 className="font-semibold text-white mb-3">No Hidden Fees</h3>
                            <p className="text-sm text-zinc-400">
                                We charge nothing extra. You pay standard Solana network fees and DEX fees built into the route.
                                What Jupiter quotes is what you get.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                            <h3 className="font-semibold text-white mb-3">Honest Limitations</h3>
                            <p className="text-sm text-zinc-400">
                                We can't recover lost funds, reverse transactions, or guarantee profits.
                                We're a tool, not financial advice. DYOR always applies.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Technical Stack */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">Technical Stack</h2>
                    <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-zinc-500 text-xs uppercase tracking-wider">Blockchain</span>
                                <p className="text-white font-medium mt-1">Solana</p>
                            </div>
                            <div>
                                <span className="text-zinc-500 text-xs uppercase tracking-wider">Aggregator</span>
                                <p className="text-white font-medium mt-1">Jupiter v6</p>
                            </div>
                            <div>
                                <span className="text-zinc-500 text-xs uppercase tracking-wider">Wallet Standard</span>
                                <p className="text-white font-medium mt-1">Solana Wallet Adapter</p>
                            </div>
                            <div>
                                <span className="text-zinc-500 text-xs uppercase tracking-wider">Frontend</span>
                                <p className="text-white font-medium mt-1">Next.js</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Disclaimer */}
                <section className="mb-16">
                    <div className="p-6 rounded-xl border border-zinc-700 bg-zinc-900/50">
                        <h3 className="font-semibold text-white mb-3">Important Disclaimer</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            ZenithScores is a trading interface, not financial advice. Cryptocurrency trading involves substantial risk.
                            Past performance doesn't indicate future results. Always do your own research and never trade more than you can afford to lose.
                        </p>
                    </div>
                </section>

                {/* Footer CTA */}
                <div className="pt-8 border-t border-white/10 text-center">
                    <p className="text-zinc-400 mb-6">
                        Ready to trade?
                    </p>
                    <Link
                        href="/swap"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Launch Terminal
                        <ArrowRight size={16} />
                    </Link>
                    <div className="flex flex-wrap justify-center gap-6 mt-8">
                        <Link href="/documentation" className="text-zinc-500 hover:text-white transition-colors text-sm">
                            Documentation
                        </Link>
                        <Link href="/security" className="text-zinc-500 hover:text-white transition-colors text-sm">
                            Security
                        </Link>
                        <Link href="/terms" className="text-zinc-500 hover:text-white transition-colors text-sm">
                            Terms
                        </Link>
                        <Link href="/privacy" className="text-zinc-500 hover:text-white transition-colors text-sm">
                            Privacy
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
