'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, BrainCircuit } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CalibrationCompleteProps {
    primaryPathName: string;
    onContinue: () => void;
}

export default function CalibrationComplete({ primaryPathName, onContinue }: CalibrationCompleteProps) {
    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3000;
        const animationEnd = Date.now() + duration;

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#22d3ee', '#3b82f6', '#ffffff']
            });
            confetti({
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#22d3ee', '#3b82f6', '#ffffff']
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
            <div className="max-w-md w-full text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="mb-8 relative inline-block"
                >
                    <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" />
                    <BrainCircuit size={80} className="text-cyan-400 relative z-10" />
                </motion.div>

                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-white mb-2 font-display"
                >
                    Calibration Complete
                </motion.h2>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-400 mb-8"
                >
                    We have analyzed your decision patterns. Your primary trading path is:
                </motion.p>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 p-6 rounded-2xl mb-8"
                >
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                        {primaryPathName}
                    </h1>
                </motion.div>

                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    onClick={onContinue}
                    className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto"
                >
                    Reveal Roadmap <ArrowRight size={18} />
                </motion.button>
            </div>
        </motion.div>
    );
}
