'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Lock, Loader2, RefreshCw } from 'lucide-react';
import { PATHS_CONTENT } from '@/lib/paths-content';
import PathCard from './PathCard';
import CalibrationComplete from '@/components/CalibrationComplete';

interface UserTrait {
    analytical_depth: number;
    risk_discipline: number;
    adaptability: number;
    consistency: number;
    emotional_stability: number;
    calibration_confidence: number;
}

interface UserPathScore {
    path_id: string;
    path_name?: string; // Optional from API
    score: number;
    rank: number;
}

export default function PathsDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [traits, setTraits] = useState<UserTrait | null>(null);
    const [pathScores, setPathScores] = useState<UserPathScore[]>([]);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/paths');
                if (res.ok) {
                    const data = await res.json();
                    setTraits(data.traits);
                    // Safety: Ensure array
                    setPathScores(data.pathScores || []);
                }
            } catch (error) {
                console.error("Failed to fetch paths data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
                <Loader2 size={32} className="animate-spin mb-4" />
                <p>Loading your decision profile...</p>
            </div>
        );
    }

    // Confidence Check
    const confidence = traits?.calibration_confidence || 0;
    const isCalibrating = confidence < 60; // 60% threshold from specs

    // Calibration View
    if (isCalibrating) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mb-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-cyan-500/10 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full border-t-cyan-500 animate-spin transition-all duration-1000"
                            style={{ animationDuration: '3s' }}
                        />
                        <BrainCircuit size={40} className="text-cyan-400" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 font-display">
                        Analyzing your decision DNA...
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        We are observing how you answer questions and behave in live simulations to model your decision patterns.
                        Continue interacting to unlock your primary path.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="max-w-xl mx-auto mb-16">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-cyan-400 font-bold tracking-wider uppercase">Data Confidence</span>
                        <span className="text-white font-mono">{Math.round(confidence)}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 relative overflow-hidden transition-all duration-1000"
                            style={{ width: `${confidence}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-3 italic">
                        More data increases accuracy.
                    </p>
                </div>

                {/* CTAs */}
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <button className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">Complete Quizzes</h3>
                            <RefreshCw size={18} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-400">Take certification modules to test your knowledge.</p>
                    </button>
                    <button className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left group">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">Trade in Simulator</h3>
                            <RefreshCw size={18} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-400">Execute trades to test your risk discipline.</p>
                    </button>
                </div>
            </div>
        );
    }

    // Unlocked View
    // Sort scores just in case API didn't
    const sortedScores = [...pathScores].sort((a, b) => b.score - a.score);
    const primaryPath = sortedScores[0];
    const primaryPathName = primaryPath?.path_name || PATHS_CONTENT[primaryPath?.path_id]?.name || "Unknown Path";

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* 
            <AnimatePresence>
                 {primaryPath && (
                    <CalibrationComplete 
                        primaryPathName={primaryPathName} 
                        onContinue={() => {}} 
                    />
                 )}
            </AnimatePresence> 
            */}

            {/* Header */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <BrainCircuit size={24} className="text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Paths Unlocked</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">
                    Your Primary Path: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{primaryPathName}</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                    Derived from consistency, risk discipline, and decision-making speed across multiple scenarios.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {sortedScores.slice(0, 3).map((path, idx) => (
                    <PathCard
                        key={path.path_id}
                        pathId={path.path_id}
                        pathName={path.path_name || PATHS_CONTENT[path.path_id]?.name || "Unnamed Path"}
                        score={path.score}
                        rank={idx + 1}
                        confidence={confidence}
                        isLocked={false}
                    />
                ))}
            </div>

            {/* Disclaimer */}
            <div className="text-center border-t border-white/5 pt-8">
                <p className="text-sm text-gray-500">
                    Paths are adaptive. As your behavior changes, so may your recommendations.
                </p>
            </div>
        </div>
    );
}
