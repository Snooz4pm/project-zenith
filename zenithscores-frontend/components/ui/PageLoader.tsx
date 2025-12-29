'use client';

interface PageLoaderProps {
    /** The name of the page being loaded, e.g. "Forex", "Crypto", "Learning" */
    pageName: string;
}

/**
 * Unified loading screen component.
 * Usage: <PageLoader pageName="Forex" />
 * Displays: "Initializing Forex..."
 */
export default function PageLoader({ pageName }: PageLoaderProps) {
    return (
        <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-mint)] border-t-transparent animate-spin" />
                <span className="text-[var(--accent-mint)] font-mono text-sm animate-pulse">
                    Initializing {pageName}...
                </span>
            </div>
        </div>
    );
}
