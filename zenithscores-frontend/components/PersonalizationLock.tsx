'use client';

import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonalizationLockProps {
    feature: string;
    description?: string;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function PersonalizationLock({
    feature,
    description,
    onClick,
    size = 'md',
    className = ''
}: PersonalizationLockProps) {
    const sizeClasses = {
        sm: 'text-xs gap-1',
        md: 'text-sm gap-2',
        lg: 'text-base gap-3'
    };

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 16
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
        flex items-center ${sizeClasses[size]} 
        text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300
        transition-colors cursor-pointer group
        ${className}
      `}
        >
            <Lock
                size={iconSizes[size]}
                className="text-gray-400 group-hover:text-blue-500 transition-colors"
            />
            <div className="flex flex-col items-start">
                <span className="font-medium">{feature}</span>
                {description && (
                    <span className="text-xs text-gray-400 group-hover:text-gray-500">
                        {description}
                    </span>
                )}
            </div>
        </motion.button>
    );
}

// Inline lock hint for compact spaces
export function InlineLock({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
            title="Login to unlock personalization"
        >
            <Lock size={12} />
            <span className="text-xs">Personalized</span>
        </button>
    );
}
