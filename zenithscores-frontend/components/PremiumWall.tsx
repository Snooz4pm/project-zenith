'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap, TrendingUp, Shield, Crown, CheckCircle, X } from 'lucide-react';
import { activatePremium, PREMIUM_PRICE, PREMIUM_PERIOD } from '@/lib/premium';
import Script from 'next/script';
import Link from 'next/link';

interface PremiumWallProps {
    onUnlock?: () => void;
    stocksLocked?: number;
}

export default function PremiumWall({ onUnlock, stocksLocked = 24382 }: PremiumWallProps) {
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [paypalLoaded, setPaypalLoaded] = useState(false);

    const handleActivate = () => {
        if (activatePremium(accessCode)) {
            setSuccess(true);
            setError('');
            setTimeout(() => {
                onUnlock?.();
                window.location.reload();
            }, 1500);
        } else {
            setError('Invalid access code. Please check and try again.');
        }
    };

    // Initialize PayPal button after script loads
    useEffect(() => {
        if (paypalLoaded && typeof window !== 'undefined' && (window as any).paypal) {
            try {
                (window as any).paypal.Buttons({
                    style: {
                        shape: 'pill',
                        color: 'gold',
                        layout: 'vertical',
                        label: 'subscribe'
                    },
                    createSubscription: function (data: any, actions: any) {
                        return actions.subscription.create({
                            plan_id: 'P-10D549705G436604HNFBRH5Y'
                        });
                    },
                    onApprove: function (data: any) {
                        // Show success and provide activation code
                        alert(`🎉 Welcome to Premium!\n\nYour Subscription ID: ${data.subscriptionID}\n\nYour activation code: ZENITH-2024-UNLOCK\n\nEnter this code below to unlock all features!`);
                        setShowCodeInput(true);
                        setAccessCode('ZENITH-2024-UNLOCK');
                    }
                }).render('#paypal-button-container');
            } catch (e) {
                console.error('PayPal render error:', e);
            }
        }
    }, [paypalLoaded]);

    return (
        <>
            <Script
                src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''}&vault=true&intent=subscription`}
                data-sdk-integration-source="button-factory"
                onLoad={() => setPaypalLoaded(true)}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 shadow-2xl"
            >
                {/* Glow Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Lock Icon */}
                <div className="flex justify-center mb-6">
                    <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30"
                    >
                        <Lock className="w-10 h-10 text-purple-400" />
                    </motion.div>
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
                    Trade with Clarity, Not Guesswork
                </h3>
                <p className="text-center text-gray-400 mb-4">
                    You&apos;re seeing the <span className="text-cyan-400 font-bold">Top 10</span> — but missing the
                    <span className="text-purple-400 font-bold"> WHY</span> behind every score.
                </p>

                {/* Pain Point */}
                <div className="text-center mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-gray-300">
                        <span className="text-red-400 font-bold">One bad trade = $200+ loss.</span>
                        <span className="text-gray-500 ml-2">ZenithScores = $19.99/month.</span>
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {[
                        { icon: TrendingUp, text: 'See WHY scores move', sub: 'Triggers explained', color: 'text-cyan-400' },
                        { icon: Zap, text: 'Early momentum alerts', sub: 'Before it\'s obvious', color: 'text-yellow-400' },
                        { icon: Shield, text: 'Risk warnings', sub: 'Avoid traps', color: 'text-green-400' },
                        { icon: Crown, text: 'Unlimited access', sub: 'All assets', color: 'text-purple-400' },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                            <feature.icon className={`w-5 h-5 ${feature.color} mt-0.5`} />
                            <div>
                                <span className="text-sm text-white font-medium">{feature.text}</span>
                                <p className="text-[10px] text-gray-500">{feature.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">{PREMIUM_PRICE}</span>
                        <span className="text-gray-400">{PREMIUM_PERIOD}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cancel anytime • 7-day money back guarantee</p>
                </div>

                {/* Urgency Banner */}
                <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-orange-400">⚡</span>
                        <span className="text-white font-medium">LIMITED: First 100 subscribers get lifetime 50% off!</span>
                    </div>
                    <div className="mt-2 h-2 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '64%' }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Legal Notice */}
                <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5 text-[10px] text-gray-400 space-y-2">
                    <p className="font-bold text-gray-300 uppercase tracking-widest">Notice for Prospective Subscribers</p>
                    <p>
                        By subscribing, you acknowledge that ZenithScores is for <strong>educational purposes only</strong>.
                        We do not provide financial advice, investment recommendations, or trading patterns.
                        All trading carries a high risk of loss. Read our <Link href="/terms" className="text-cyan-400 hover:underline">Terms</Link> and <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link> for full details.
                    </p>
                </div>

                {/* PayPal Button Container */}
                <div id="paypal-button-container" className="mb-4 min-h-[50px]" />

                {/* Instant Demo Unlock - For Testing */}
                <button
                    onClick={() => {
                        setAccessCode('ZENITH-2024-UNLOCK');
                        setTimeout(() => handleActivate(), 100);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25 mb-4"
                >
                    🚀 Upgrade to Pro
                </button>

                {/* Access Code Section */}
                <div className="border-t border-white/10 pt-4 mt-4">
                    <button
                        onClick={() => setShowCodeInput(!showCodeInput)}
                        className="w-full text-center text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                        Already have an access code? Click here
                    </button>

                    <AnimatePresence>
                        {showCodeInput && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Enter your access code"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 font-mono text-center uppercase tracking-widest"
                                    />

                                    {error && (
                                        <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1">
                                            <X size={14} /> {error}
                                        </p>
                                    )}

                                    {success && (
                                        <p className="text-green-400 text-sm text-center flex items-center justify-center gap-1">
                                            <CheckCircle size={14} /> Premium activated! Refreshing...
                                        </p>
                                    )}

                                    <button
                                        onClick={handleActivate}
                                        disabled={!accessCode || success}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold hover:from-purple-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Activate Premium
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Social Proof */}
                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-500">
                        <span className="text-cyan-400 font-bold">127</span> investors upgraded today
                    </p>
                </div>
            </motion.div>
        </>
    );
}
