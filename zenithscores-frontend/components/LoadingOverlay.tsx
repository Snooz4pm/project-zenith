'use client';

import { motion } from 'framer-motion';

export default function LoadingOverlay() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#0a0a12] z-[9999] flex items-center justify-center"
        >
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    {/* Animated rings */}
                    <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-2 border-2 border-cyan-500/40 rounded-full animate-pulse" />
                    <div className="absolute inset-4 border-2 border-cyan-400 rounded-full" />
                </div>
                <p className="text-gray-400 text-sm font-medium animate-pulse">Loading...</p>
            </div>
        </motion.div>
    );
}
