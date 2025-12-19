export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <div className="container mx-auto px-6 py-6">
                {/* Header skeleton */}
                <div className="mb-8">
                    <div className="h-10 w-48 bg-gray-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-gray-800/50 rounded animate-pulse" />
                </div>

                {/* Tab skeleton */}
                <div className="flex gap-4 mb-8">
                    <div className="h-12 w-28 bg-gray-800 rounded-xl animate-pulse" />
                    <div className="h-12 w-28 bg-gray-800/50 rounded-xl animate-pulse" />
                    <div className="h-12 w-28 bg-gray-800/50 rounded-xl animate-pulse" />
                </div>

                {/* Content grid skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 h-48 bg-gray-900/50 rounded-xl animate-pulse" />
                    <div className="h-48 bg-gray-900/50 rounded-xl animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="h-40 bg-gray-900/50 rounded-xl animate-pulse" />
                    <div className="h-40 bg-gray-900/50 rounded-xl animate-pulse" />
                </div>

                <div className="h-96 bg-gray-900/50 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}
