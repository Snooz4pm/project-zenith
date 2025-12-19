export default function LearningLoading() {
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <div className="container mx-auto px-6 py-8">
                {/* Header skeleton */}
                <div className="mb-8">
                    <div className="h-10 w-64 bg-gray-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-96 bg-gray-800/50 rounded animate-pulse" />
                </div>

                {/* Tab skeleton */}
                <div className="flex gap-4 mb-8">
                    <div className="h-10 w-24 bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-10 w-24 bg-gray-800/50 rounded-lg animate-pulse" />
                    <div className="h-10 w-24 bg-gray-800/50 rounded-lg animate-pulse" />
                </div>

                {/* Course grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-48 bg-gray-900/50 rounded-xl animate-pulse"
                            style={{ animationDelay: `${i * 100}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
