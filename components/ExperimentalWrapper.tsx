'use client';

import { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';

interface ExperimentalWrapperProps {
    children: ReactNode;
    label?: string;
    showBadge?: boolean;
    className?: string;
}

/**
 * Wraps experimental/incomplete features with a disabled overlay.
 * Use this for any feature not ready for production.
 */
export default function ExperimentalWrapper({
    children,
    label = "Experimental — coming soon",
    showBadge = true,
    className = "",
}: ExperimentalWrapperProps) {
    return (
        <div className={`relative ${className}`}>
            {/* Content with reduced opacity */}
            <div className="pointer-events-none opacity-50 select-none">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                {showBadge && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/90 border border-gray-700">
                        <FlaskConical size={14} className="text-yellow-500" />
                        <span className="text-xs font-medium text-gray-300">
                            {label}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Inline experimental badge for use inside components
 */
export function ExperimentalBadge({ className = "" }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 ${className}`}>
            <FlaskConical size={10} />
            Experimental
        </span>
    );
}
