import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, CreditCard, Clock, Mail } from "lucide-react";

export const metadata: Metadata = {
    title: "Refund Policy | Zenith Scores",
    description: "ZenithScores Refund Policy - Subscription cancellation and refund terms",
};

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-[var(--void)] text-white">
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
                        <RefreshCw className="w-8 h-8 text-[var(--accent-mint)]" />
                        <h1 className="text-4xl md:text-5xl font-bold">Refund Policy</h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Last Updated: December 30, 2025
                    </p>
                </div>

                {/* Important Notice */}
                <div className="rounded-xl p-6 mb-12 border border-[var(--accent-mint)]/30 bg-[var(--accent-mint)]/5">
                    <div className="flex items-start gap-3">
                        <CreditCard className="w-6 h-6 text-[var(--accent-mint)] mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-[var(--accent-mint)] mb-2 text-lg">Subscription-Based Service</h3>
                            <p className="text-gray-300 leading-relaxed">
                                ZenithScores operates on a monthly subscription model through PayPal. Your subscription can be
                                cancelled at any time, and you will retain access until the end of your current billing period.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Refund Content */}
                <div className="space-y-8 text-gray-300 leading-relaxed">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Subscription Cancellation</h2>
                        <p className="mb-3">
                            You may cancel your ZenithScores Premium subscription at any time. Upon cancellation:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Your subscription will remain active until the end of your current billing cycle</li>
                            <li>You will not be charged for the following month</li>
                            <li>You will retain full access to all premium features until your subscription expires</li>
                            <li>Your account will automatically revert to the free tier after expiration</li>
                        </ul>
                    </section>

                    {/* Section 2 - Refund Eligibility */}
                    <section className="border-l-4 border-[var(--accent-mint)] pl-6 bg-[var(--accent-mint)]/5 py-4 rounded-r-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">2. Refund Eligibility</h2>
                        <p className="mb-3 font-semibold text-[var(--accent-mint)]">
                            We offer refunds under the following circumstances:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Within 7 days of initial purchase:</strong> Full refund available if you are not satisfied with the service</li>
                            <li><strong>Technical issues:</strong> If you experience significant technical problems that prevent you from using the service and our support team cannot resolve them</li>
                            <li><strong>Billing errors:</strong> If you were charged incorrectly or multiple times due to a system error</li>
                            <li><strong>Service unavailability:</strong> If the service was unavailable for an extended period (more than 48 hours) during your billing cycle</li>
                        </ul>
                    </section>

                    {/* Section 3 - Non-Refundable */}
                    <section className="border-l-4 border-yellow-500 pl-6 bg-yellow-950/20 py-4 rounded-r-lg">
                        <div className="flex items-start gap-2 mb-4">
                            <AlertTriangle className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <h2 className="text-2xl font-bold text-white">3. Non-Refundable Situations</h2>
                        </div>
                        <p className="mb-3 font-semibold text-yellow-300">
                            Refunds will NOT be provided in the following cases:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Requests made after the 7-day initial purchase window (for satisfaction-based refunds)</li>
                            <li>Change of mind after using premium features extensively</li>
                            <li>Failure to cancel before the next billing cycle</li>
                            <li>Violation of our Terms of Service resulting in account suspension</li>
                            <li>Dissatisfaction with trading or investment outcomes (we provide educational tools, not financial advice)</li>
                            <li>Partial month refunds for mid-cycle cancellations</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. How to Request a Refund</h2>
                        <p className="mb-3">
                            To request a refund, please follow these steps:
                        </p>
                        <ol className="list-decimal list-inside space-y-3 ml-4">
                            <li>
                                <strong>Contact our support team</strong> at{" "}
                                <a href="mailto:support@zenithscores.com" className="text-[var(--accent-mint)] hover:underline">
                                    support@zenithscores.com
                                </a>
                            </li>
                            <li>Include your <strong>account email address</strong> and <strong>PayPal transaction ID</strong></li>
                            <li>Provide a <strong>brief explanation</strong> of why you are requesting a refund</li>
                            <li>Our team will review your request within <strong>2-3 business days</strong></li>
                        </ol>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-6 h-6 text-[var(--accent-cyan)]" />
                            <h2 className="text-2xl font-bold text-white">5. Refund Processing Time</h2>
                        </div>
                        <p className="mb-3">
                            Once your refund request is approved:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Refunds are processed through PayPal within <strong>5-7 business days</strong></li>
                            <li>The refund will be credited to your original payment method</li>
                            <li>You will receive an email confirmation once the refund is processed</li>
                            <li>Your premium access will be revoked upon refund approval</li>
                        </ul>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Subscription Management</h2>
                        <p className="mb-3">
                            You can manage your subscription at any time:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Cancel:</strong> Go to your PayPal account → Settings → Payments → Manage Automatic Payments</li>
                            <li><strong>Update payment method:</strong> Through your PayPal account settings</li>
                            <li><strong>View billing history:</strong> Available in your ZenithScores profile settings</li>
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Free Trial (If Applicable)</h2>
                        <p>
                            If we offer a free trial period, you will not be charged during the trial. You may cancel at any time before the trial ends to avoid being charged. If you do not cancel before the trial period expires, you will be automatically billed for the first month of your subscription.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
                        <p>
                            We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting to this page. We encourage you to review this policy periodically.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Mail className="w-6 h-6 text-[var(--accent-mint)]" />
                            <h2 className="text-2xl font-bold text-white">9. Contact Us</h2>
                        </div>
                        <p className="mb-3">
                            If you have any questions about this Refund Policy or need assistance with a refund request, please contact us:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>
                                Email:{" "}
                                <a href="mailto:support@zenithscores.com" className="text-[var(--accent-mint)] hover:underline">
                                    support@zenithscores.com
                                </a>
                            </li>
                            <li>
                                Legal inquiries:{" "}
                                <a href="mailto:legal@zenithscores.com" className="text-[var(--accent-mint)] hover:underline">
                                    legal@zenithscores.com
                                </a>
                            </li>
                        </ul>
                    </section>

                </div>

                {/* Footer CTA */}
                <div className="mt-16 pt-8 border-t border-white/10 text-center">
                    <p className="text-gray-400 mb-6">
                        By subscribing to ZenithScores Premium, you acknowledge that you have read and agree to this Refund Policy.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent-mint)] text-[var(--void)] font-bold rounded-lg hover:brightness-110 transition-all"
                    >
                        <ArrowLeft size={16} />
                        Return to Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
}
