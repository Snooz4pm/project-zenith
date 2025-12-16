import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, BarChart3, Trophy, X } from 'lucide-react';

export function OnboardingTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('zenith_trading_tour_seen');
        if (!hasSeenTour) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('zenith_trading_tour_seen', 'true');
    };

    const steps = [
        {
            title: "Welcome to Zenith Trading",
            body: "Master the markets with our professional-grade paper trading terminal. Test strategies risk-free using real-time market data.",
            icon: <Rocket className="w-12 h-12 text-cyan-400" />
        },
        {
            title: "Real-Time Execution",
            body: "Execute Market and Limit orders with precision. Use Leverage, Stop-Loss, and Take-Profit tools to manage your risk like a pro.",
            icon: <BarChart3 className="w-12 h-12 text-emerald-400" />
        },
        {
            title: "Analytics & Leaderboard",
            body: "Track your Win Rate, Max Drawdown, and Streaks in the Analytics tab. Compete with other traders for the top spot on the Leaderboard.",
            icon: <Trophy className="w-12 h-12 text-yellow-400" />
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden"
                    >
                        {/* Background Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 text-center">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-gray-800 rounded-full border border-gray-700 shadow-xl">
                                    {steps[step].icon}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                {steps[step].title}
                            </h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                {steps[step].body}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-cyan-500 w-6' : 'bg-gray-700'
                                                }`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        if (step < steps.length - 1) {
                                            setStep(step + 1);
                                        } else {
                                            handleClose();
                                        }
                                    }}
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105"
                                >
                                    {step < steps.length - 1 ? 'Next' : 'Start Trading'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
