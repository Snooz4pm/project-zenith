'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface GhostFeatureProps {
    title: string;
    preview: ReactNode;
    unlockMessage: string;
    onClick?: () => void;
    className?: string;
}

export function GhostFeature({
    title,
    preview,
    unlockMessage,
    onClick,
    className = ''
}: GhostFeatureProps) {
    return (
        <div className={`relative rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
            {/* Blurred preview */}
            <div className="blur-[4px] opacity-50 pointer-events-none">
                {preview}
            </div>

            {/* Overlay with unlock message */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/20 to-transparent p-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-3"
                >
                    <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Lock size={20} className="text-gray-600 dark:text-gray-400" />
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                        {title}
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                        {unlockMessage}
                    </p>

                    {onClick && (
                        <motion.button
                            onClick={onClick}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg"
                        >
                            Unlock with Calibration
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

// Compact version for inline use
export function GhostBadge({
    label,
    onClick
}: {
    label: string;
    onClick?: () => void;
}) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
            <Lock size={10} />
            <span>{label}</span>
        </motion.button>
    );
}
