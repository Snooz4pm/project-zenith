import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, Eye, Database, Cookie } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy | Zenith Scores",
    description: "ZenithScores Privacy Policy - How we collect, use, and protect your data",
};

export default function PrivacyPolicy() {
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
                        <Lock className="w-8 h-8 text-green-400" />
                        <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Last Updated: December 16, 2025
                    </p>
                </div>

                {/* Introduction */}
                <div className="glass-panel rounded-xl p-6 mb-12 border border-green-500/20 bg-green-950/10">
                    <p className="text-gray-300 leading-relaxed">
                        At ZenithScores, we respect your privacy. This Privacy Policy explains how we collect, use, and protect
                        your information when you use our Service. By using ZenithScores, you consent to the practices described in this policy.
                    </p>
                </div>

                {/* Privacy Content */}
                <div className="space-y-8 text-gray-300 leading-relaxed">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Eye className="w-6 h-6 text-blue-400" />
                            1. Information We Collect
                        </h2>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.1 Automatically Collected Information</h3>
                        <p className="mb-3">When you visit ZenithScores, we automatically collect:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Usage Data:</strong> Pages viewed, time spent, click patterns, navigation paths</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, screen resolution</li>
                            <li><strong>IP Address:</strong> Geographic location (country/city level only)</li>
                            <li><strong>Referral Source:</strong> How you arrived at our site</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.2 Information You Provide (Optional)</h3>
                        <p className="mb-3">We currently do not require user accounts. If you contact us, we may collect:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Email address (for support inquiries)</li>
                            <li>Feedback or questions you submit</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.3 Paper Trading Data</h3>
                        <p>
                            Paper trading portfolios are stored locally in your browser using localStorage. We do not have access to
                            your paper trading activity unless you explicitly share it with us.
                        </p>
                    </section>

                    {/* Section 2 - Cookies & Analytics */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Cookie className="w-6 h-6 text-yellow-400" />
                            2. Cookies & Tracking Technologies
                        </h2>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Analytics Cookies</h3>
                        <p className="mb-3">
                            We use <strong>Google Analytics</strong> and <strong>Vercel Analytics</strong> to understand how users interact with our Service:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Page views and session duration</li>
                            <li>Feature usage and engagement metrics</li>
                            <li>Performance monitoring (page load times, errors)</li>
                        </ul>
                        <p className="mt-3">
                            These analytics providers may use cookies to track your activity across sessions. You can disable cookies
                            in your browser settings, though some features may not work properly.
                        </p>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Essential Cookies</h3>
                        <p>
                            We use minimal essential cookies for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Remembering your preferences (theme, settings)</li>
                            <li>Maintaining session state for paper trading</li>
                        </ul>
                    </section>

                    {/* Section 3 - How We Use Data */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Database className="w-6 h-6 text-purple-400" />
                            3. How We Use Your Information
                        </h2>
                        <p className="mb-3">We use collected information to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Improve the Service:</strong> Analyze usage patterns to enhance features and user experience</li>
                            <li><strong>Monitor Performance:</strong> Identify and fix bugs, optimize load times</li>
                            <li><strong>Understand Our Audience:</strong> Learn which features are most valuable</li>
                            <li><strong>Respond to Inquiries:</strong> Provide customer support when you contact us</li>
                            <li><strong>Comply with Legal Obligations:</strong> Meet regulatory requirements</li>
                        </ul>
                        <p className="mt-3 font-semibold text-blue-300">
                            We do NOT sell, rent, or share your personal information with third parties for marketing purposes.
                        </p>
                    </section>

                    {/* Section 4 - Third-Party Services */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services & APIs</h2>
                        <p className="mb-3">
                            ZenithScores integrates with third-party services to provide market data and analytics. These providers
                            have their own privacy policies:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Yahoo Finance:</strong> Stock market data (public API, no personal data shared)</li>
                            <li><strong>CoinGecko:</strong> Cryptocurrency prices (public API, no personal data shared)</li>
                            <li><strong>NewsAPI & CryptoPanic:</strong> News aggregation (public APIs)</li>
                            <li><strong>Google Analytics:</strong> Usage analytics (governed by Google's Privacy Policy)</li>
                            <li><strong>Vercel:</strong> Hosting and performance monitoring</li>
                        </ul>
                        <p className="mt-3">
                            We recommend reviewing the privacy policies of these services if you have concerns about data collection.
                        </p>
                    </section>

                    {/* Section 5 - Data Retention */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention</h2>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Analytics Data:</strong> Retained for up to 26 months by Google Analytics</li>
                            <li><strong>Server Logs:</strong> Retained for up to 90 days for troubleshooting purposes</li>
                            <li><strong>Support Emails:</strong> Retained as long as necessary to resolve your inquiry</li>
                        </ul>
                    </section>

                    {/* Section 6 - Your Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
                        <p className="mb-3">
                            Depending on your location, you may have the following rights:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Access:</strong> Request a copy of data we have about you</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                            <li><strong>Opt-Out:</strong> Disable cookies or analytics tracking in your browser</li>
                            <li><strong>Correction:</strong> Request updates to inaccurate information</li>
                        </ul>
                        <p className="mt-3">
                            To exercise these rights, contact us at{" "}
                            <a href="mailto:privacy@zenithscores.com" className="text-blue-400 hover:underline">
                                privacy@zenithscores.com
                            </a>
                        </p>
                    </section>

                    {/* Section 7 - GDPR & CCPA */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. GDPR & CCPA Compliance</h2>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.1 European Users (GDPR)</h3>
                        <p className="mb-3">
                            If you are in the European Economic Area (EEA), you have additional rights under GDPR:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Right to access, rectification, erasure, and data portability</li>
                            <li>Right to object to processing</li>
                            <li>Right to lodge a complaint with a supervisory authority</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.2 California Users (CCPA)</h3>
                        <p className="mb-3">
                            California residents have the right to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Know what personal information is collected</li>
                            <li>Request deletion of personal information</li>
                            <li>Opt-out of the sale of personal information (Note: We do not sell your data)</li>
                        </ul>
                    </section>

                    {/* Section 8 - Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Data Security</h2>
                        <p>
                            We implement industry-standard security measures to protect your data, including HTTPS encryption,
                            secure database storage, and regular security audits. However, no system is 100% secure, and we cannot
                            guarantee absolute security.
                        </p>
                    </section>

                    {/* Section 9 - Children */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                        <p>
                            ZenithScores is not intended for users under 18 years of age. We do not knowingly collect personal
                            information from children. If you believe we have inadvertently collected such data, please contact us
                            immediately.
                        </p>
                    </section>

                    {/* Section 10 - International Users */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. International Users</h2>
                        <p>
                            ZenithScores is operated from the United States. If you access the Service from outside the U.S.,
                            your information may be transferred to and processed in the U.S., which may have different data
                            protection laws than your country.
                        </p>
                    </section>

                    {/* Section 11 - Changes to Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy periodically. Changes will be posted on this page with an updated
                            "Last Updated" date. Continued use of the Service after modifications constitutes acceptance of the
                            updated policy.
                        </p>
                    </section>

                    {/* Section 12 - Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                        <p>
                            For questions, concerns, or requests regarding this Privacy Policy, please contact us at:
                        </p>
                        <div className="mt-4 glass-panel rounded-lg p-4 border border-white/10">
                            <p className="font-mono text-sm">
                                <strong>Email:</strong>{" "}
                                <a href="mailto:privacy@zenithscores.com" className="text-blue-400 hover:underline">
                                    privacy@zenithscores.com
                                </a>
                            </p>
                            <p className="font-mono text-sm mt-2">
                                <strong>Subject Line:</strong> Privacy Inquiry - ZenithScores
                            </p>
                        </div>
                    </section>

                </div>

                {/* Footer CTA */}
                <div className="mt-16 pt-8 border-t border-white/10 text-center">
                    <p className="text-gray-400 mb-6">
                        Thank you for trusting ZenithScores with your privacy.
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
