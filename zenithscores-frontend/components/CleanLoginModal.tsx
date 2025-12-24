'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, Brain, Target } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface CleanLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature?: string; // What triggered the modal
}

export function CleanLoginModal({ isOpen, onClose, feature }: CleanLoginModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await signIn('google', { callbackUrl: '/auth/calibration' });
    };

    const handleEmailLogin = () => {
        signIn(undefined, { callbackUrl: '/auth/calibration' });
    };

    const benefits = [
        {
            icon: Brain,
            title: 'Calibrated Scores',
            description: 'Risk adjusted to your tolerance level'
        },
        {
            icon: TrendingUp,
            title: 'Pattern Memory',
            description: 'See your accuracy on similar setups'
        },
        {
            icon: Target,
            title: 'Personal Edge',
            description: 'Insights matched to your trading style'
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>

                        <div className="p-8">
                            {/* Icon */}
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                                <Sparkles className="text-white" size={24} />
                            </div>

                            {/* Headline */}
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                ZenithScore works best when it knows how you think
                            </h2>

                            {feature && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    You tried to access: <span className="font-semibold">{feature}</span>
                                </p>
                            )}

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Take 2 minutes to calibrate the system to your trading style. No marketing emails, no upsells.
                            </p>

                            {/* Benefits */}
                            <div className="space-y-3 mb-6">
                                {benefits.map((benefit, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <benefit.icon size={16} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {benefit.title}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path
                                                    fill="currentColor"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                />
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleEmailLogin}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    Continue with Email
                                </button>
                            </div>

                            {/* Footer */}
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-6">
                                By continuing, you agree to our{' '}
                                <a href="/terms" className="underline hover:text-gray-700">
                                    Terms
                                </a>{' '}
                                and{' '}
                                <a href="/privacy" className="underline hover:text-gray-700">
                                    Privacy Policy
                                </a>
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
