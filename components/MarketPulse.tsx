'use client';

import { motion } from 'framer-motion';

export default function MarketPulse() {
    // In a real app, these values would come from an API aggregating volatility, volume, and sentiment.
    // For now, we simulate a "moderate/active" market state.

    const energyLevel = 65; // 0-100
    const state = energyLevel > 80 ? 'VOLATILE' : energyLevel > 40 ? 'ACTIVE' : 'CALM';
    const color = energyLevel > 80 ? '#F6465D' : energyLevel > 40 ? '#FFEA00' : '#0ECB81'; // Using brand colors roughly

    // Create bars for the waveform
    const bars = Array.from({ length: 24 }).map((_, i) => {
        // Generate a random height based on 'energy' but with a wave pattern
        const baseHeight = 20 + Math.random() * 40;
        const wave = Math.sin(i / 3) * 20;
        return Math.max(10, Math.min(100, baseHeight + wave));
    });

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 relative overflow-hidden group">
            {/* Background Glow */}
            <div
                className="absolute inset-0 opacity-5 blur-2xl transition-colors duration-1000"
                style={{ backgroundColor: color }}
            />

            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                        Market Energy
                    </h3>
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                        Global Volatility Index: <span className="text-white">{energyLevel}/100</span>
                    </div>
                </div>

                <div className="flex items-end gap-1 h-8">
                    {bars.map((height, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: '20%' }}
                            animate={{ height: `${height}%` }}
                            transition={{
                                repeat: Infinity,
                                repeatType: "reverse",
                                duration: 0.5 + Math.random() * 0.5,
                                ease: "easeInOut"
                            }}
                            className="w-1 rounded-full"
                            style={{ backgroundColor: color, opacity: 0.6 + (height / 200) }}
                        />
                    ))}
                </div>
            </div>

            {/* State Label Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-4xl font-black text-white/10 uppercase tracking-[0.5em]">{state}</span>
            </div>
        </div>
    );
}
