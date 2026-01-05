interface RoutePreviewProps {
    quote: any; // Type this properly later with the backend response type
    isLoading: boolean;
    error?: string | null;
}

export function RoutePreview({ quote, isLoading, error }: RoutePreviewProps) {
    if (isLoading) {
        return (
            <div className="bg-[#111116] rounded-xl p-4 border border-white/5 animate-pulse space-y-2">
                <div className="h-4 bg-white/5 rounded w-1/3"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                {error}
            </div>
        );
    }

    if (!quote) return null;

    return (
        <div className="bg-[#111116] rounded-xl p-4 border border-white/5 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-zinc-500">Rate</span>
                <span className="text-zinc-300">1 {quote.inputMint} ≈ {quote.price} {quote.outputMint}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-zinc-500">Route</span>
                <span className="text-zinc-300">Jupiter</span>
            </div>
            {/* Add more details as needed from the quote object */}
        </div>
    );
}
