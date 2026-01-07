'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
    delay?: number;
}

/**
 * Animated counter that counts up from 0 when entering viewport
 * Odometer-style number animation
 */
export function AnimatedCounter({
    value,
    duration = 2,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = '',
    delay = 0,
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!isInView || hasAnimated.current) return;
        hasAnimated.current = true;

        // Check for reduced motion
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (prefersReducedMotion) {
            setDisplayValue(value);
            return;
        }

        const startTime = Date.now() + delay * 1000;
        const endTime = startTime + duration * 1000;

        const animate = () => {
            const now = Date.now();

            if (now < startTime) {
                requestAnimationFrame(animate);
                return;
            }

            if (now >= endTime) {
                setDisplayValue(value);
                return;
            }

            const progress = (now - startTime) / (duration * 1000);
            // Ease out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * value;

            setDisplayValue(current);
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [isInView, value, duration, delay]);

    const formattedValue = displayValue.toFixed(decimals);

    return (
        <motion.span
            ref={ref}
            className={`font-mono tabular-nums ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay }}
        >
            {prefix}
            {formattedValue}
            {suffix}
        </motion.span>
    );
}

export default AnimatedCounter;
