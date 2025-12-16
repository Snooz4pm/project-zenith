import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service | Zenith Scores",
    description: "ZenithScores Terms of Service - Educational use only, no financial advice",
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-6 py-16 max-w-4xl">

                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-blue-400" />
                        <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Last Updated: December 16, 2025
                    </p>
                </div>

                {/* Important Notice */}
                <div className="glass-panel rounded-xl p-6 mb-12 border-2 border-yellow-500/30 bg-yellow-900/10">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-yellow-300 mb-2 text-lg">Important: Educational Use Only</h3>
                            <p className="text-gray-300 leading-relaxed">
                                ZenithScores is an <strong>educational platform</strong> that provides market analysis and scoring for
                                informational purposes only. We do not provide financial advice, investment recommendations, or trading plans.
                                Use of this service is entirely at your own risk.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Terms Content */}
                <div className="space-y-8 text-gray-300 leading-relaxed">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using ZenithScores ("the Service"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please discontinue use of the Service immediately.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Service Description</h2>
                        <p className="mb-3">
                            ZenithScores provides:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Algorithmic market scoring for stocks and cryptocurrencies</li>
                            <li>Real-time market data aggregation and analysis</li>
                            <li>Educational market insights and trend analysis</li>
                            <li>Paper trading simulation tools</li>
                            <li>News aggregation and sentiment analysis</li>
                        </ul>
                        <p className="mt-3">
                            All features are provided for <strong>educational and informational purposes only</strong>.
                        </p>
                    </section>

                    {/* Section 3 - NOT FINANCIAL ADVICE */}
                    <section className="border-l-4 border-red-500 pl-6 bg-red-950/20 py-4 rounded-r-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">3. Not Financial Advice</h2>
                        <p className="mb-3 font-semibold text-red-300">
                            ZENITHSCORES DOES NOT PROVIDE FINANCIAL ADVICE.
                        </p>
                        <p className="mb-3">
                            Nothing on this platform constitutes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Investment advice or recommendations</li>
                            <li>Trading plans or strategies</li>
                            <li>Buy, sell, or hold suggestions</li>
                            <li>Financial planning or portfolio management</li>
                            <li>Tax, legal, or accounting advice</li>
                        </ul>
                        <p className="mt-3">
                            All scores, metrics, and analysis are purely <strong>educational tools</strong> to help you learn about
                            market dynamics. You are solely responsible for your own investment decisions.
                        </p>
                    </section>

                    {/* Section 4 - NO LIABILITY */}
                    <section className="border-l-4 border-red-500 pl-6 bg-red-950/20 py-4 rounded-r-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">4. No Liability for Losses</h2>
                        <p className="mb-3 font-semibold text-red-300">
                            WE ARE NOT LIABLE FOR ANY FINANCIAL LOSSES.
                        </p>
                        <p className="mb-3">
                            You acknowledge and agree that:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Trading and investing carry substantial risk of loss</li>
                            <li>Past performance does not indicate future results</li>
                            <li>ZenithScores makes no guarantees about accuracy or profitability</li>
                            <li>We are not responsible for losses resulting from use of our Service</li>
                            <li>All data and scores may contain errors or delays</li>
                        </ul>
                    </section>

                    {/* Section 5 - USE AT YOUR OWN RISK */}
                    <section className="border-l-4 border-yellow-500 pl-6 bg-yellow-950/20 py-4 rounded-r-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">5. Use at Your Own Risk</h2>
                        <p className="mb-3 font-semibold text-yellow-300">
                            YOUR USE OF THIS SERVICE IS ENTIRELY AT YOUR OWN RISK.
                        </p>
                        <p>
                            The Service is provided "AS-IS" without warranties of any kind, either express or implied.
                            You assume all responsibility and risk for your use of the Service and any decisions made based on
                            information obtained through it.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. User Responsibilities</h2>
                        <p className="mb-3">
                            You agree to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Conduct your own research before making any financial decisions</li>
                            <li>Consult with qualified financial professionals</li>
                            <li>Not rely solely on ZenithScores for investment decisions</li>
                            <li>Use the Service in compliance with all applicable laws</li>
                            <li>Not abuse, overload, or attempt to hack the Service</li>
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Data Accuracy</h2>
                        <p>
                            While we strive for accuracy, we make no guarantees regarding the completeness, reliability, or timeliness
                            of any data, scores, or information provided. Market data may be delayed, and technical issues may cause
                            inaccuracies. Always verify critical information through primary sources.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
                        <p>
                            All content, algorithms, designs, and materials on ZenithScores are owned by ZenithScores or its licensors.
                            You may use the Service for personal, non-commercial purposes only.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZENITHSCORES AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY
                            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA,
                            OR FINANCIAL LOSSES ARISING FROM YOUR USE OF THE SERVICE.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Modifications to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting.
                            Continued use of the Service after modifications constitutes acceptance of the updated Terms.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Termination</h2>
                        <p>
                            We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be
                            resolved through binding arbitration.
                        </p>
                    </section>

                    {/* Section 13 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
                        <p>
                            For questions about these Terms, please contact us at:{" "}
                            <a href="mailto:legal@zenithscores.com" className="text-blue-400 hover:underline">
                                legal@zenithscores.com
                            </a>
                        </p>
                    </section>

                </div>

                {/* Footer CTA */}
                <div className="mt-16 pt-8 border-t border-white/10 text-center">
                    <p className="text-gray-400 mb-6">
                        By using ZenithScores, you acknowledge that you have read and agree to these Terms of Service.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Return to Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
}
