'use client';

import React, { useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTilt } from '@/lib/useTilt';

interface InteractiveCardProps {
    children: ReactNode;
    className?: string;
    tiltEnabled?: boolean;
    maxTilt?: number;
    glowColor?: string;
    hoverScale?: number;
    onClick?: () => void;
}

/**
 * Interactive card with 3D tilt effect, glowing border, and enhanced glassmorphism
 */
export function InteractiveCard({
    children,
    className = '',
    tiltEnabled = true,
    maxTilt = 10,
    glowColor = 'rgba(0, 240, 255, 0.4)',
    hoverScale = 1.02,
    onClick,
}: InteractiveCardProps) {
    const tilt = useTilt({ maxTilt, scale: hoverScale });


    return (
        <motion.div
            ref={tiltEnabled ? tilt.ref as React.RefObject<HTMLDivElement> : undefined}
            style={tiltEnabled ? tilt.style : undefined}
            onMouseMove={tiltEnabled ? tilt.onMouseMove : undefined}
            onMouseLeave={tiltEnabled ? tilt.onMouseLeave : undefined}
            onClick={onClick}
            className={`
        relative overflow-hidden rounded-2xl
        bg-[rgba(15,15,25,0.4)] backdrop-blur-[40px] saturate-[180%]
        border border-white/[0.08]
        shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_rgba(255,255,255,0.1)]
        transition-all duration-300 ease-out
        group cursor-pointer
        ${className}
      `}
            whileHover={{
                boxShadow: `0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 30px ${glowColor}`,
            }}
        >
            {/* Glowing border on hover */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${glowColor}, transparent, ${glowColor})`,
                    padding: '1px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                }}
            />

            {/* Inner highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Scan line effect on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden"
            >
                <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"
                    style={{
                        transform: 'translateY(-100%)',
                        animation: 'scan-line 2s linear infinite',
                    }}
                />
            </div>
        </motion.div>
    );
}

export default InteractiveCard;
