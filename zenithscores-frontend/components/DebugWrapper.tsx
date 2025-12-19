'use client';

import { Suspense } from 'react';
import { NavigationLogger, BodyMonitor } from '@/components/DebugUtils';

/**
 * Client-side wrapper for debug utilities.
 * This needs to be a client component to use hooks.
 */
export default function DebugWrapper() {
    return (
        <>
            <Suspense fallback={null}>
                <NavigationLogger />
            </Suspense>
            <BodyMonitor />
        </>
    );
}
