'use client';

interface PageLoaderProps {
    /** The name of the page being loaded */
    pageName: string;
}

/**
 * Vercel-inspired page loading screen.
 * Usage: <PageLoader pageName="Swap" />
 */
export default function PageLoader({ pageName }: PageLoaderProps) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Corner markers */}
            <div className="absolute top-8 left-8 w-4 h-4 border-l border-t border-white/10" />
            <div className="absolute top-8 right-8 w-4 h-4 border-r border-t border-white/10" />
            <div className="absolute bottom-8 left-8 w-4 h-4 border-l border-b border-white/10" />
            <div className="absolute bottom-8 right-8 w-4 h-4 border-r border-b border-white/10" />

            <div className="flex flex-col items-center gap-6">
                {/* Triangle loader */}
                <div className="relative w-12 h-12">
                    <svg
                        viewBox="0 0 48 48"
                        className="absolute inset-0 w-full h-full animate-spin"
                        style={{ animationDuration: '8s' }}
                    >
                        <polygon
                            points="24,4 44,40 4,40"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    </svg>
                    <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full">
                        <polygon
                            points="24,14 34,34 14,34"
                            fill="white"
                            className="animate-pulse"
                        />
                    </svg>
                </div>

                {/* Page name */}
                <p className="text-white/40 text-sm font-mono tracking-wider">
                    {pageName}
                </p>
            </div>
        </div>
    );
}
