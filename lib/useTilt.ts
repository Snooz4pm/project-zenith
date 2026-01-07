'use client';

import { useRef, useState, useCallback, RefObject, CSSProperties } from 'react';

interface UseTiltOptions {
    maxTilt?: number;
    perspective?: number;
    scale?: number;
    speed?: number;
    glare?: boolean;
    maxGlare?: number;
}

interface UseTiltReturn {
    ref: RefObject<HTMLElement | null>;
    style: CSSProperties;
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
    onMouseEnter: () => void;
}

/**
 * Hook for 3D tilt effect following cursor
 * 
 * @param options - Configuration options
 * @returns ref, style object, and event handlers
 * 
 * @example
 * const tilt = useTilt({ maxTilt: 15 });
 * return (
 *   <div 
 *     ref={tilt.ref} 
 *     style={tilt.style}
 *     onMouseMove={tilt.onMouseMove}
 *     onMouseLeave={tilt.onMouseLeave}
 *   >
 *     Content
 *   </div>
 * );
 */
export function useTilt(options: UseTiltOptions = {}): UseTiltReturn {
    const {
        maxTilt = 15,
        perspective = 1000,
        scale = 1.02,
        speed = 400,
        glare = false,
        maxGlare = 0.3,
    } = options;

    const ref = useRef<HTMLElement | null>(null);
    const [tiltStyle, setTiltStyle] = useState<CSSProperties>({
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
    });

    const onMouseMove = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            const element = ref.current;
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            const rotateX = (-mouseY / (rect.height / 2)) * maxTilt;
            const rotateY = (mouseX / (rect.width / 2)) * maxTilt;

            let glareStyle = {};
            if (glare) {
                const glareX = (mouseX / rect.width + 0.5) * 100;
                const glareY = (mouseY / rect.height + 0.5) * 100;
                glareStyle = {
                    '--glare-x': `${glareX}%`,
                    '--glare-y': `${glareY}%`,
                    '--glare-opacity': maxGlare,
                };
            }

            setTiltStyle({
                transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`,
                transition: `transform ${speed / 4}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
                ...glareStyle,
            });
        },
        [maxTilt, perspective, scale, speed, glare, maxGlare]
    );

    const onMouseLeave = useCallback(() => {
        setTiltStyle({
            transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
            transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
        });
    }, [perspective, speed]);

    const onMouseEnter = useCallback(() => {
        // Optional: Add initial animation
    }, []);

    return {
        ref,
        style: tiltStyle,
        onMouseMove,
        onMouseLeave,
        onMouseEnter,
    };
}

export default useTilt;
