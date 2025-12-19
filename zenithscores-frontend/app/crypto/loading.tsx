export default function CryptoLoading() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Ticker skeleton */}
            <div className="h-10 bg-gray-900 animate-pulse" />

            {/* Header skeleton */}
            <div className="border-b border-gray-800 bg-black/50">
                <div className="container mx-auto px-6 py-8">
                    <div className="h-8 w-64 bg-gray-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-gray-800/50 rounded animate-pulse" />
                </div>
            </div>

            {/* Content skeleton */}
            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <div className="h-16 max-w-xl mx-auto bg-gray-900 rounded-lg animate-pulse" />
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                        <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                        <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                    </div>
                    <div className="h-96 bg-gray-900/50 rounded-xl animate-pulse" />
                </div>
            </main>
        </div>
    );
}
