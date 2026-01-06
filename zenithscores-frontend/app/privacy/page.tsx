import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, Eye, Database, Shield, Globe, Trash2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy | ZenithScores",
    description: "ZenithScores Privacy Policy - What data we collect, how we use it, and your rights",
};

export default function PrivacyPolicy() {
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
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Lock className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
                    </div>
                    <p className="text-zinc-400">
                        Last Updated: January 6, 2026
                    </p>
                </div>

                {/* Plain Language Summary */}
                <section className="mb-12">
                    <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            The Short Version
                        </h2>
                        <ul className="space-y-2 text-zinc-300 text-sm">
                            <li>• We're <strong className="text-white">non-custodial</strong>—we don't have your private keys or funds.</li>
                            <li>• We collect <strong className="text-white">minimal data</strong>: basic analytics to improve the service.</li>
                            <li>• We <strong className="text-white">don't sell</strong> your data to anyone.</li>
                            <li>• We <strong className="text-white">don't require</strong> accounts, emails, or personal information.</li>
                            <li>• Your trading activity is between you and the blockchain.</li>
                        </ul>
                    </div>
                </section>

                {/* Content */}
                <div className="space-y-10 text-zinc-300 leading-relaxed">

                    {/* Section 1 - What We Don't Collect */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-red-400" />
                            1. What We Don't Collect
                        </h2>
                        <p className="mb-4">
                            ZenithScores is designed to minimize data collection. We <strong className="text-white">do not</strong> collect or store:
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                            {[
                                "Private keys or seed phrases",
                                "Wallet balances or holdings",
                                "Transaction history",
                                "Personal identification (name, ID)",
                                "Email addresses (we don't require accounts)",
                                "Phone numbers",
                                "Payment information",
                                "Trading strategies or patterns"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                                    <span className="text-red-400">✗</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 2 - What We Do Collect */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-cyan-400" />
                            2. What We Do Collect
                        </h2>
                        <p className="mb-4">
                            We collect minimal, anonymized data to understand how the service is used and to fix issues:
                        </p>
                        
                        <div className="space-y-4">
                            <div className="p-5 rounded-xl border border-white/10">
                                <h3 className="font-semibold text-white mb-2">Analytics Data (via Vercel Analytics)</h3>
                                <ul className="text-sm text-zinc-400 space-y-1">
                                    <li>• Page views and navigation patterns</li>
                                    <li>• General geographic region (country level)</li>
                                    <li>• Device type and browser</li>
                                    <li>• Referral source</li>
                                </ul>
                                <p className="text-xs text-zinc-500 mt-3">
                                    This data is aggregated and anonymized. We cannot identify individual users.
                                </p>
                            </div>

                            <div className="p-5 rounded-xl border border-white/10">
                                <h3 className="font-semibold text-white mb-2">Technical Logs</h3>
                                <ul className="text-sm text-zinc-400 space-y-1">
                                    <li>• Error logs for debugging</li>
                                    <li>• API request patterns (anonymized)</li>
                                    <li>• Performance metrics</li>
                                </ul>
                                <p className="text-xs text-zinc-500 mt-3">
                                    Retained for up to 30 days, then automatically deleted.
                                </p>
                            </div>

                            <div className="p-5 rounded-xl border border-white/10">
                                <h3 className="font-semibold text-white mb-2">Wallet Public Address</h3>
                                <p className="text-sm text-zinc-400">
                                    When you connect your wallet, we see your public address (this is how blockchain works). 
                                    We don't store this—it's only used in-session to fetch balances and build transactions.
                                </p>
                                <p className="text-xs text-zinc-500 mt-3">
                                    Public addresses are already public on the blockchain. We don't link them to any identity.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 - How We Use Data */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. How We Use Data</h2>
                        <ul className="space-y-2 text-zinc-400">
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Improve the service:</strong> Understand which features are used, fix bugs.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Monitor performance:</strong> Ensure the app loads fast and works reliably.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Security:</strong> Detect and prevent abuse or attacks.</span>
                            </li>
                        </ul>
                        <p className="mt-4 text-sm text-zinc-500">
                            We do <strong className="text-white">NOT</strong> use your data for advertising, marketing, or selling to third parties.
                        </p>
                    </section>

                    {/* Section 4 - Third Parties */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-purple-400" />
                            4. Third-Party Services
                        </h2>
                        <p className="mb-4">
                            We integrate with third-party services to provide functionality:
                        </p>
                        <div className="space-y-3">
                            <div className="p-4 rounded-lg border border-white/10">
                                <h4 className="font-semibold text-white text-sm">Jupiter API</h4>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Swap quotes and transaction building. They see the tokens and amounts you're swapping.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-white/10">
                                <h4 className="font-semibold text-white text-sm">Solana RPC Providers</h4>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Blockchain data and transaction submission. Standard RPC calls, no personal data.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-white/10">
                                <h4 className="font-semibold text-white text-sm">Vercel</h4>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Hosting and analytics. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Vercel's Privacy Policy</a>.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 - Cookies */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Cookies</h2>
                        <p className="mb-4">
                            We use minimal cookies:
                        </p>
                        <ul className="space-y-2 text-zinc-400 text-sm">
                            <li>• <strong className="text-white">Essential cookies:</strong> Required for the site to function (session management).</li>
                            <li>• <strong className="text-white">Analytics cookies:</strong> Vercel Analytics for anonymized usage data.</li>
                        </ul>
                        <p className="mt-4 text-sm text-zinc-500">
                            You can disable cookies in your browser settings, though some features may not work properly.
                        </p>
                    </section>

                    {/* Section 6 - Your Rights */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-yellow-400" />
                            6. Your Rights
                        </h2>
                        <p className="mb-4">
                            Since we collect minimal data and don't require accounts, there's not much to manage. However:
                        </p>
                        <ul className="space-y-2 text-zinc-400">
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Opt out of analytics:</strong> Use browser privacy settings or extensions like uBlock Origin.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Clear local storage:</strong> Your browser's "Clear Site Data" removes any locally stored preferences.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <span><strong className="text-white">Disconnect wallet:</strong> Click disconnect—we don't retain your address.</span>
                            </li>
                        </ul>
                        <p className="mt-4 text-sm">
                            For GDPR/CCPA requests, contact:{" "}
                            <a href="mailto:privacy@zenithscores.com" className="text-blue-400 hover:underline">
                                privacy@zenithscores.com
                            </a>
                        </p>
                    </section>

                    {/* Section 7 - Children */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">7. Children</h2>
                        <p>
                            ZenithScores is not intended for users under 18. We do not knowingly collect data from minors. 
                            If you believe we have inadvertently collected such data, contact us immediately.
                        </p>
                    </section>

                    {/* Section 8 - Changes */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">8. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy periodically. Changes will be posted here with an updated date. 
                            Continued use of the Service after changes constitutes acceptance.
                        </p>
                    </section>

                    {/* Section 9 - Contact */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">9. Contact Us</h2>
                        <p>
                            Questions or concerns about privacy? Contact us at:{" "}
                            <a href="mailto:privacy@zenithscores.com" className="text-emerald-400 hover:underline">
                                privacy@zenithscores.com
                            </a>
                        </p>
                    </section>

                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-white/10 text-center">
                    <p className="text-zinc-500 text-sm mb-6">
                        We believe privacy is a right, not a feature. That's why we built ZenithScores to collect as little as possible.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/terms"
                            className="text-zinc-400 hover:text-white transition-colors text-sm"
                        >
                            Terms of Service →
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
