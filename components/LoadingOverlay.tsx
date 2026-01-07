'use client';

import UniversalLoader from './UniversalLoader';

/**
 * Full-screen loading overlay for navigation transitions.
 * Just a re-export of UniversalLoader in fullScreen mode.
 */
export default function LoadingOverlay() {
    return <UniversalLoader fullScreen message="Loading..." />;
}
