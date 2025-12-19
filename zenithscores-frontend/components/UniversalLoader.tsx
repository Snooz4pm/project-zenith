'use client';

import { motion } from 'framer-motion';

interface UniversalLoaderProps {
    /** Full screen overlay mode (for navigation) */
    fullScreen?: boolean;
    /** Custom message to display */
    message?: string;
    /** Size: sm, md, lg */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Universal loading component for the entire ZenithScores platform.
 * Use this EVERYWHERE for consistent loading experience.
 */
export default function UniversalLoader({
    fullScreen = false,
    message = 'Loading...',
    size = 'md'
}: UniversalLoaderProps) {
    const sizeConfig = {
        sm: { ring: 'w-8 h-8', text: 'text-xs' },
        md: { ring: 'w-12 h-12', text: 'text-sm' },
        lg: { ring: 'w-16 h-16', text: 'text-base' },
    };

    const config = sizeConfig[size];

    const LoaderContent = () => (
        <div className="text-center">
            {/* Animated Zenith Loader */}
            <div className={`relative ${config.ring} mx-auto mb-4`}>
                {/* Outer ring - pulsing */}
                <motion.div
                    className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Middle ring - spinning */}
                <motion.div
                    className="absolute inset-1 border-2 border-transparent border-t-cyan-400 border-r-purple-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                {/* Inner dot - pulsing */}
                <motion.div
                    className="absolute inset-3 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full"
                    animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            {/* Message */}
            <motion.p
                className={`text-gray-400 ${config.text} font-medium`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                {message}
            </motion.p>
        </div>
    );

    if (fullScreen) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-[#0a0a12] z-[9999] flex items-center justify-center"
            >
                <LoaderContent />
            </motion.div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12">
            <LoaderContent />
        </div>
    );
}

/**
 * Page loading skeleton - use in loading.tsx files
 */
export function PageLoadingSkeleton({ pageName = 'Loading' }: { pageName?: string }) {
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <div className="container mx-auto px-6 py-8">
                <UniversalLoader size="lg" message={`${pageName}...`} />
            </div>
        </div>
    );
}
