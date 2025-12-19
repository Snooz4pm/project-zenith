'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * 🔍 NAVIGATION LOGGER
 * Tracks all navigation events to debug freeze issues.
 * Add this component to your layout.tsx
 */
export function NavigationLogger() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        console.log('🔵 [NAV] Route changed to:', pathname);
        console.log('🔵 [NAV] Search params:', searchParams?.toString() || 'none');
        console.log('🔵 [NAV] Timestamp:', new Date().toISOString());
    }, [pathname, searchParams]);

    return null;
}

/**
 * 🚨 BODY MONITOR
 * Watches for problematic body style changes that can cause navigation freeze.
 * - overflow: hidden (often set by modals)
 * - position: fixed
 * - pointer-events: none
 */
export function BodyMonitor() {
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
                    const body = mutation.target as HTMLElement;
                    const styles = body.style;

                    // Log any style change
                    if (styles.cssText) {
                        console.log('⚠️ [BODY] Style changed:', styles.cssText);
                    }

                    // Alert on problematic styles
                    if (styles.overflow === 'hidden') {
                        console.error('🚨 [BODY] overflow: hidden detected - might block scroll/navigation');
                    }
                    if (styles.position === 'fixed') {
                        console.error('🚨 [BODY] position: fixed detected - might cause layout issues');
                    }
                    if (styles.pointerEvents === 'none') {
                        console.error('🚨 [BODY] pointer-events: none detected - BLOCKS ALL CLICKS!');
                    }

                    // Check classes
                    if (body.classList.contains('modal-open') || body.classList.contains('overflow-hidden')) {
                        console.warn('⚠️ [BODY] Modal-related class detected:', body.className);
                    }
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        console.log('🟢 [BODY MONITOR] Started watching body mutations');

        return () => {
            observer.disconnect();
            console.log('🔴 [BODY MONITOR] Stopped watching body mutations');
        };
    }, []);

    return null;
}
