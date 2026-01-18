'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BrainCircuit, Target, Activity, ShieldCheck,
    ChevronRight, X, Info, Zap, BarChart3, RotateCcw
} from 'lucide-react';

interface WalkthroughStep {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
}

const STEPS: WalkthroughStep[] = [
    {
        id: 0,
        title: "Welcome to Atlas",
        description: "The first Predictive Physics Engine for Solana. Atlas doesn't just track your portfolio—it simulates market pressure in real-time.",
        icon: <BrainCircuit className="w-8 h-8" />,
        accent: "text-cyan-400"
    },
    {
        id: 1,
        title: "14-Pillar Physics Core",
        description: "Every tick, our engine applies 14 distinct analytical pillars—including Volume Velocity, Liquidity Depth, and Rug-Resistance—to identify true conviction.",
        icon: <Activity className="w-8 h-8" />,
        accent: "text-emerald-400"
    },
    {
        id: 2,
        title: "Discovery Hive",
        description: "Find gems before they exit the 'Survival Test' phase. Atlas filters out 99.9% of market noise to show you only high-probability opportunities.",
        icon: <Target className="w-8 h-8" />,
        accent: "text-amber-400"
    },
    {
        id: 3,
        title: "5-Phase Lifecycle",
        description: "Manage assets through a systematic rotation: Observe, Seed, Scale, Harvest, and Recycle. Never hold a dead position again.",
        icon: <RotateCcw className="w-8 h-8" />,
        accent: "text-purple-400"
    },
    {
        id: 4,
        title: "Non-Custodial Precision",
        description: "Atlas is pure intelligence. You maintain 100% custody of your funds. Every strategic action is signed by you and executed via a high-speed proxy.",
        icon: <ShieldCheck className="w-8 h-8" />,
        accent: "text-blue-400"
    }
];

export function AtlasWalkthrough({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleSkip}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            >
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                <div className="p-8">
                    {/* Progress Bar */}
                    <div className="flex gap-1 mb-8">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= currentStep ? 'bg-cyan-500' : 'bg-zinc-800'
                                    }`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="min-h-[280px] flex flex-col items-center text-center"
                        >
                            <div className={`p-4 rounded-full bg-white/5 mb-6 ${STEPS[currentStep].accent}`}>
                                {STEPS[currentStep].icon}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight uppercase font-mono">
                                {STEPS[currentStep].title}
                            </h2>

                            <p className="text-zinc-400 leading-relaxed font-mono text-sm max-w-[300px]">
                                {STEPS[currentStep].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={handleSkip}
                            className="text-zinc-500 hover:text-white text-xs font-mono transition-colors uppercase tracking-widest"
                        >
                            Skip Tour
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-bold text-sm tracking-tighter hover:bg-zinc-200 transition-all uppercase active:scale-95"
                        >
                            {currentStep === STEPS.length - 1 ? "Initialize" : "Next Segment"}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Footer Monospace */}
                <div className="px-8 py-3 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                            Atlas_v1.0.14_Core_Link
                        </span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">
                        {currentStep + 1}/{STEPS.length}
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
