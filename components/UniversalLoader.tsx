'use client';

interface UniversalLoaderProps {
    /** Full screen overlay mode (for navigation) */
    fullScreen?: boolean;
    /** Custom message to display */
    message?: string;
    /** Size: sm, md, lg */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Vercel-inspired universal loading component.
 * Minimal, geometric, dark aesthetic.
 */
export default function UniversalLoader({
    fullScreen = false,
    message = 'Loading...',
    size = 'md'
}: UniversalLoaderProps) {
    const sizeConfig = {
        sm: { triangle: 'w-6 h-6', text: 'text-xs' },
        md: { triangle: 'w-10 h-10', text: 'text-sm' },
        lg: { triangle: 'w-14 h-14', text: 'text-base' },
    };

    const config = sizeConfig[size];

    const LoaderContent = () => (
        <div className="flex flex-col items-center gap-4">
            {/* Triangle loader */}
            <div className={`relative ${config.triangle}`}>
                {/* Outer triangle - dotted, slow rotation */}
                <svg
                    viewBox="0 0 48 48"
                    className="absolute inset-0 w-full h-full animate-spin"
                    style={{ animationDuration: '6s' }}
                >
                    <polygon
                        points="24,4 44,40 4,40"
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                    />
                </svg>
                {/* Inner solid triangle */}
                <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full">
                    <polygon
                        points="24,14 34,34 14,34"
                        fill="white"
                        className="animate-pulse"
                    />
                </svg>
            </div>
            {/* Message */}
            <p className={`text-white/40 ${config.text} font-mono tracking-wide`}>
                {message}
            </p>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
                {/* Corner markers */}
                <div className="absolute top-6 left-6 w-3 h-3 border-l border-t border-white/10" />
                <div className="absolute top-6 right-6 w-3 h-3 border-r border-t border-white/10" />
                <div className="absolute bottom-6 left-6 w-3 h-3 border-l border-b border-white/10" />
                <div className="absolute bottom-6 right-6 w-3 h-3 border-r border-b border-white/10" />
                <LoaderContent />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12">
            <LoaderContent />
        </div>
    );
}

/**
 * Page loading skeleton - use in loading.tsx files
 */
export function PageLoadingSkeleton({ pageName = 'Loading' }: { pageName?: string }) {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <UniversalLoader size="lg" message={`${pageName}...`} />
        </div>
    );
}
