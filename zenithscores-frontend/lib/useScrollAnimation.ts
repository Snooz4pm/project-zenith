'use client';

import { useEffect, useState, useRef, RefObject } from 'react';

interface UseScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

interface UseScrollAnimationReturn {
    ref: RefObject<HTMLElement | null>;
    isVisible: boolean;
    hasAnimated: boolean;
}

/**
 * Hook for scroll-triggered animations using Intersection Observer
 * 
 * @param options - Configuration options
 * @returns ref to attach to element, visibility state, and animation trigger state
 * 
 * @example
 * const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
 * return <div ref={ref} className={isVisible ? 'animate-fade-up' : 'opacity-0'}>Content</div>
 */
export function useScrollAnimation(
    options: UseScrollAnimationOptions = {}
): UseScrollAnimationReturn {
    const {
        threshold = 0.1,
        rootMargin = '0px',
        triggerOnce = true
    } = options;

    const ref = useRef<HTMLElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (prefersReducedMotion) {
            setIsVisible(true);
            setHasAnimated(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    setHasAnimated(true);

                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [threshold, rootMargin, triggerOnce]);

    return { ref, isVisible, hasAnimated };
}

export default useScrollAnimation;
