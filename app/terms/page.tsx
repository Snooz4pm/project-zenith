"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, Scale, Ban, CheckCircle } from "lucide-react";

export default function TermsOfService() {
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
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
                    </div>
                    <p className="text-zinc-400">
                        Last Updated: January 6, 2026
                    </p>
                </div>

                {/* Plain Language Summary */}
                <section className="mb-12">
                    <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            Plain Language Summary
                        </h2>
                        <ul className="space-y-2 text-zinc-300 text-sm">
                            <li>• ZenithScores is a <strong className="text-white">trading interface</strong>, not a financial advisor.</li>
                            <li>• We <strong className="text-white">never have custody</strong> of your funds—you control your wallet.</li>
                            <li>• Trading is <strong className="text-white">risky</strong>—you can lose money. We're not responsible for losses.</li>
                            <li>• We don't provide <strong className="text-white">investment advice</strong>—do your own research.</li>
                            <li>• Use the service <strong className="text-white">at your own risk</strong>.</li>
                        </ul>
                    </div>
                </section>

                {/* Terms Content */}
                <div className="space-y-10 text-zinc-300 leading-relaxed">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. What ZenithScores Is</h2>
                        <p className="mb-4">
                            ZenithScores ("the Service") is a non-custodial web interface that allows users to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4 text-zinc-400">
                            <li>View Solana token prices and market data</li>
                            <li>Execute token swaps through Jupiter's aggregator</li>
                            <li>Connect self-custody wallets (Phantom, Solflare)</li>
                        </ul>
                        <p className="mt-4">
                            We are an <strong className="text-white">interface to decentralized protocols</strong>. We do not operate an exchange, 
                            hold user funds, or execute trades on your behalf.
                        </p>
                    </section>

                    {/* Section 2 - Not Financial Advice */}
                    <section className="p-6 rounded-xl border-l-4 border-yellow-500 bg-yellow-500/5">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            2. Not Financial Advice
                        </h2>
                        <p className="mb-4 font-medium text-yellow-200">
                            Nothing on ZenithScores constitutes financial, investment, legal, or tax advice.
                        </p>
                        <p className="text-zinc-400">
                            We provide market data and swap execution tools. Any trading decisions you make are your own.
                            We strongly recommend consulting qualified financial professionals before making investment decisions.
                        </p>
                    </section>

                    {/* Section 3 - Non-Custodial */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Non-Custodial Architecture</h2>
                        <p className="mb-4">
                            ZenithScores operates on a <strong className="text-white">non-custodial model</strong>:
                        </p>
                        <ul className="space-y-3 ml-4">
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span>We never access, store, or control your private keys or seed phrases.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span>Transactions require your explicit approval in your wallet.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span>Funds move directly between your wallet and on-chain DEXs.</span>
                            </li>
                        </ul>
                        <p className="mt-4 text-zinc-400">
                            Because we don't have custody, <strong className="text-white">we cannot recover lost funds, reverse transactions, 
                            or assist with wallet recovery</strong>. You are solely responsible for securing your wallet.
                        </p>
                    </section>

                    {/* Section 4 - Risks */}
                    <section className="p-6 rounded-xl border-l-4 border-red-500 bg-red-500/5">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Ban className="w-5 h-5 text-red-400" />
                            4. Risks & Disclaimers
                        </h2>
                        <p className="mb-4 font-medium text-red-200">
                            Cryptocurrency trading involves substantial risk of loss.
                        </p>
                        <ul className="space-y-2 text-zinc-400">
                            <li>• Prices can move rapidly. You may lose your entire investment.</li>
                            <li>• Smart contracts may contain bugs or vulnerabilities.</li>
                            <li>• Network congestion can cause delays or failed transactions.</li>
                            <li>• Token values can go to zero. Many do.</li>
                            <li>• Past performance does not indicate future results.</li>
                        </ul>
                        <p className="mt-4 text-sm text-zinc-500">
                            By using the Service, you acknowledge these risks and agree that ZenithScores is not liable for any losses.
                        </p>
                    </section>

                    {/* Section 5 - User Responsibilities */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Your Responsibilities</h2>
                        <p className="mb-4">By using ZenithScores, you agree to:</p>
                        <ul className="space-y-2 ml-4 text-zinc-400">
                            <li>• Conduct your own research before trading</li>
                            <li>• Secure your wallet and seed phrase</li>
                            <li>• Verify transaction details before signing</li>
                            <li>• Comply with applicable laws in your jurisdiction</li>
                            <li>• Not use the Service for illegal activities</li>
                            <li>• Not attempt to exploit or harm the Service</li>
                        </ul>
                    </section>

                    {/* Section 6 - Accuracy */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">6. Data Accuracy</h2>
                        <p>
                            We source data from Jupiter, public APIs, and blockchain RPCs. While we strive for accuracy, 
                            we cannot guarantee that all information is complete, current, or error-free. 
                            <strong className="text-white"> Always verify critical information through primary sources.</strong>
                        </p>
                    </section>

                    {/* Section 7 - Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-zinc-400" />
                            7. Limitation of Liability
                        </h2>
                        <p className="text-sm text-zinc-400">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZENITHSCORES AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY 
                            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO 
                            LOSS OF PROFITS, DATA, OR FUNDS ARISING FROM YOUR USE OF THE SERVICE.
                        </p>
                        <p className="mt-4 text-sm text-zinc-400">
                            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UPTIME, 
                            ACCURACY, OR FITNESS FOR ANY PARTICULAR PURPOSE.
                        </p>
                    </section>

                    {/* Section 8 - Changes */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">8. Changes to Terms</h2>
                        <p>
                            We may update these Terms at any time. Changes take effect when posted. Continued use of the Service 
                            after changes constitutes acceptance. We recommend checking this page periodically.
                        </p>
                    </section>

                    {/* Section 9 - Termination */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">9. Termination</h2>
                        <p>
                            We may suspend or restrict access to the Service at any time, with or without notice, for any reason. 
                            Since we're non-custodial, this doesn't affect your ability to access your funds through other interfaces.
                        </p>
                    </section>

                    {/* Section 10 - Governing Law */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">10. Governing Law</h2>
                        <p>
                            These Terms are governed by applicable law. Any disputes will be resolved through binding arbitration 
                            or in the courts of competent jurisdiction.
                        </p>
                    </section>

                    {/* Section 11 - Contact */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">11. Contact</h2>
                        <p>
                            Questions about these Terms? Contact us at:{" "}
                            <a href="mailto:legal@zenithscores.com" className="text-blue-400 hover:underline">
                                legal@zenithscores.com
                            </a>
                        </p>
                    </section>

                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-white/10 text-center">
                    <p className="text-zinc-500 text-sm mb-6">
                        By using ZenithScores, you acknowledge that you have read and agree to these Terms.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/privacy"
                            className="text-zinc-400 hover:text-white transition-colors text-sm"
                        >
                            Privacy Policy →
                        </Link>
                        <Link
                            href="/security"
                            className="text-zinc-400 hover:text-white transition-colors text-sm"
                        >
                            Security →
                        </Link>
                        <Link
                            href="/"
                            className="text-zinc-400 hover:text-white transition-colors text-sm"
                        >
                            Back to Home →
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
