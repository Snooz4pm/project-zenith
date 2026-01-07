'use client';

import { useState, useCallback, RefObject, CSSProperties } from 'react';

interface UseMagneticOptions {
    strength?: number;
    radius?: number;
    duration?: number;
}

interface UseMagneticReturn {
    style: CSSProperties;
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
}

/**
 * Hook for magnetic cursor effect on buttons/elements
 * Element follows cursor within a radius
 * 
 * @param ref - Reference to the element
 * @param options - Configuration options
 * @returns Style object and event handlers
 * 
 * @example
 * const ref = useRef(null);
 * const magnetic = useMagnetic(ref, { strength: 0.3 });
 * return (
 *   <button 
 *     ref={ref} 
 *     style={magnetic.style}
 *     onMouseMove={magnetic.onMouseMove}
 *     onMouseLeave={magnetic.onMouseLeave}
 *   >
 *     Click me
 *   </button>
 * );
 */
export function useMagnetic(
    ref: RefObject<HTMLElement | null>,
    options: UseMagneticOptions = {}
): UseMagneticReturn {
    const {
        strength = 0.3,
        radius = 100,
        duration = 300
    } = options;

    const [style, setStyle] = useState<CSSProperties>({
        transform: 'translate(0px, 0px)',
        transition: `transform ${duration}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
    });

    const onMouseMove = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            const element = ref.current;
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

            if (distance < radius) {
                const translateX = distanceX * strength;
                const translateY = distanceY * strength;

                setStyle({
                    transform: `translate(${translateX}px, ${translateY}px)`,
                    transition: `transform ${duration / 4}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
                });
            }
        },
        [ref, strength, radius, duration]
    );

    const onMouseLeave = useCallback(() => {
        setStyle({
            transform: 'translate(0px, 0px)',
            transition: `transform ${duration}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
        });
    }, [duration]);

    return { style, onMouseMove, onMouseLeave };
}

export default useMagnetic;
