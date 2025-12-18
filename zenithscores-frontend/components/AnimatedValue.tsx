'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

interface AnimatedValueProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    duration?: number;
    className?: string;
    showChange?: boolean;
    previousValue?: number;
}

export default function AnimatedValue({
    value,
    prefix = '$',
    suffix = '',
    decimals = 0,
    duration = 1.5,
    className = '',
    showChange = false,
    previousValue
}: AnimatedValueProps) {
    const [prevVal, setPrevVal] = useState(previousValue ?? value);
    const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Flash effect on value change
        if (value > prevVal) {
            setFlashColor('green');
        } else if (value < prevVal) {
            setFlashColor('red');
        }

        const timeout = setTimeout(() => {
            setFlashColor(null);
            setPrevVal(value);
        }, 500);

        return () => clearTimeout(timeout);
    }, [value, prevVal]);

    const change = value - prevVal;
    const changePercent = prevVal !== 0 ? ((change / prevVal) * 100) : 0;

    return (
        <div className={`relative ${className}`}>
            {/* Flash border effect */}
            <AnimatePresence>
                {flashColor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 rounded-lg pointer-events-none ${flashColor === 'green'
                                ? 'shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-500/50'
                                : 'shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-500/50'
                            }`}
                    />
                )}
            </AnimatePresence>

            <CountUp
                start={prevVal}
                end={value}
                duration={duration}
                decimals={decimals}
                prefix={prefix}
                suffix={suffix}
                preserveValue
            />

            {/* Change indicator */}
            {showChange && change !== 0 && (
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`ml-2 text-xs font-medium ${change > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                >
                    {change > 0 ? '+' : ''}{changePercent.toFixed(2)}%
                </motion.span>
            )}
        </div>
    );
}
