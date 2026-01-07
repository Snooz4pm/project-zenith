import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, CheckCircle, AlertTriangle, Server, Key } from "lucide-react";

export const metadata: Metadata = {
    title: "Security | ZenithScores",
    description: "How ZenithScores protects you - non-custodial architecture, no fund access, transparent execution",
};

export default function SecurityPage() {
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
                            <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Security</h1>
                    </div>
                    <p className="text-zinc-400 text-lg mt-4 max-w-2xl">
                        We believe security comes from transparency.
                        Here's exactly how ZenithScores handles your connection, transactions, and data.
                    </p>
                </div>

                {/* Non-Custodial Highlight */}
                <section className="mb-16">
                    <div className="p-8 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Lock className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-3">Non-Custodial by Design</h2>
                                <p className="text-zinc-300 leading-relaxed">
                                    ZenithScores is an <strong className="text-white">interface</strong>, not a custodian.
                                    We never have access to your private keys, seed phrases, or funds.
                                    Your wallet connects locally in your browser—we're just a window to the blockchain.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What We Don't Do */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-red-400" />
                        What We Cannot Access
                    </h2>
                    <div className="grid gap-4">
                        {[
                            { title: "Private Keys", desc: "Your keys stay in your wallet (Phantom, Solflare). We never see them." },
                            { title: "Seed Phrases", desc: "We don't ask for, store, or transmit seed phrases. Ever." },
                            { title: "Fund Movement", desc: "We can't move your tokens. Only you can sign transactions." },
                            { title: "Transaction Reversal", desc: "We can't undo or modify transactions. Blockchain is final." },
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-4">
                                <span className="text-red-400 mt-0.5">✗</span>
                                <div>
                                    <h3 className="font-semibold text-white">{item.title}</h3>
                                    <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How Transactions Work */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Server className="w-5 h-5 text-cyan-400" />
                        How Transactions Work
                    </h2>
                    <div className="space-y-4">
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <span className="text-emerald-400 font-mono text-lg font-bold">1</span>
                                <div>
                                    <h3 className="font-semibold text-white mb-2">You Request a Quote</h3>
                                    <p className="text-zinc-400 text-sm">
                                        We ask Jupiter for a price quote. This is read-only—no wallet interaction yet.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <span className="text-emerald-400 font-mono text-lg font-bold">2</span>
                                <div>
                                    <h3 className="font-semibold text-white mb-2">Jupiter Builds the Transaction</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Jupiter's API constructs the swap transaction with optimal routing.
                                        The transaction is unsigned at this point.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <span className="text-emerald-400 font-mono text-lg font-bold">3</span>
                                <div>
                                    <h3 className="font-semibold text-white mb-2">You Review in Your Wallet</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Phantom opens showing exactly what will happen. You see the tokens, amounts, and fees.
                                        <strong className="text-white"> You must explicitly approve.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30">
                            <div className="flex items-start gap-4">
                                <span className="text-emerald-400 font-mono text-lg font-bold">4</span>
                                <div>
                                    <h3 className="font-semibold text-white mb-2">Direct to Blockchain</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Your signed transaction goes directly to Solana. Verifiable on any explorer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security Practices */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        Our Security Practices
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { title: "HTTPS Only", desc: "All connections encrypted. No mixed content." },
                            { title: "Wallet Adapter Standard", desc: "Official Solana wallet integration—trusted by Jupiter, Raydium, Drift." },
                            { title: "No Backend Wallets", desc: "We don't have server-side wallets or hot wallets." },
                            { title: "Open Source Protocols", desc: "Built on Jupiter API and Solana RPC—publicly auditable." },
                            { title: "No Auto-Signing", desc: "Every transaction requires your manual approval." },
                            { title: "Minimal Permissions", desc: "We only request wallet connection—never private key access." },
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-xl border border-white/10">
                                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span>
                                    {item.title}
                                </h3>
                                <p className="text-sm text-zinc-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Your Responsibility */}
                <section className="mb-16">
                    <div className="p-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-xl font-bold text-white mb-3">Your Responsibility</h2>
                                <p className="text-zinc-300 leading-relaxed mb-4">
                                    Non-custodial means you're in control—and responsible. If you lose your seed phrase or send tokens to the wrong address, 
                                    <strong className="text-white"> we cannot help recover them</strong>.
                                </p>
                                <ul className="space-y-2 text-sm text-zinc-400">
                                    <li className="flex items-start gap-2">
                                        <Key className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span>Never share your seed phrase with anyone—including us.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Key className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span>Always verify transaction details in your wallet before signing.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Key className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <span>Use a hardware wallet for large amounts.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reporting */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">Report a Security Issue</h2>
                    <p className="text-zinc-400 mb-4">
                        Found a vulnerability? We take security seriously. Contact us at:
                    </p>
                    <div className="p-5 rounded-xl border border-white/10 bg-zinc-900/30">
                        <a href="mailto:security@zenithscores.com" className="text-emerald-400 hover:underline font-mono">
                            security@zenithscores.com
                        </a>
                        <p className="text-sm text-zinc-500 mt-2">
                            Please include detailed steps to reproduce the issue.
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <div className="pt-8 border-t border-white/10 text-center">
                    <p className="text-zinc-500 text-sm mb-6">
                        Security is a process, not a destination. We continuously review and improve our practices.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/privacy"
                            className="text-zinc-400 hover:text-white transition-colors text-sm"
                        >
                            Privacy Policy →
                        </Link>
                        <Link
                            href="/terms"
                            className="text-zinc-400 hover:text-white transition-colors text-sm"
                        >
                            Terms of Service →
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
