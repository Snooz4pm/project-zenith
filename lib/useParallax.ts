'use client';

import { useState, useEffect, RefObject } from 'react';

interface UseParallaxOptions {
    speed?: number;
    direction?: 'vertical' | 'horizontal' | 'both';
    disabled?: boolean;
}

interface ParallaxOffset {
    x: number;
    y: number;
}

/**
 * Hook for parallax scrolling effects
 * 
 * @param ref - Reference to the element
 * @param options - Configuration options
 * @returns Offset values for transform
 * 
 * @example
 * const ref = useRef(null);
 * const offset = useParallax(ref, { speed: 0.5 });
 * return (
 *   <div ref={ref} style={{ transform: `translateY(${offset.y}px)` }}>
 *     Content
 *   </div>
 * );
 */
export function useParallax(
    ref: RefObject<HTMLElement | null>,
    options: UseParallaxOptions = {}
): ParallaxOffset {
    const {
        speed = 0.5,
        direction = 'vertical',
        disabled = false
    } = options;

    const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });

    useEffect(() => {
        if (disabled) return;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (prefersReducedMotion) return;

        const handleScroll = () => {
            const element = ref.current;
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const scrollY = window.scrollY;
            const elementTop = rect.top + scrollY;
            const viewportHeight = window.innerHeight;

            // Calculate how far the element is from the center of the viewport
            const elementCenter = elementTop + rect.height / 2;
            const viewportCenter = scrollY + viewportHeight / 2;
            const distanceFromCenter = elementCenter - viewportCenter;

            const newY = direction !== 'horizontal'
                ? distanceFromCenter * speed * -1
                : 0;

            const newX = direction !== 'vertical'
                ? distanceFromCenter * speed * -1
                : 0;

            setOffset({ x: newX, y: newY });
        };

        // Throttle scroll events for performance
        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        handleScroll(); // Initial calculation

        return () => {
            window.removeEventListener('scroll', throttledScroll);
        };
    }, [ref, speed, direction, disabled]);

    return offset;
}

export default useParallax;
