'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { hasAcceptedTerms, acceptTerms } from '@/lib/premium';

export default function TermsAcceptanceModal() {
    const [show, setShow] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Check if terms already accepted
        if (!hasAcceptedTerms()) {
            const timer = setTimeout(() => setShow(true), 2000); // Show after 2s delay
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        if (!checked) return;
        acceptTerms();
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => {/* Prevent closing by clicking backdrop */ }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a12] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden"
                    >
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

                        {/* Close (Debug/Escape Hatch) */}
                        <button
                            onClick={() => setShow(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Content */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                <Shield className="w-8 h-8 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Legal Terms & Compliance</h2>
                            <p className="text-gray-400 text-sm">
                                Before entering the ZenithScores ecosystem, please review and accept our educational mission and legal terms.
                            </p>
                        </div>

                        {/* Points */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-yellow-500">Not Financial Advice</p>
                                    <p className="text-xs text-gray-400">ZenithScores provides educational tools and market analysis only. We never provide investment recommendations.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <CheckCircle className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-blue-500">Educational Mission</p>
                                    <p className="text-xs text-gray-400">The platform is designed to help you track your discipline and learn market dynamics through data-driven scoring.</p>
                                </div>
                            </div>
                        </div>

                        {/* Acceptance Box */}
                        <div className="space-y-6">
                            <label className="flex items-start gap-4 p-4 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => setChecked(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-600 bg-black text-blue-600 focus:ring-blue-500 focus:ring-offset-black"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors leading-relaxed">
                                        I have read and agree to the <Link href="/terms" target="_blank" className="text-blue-400 hover:underline inline-flex items-center gap-1">Terms of Service <ExternalLink size={12} /></Link> and <Link href="/privacy" target="_blank" className="text-blue-400 hover:underline inline-flex items-center gap-1">Privacy Policy <ExternalLink size={12} /></Link>.
                                    </p>
                                </div>
                            </label>

                            <button
                                onClick={handleAccept}
                                disabled={!checked}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${checked
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Enter ZenithScores
                            </button>

                            <p className="text-[10px] text-center text-gray-500">
                                You must be at least 18 years old to use this platform.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
