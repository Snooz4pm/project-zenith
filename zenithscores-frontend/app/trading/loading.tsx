export default function TradingLoading() {
    return (
        <div className="min-h-screen bg-[#0a0a12] pt-20 md:pt-24">
            <div className="container mx-auto px-6 py-8">
                <div className="h-10 w-48 bg-gray-800 rounded animate-pulse mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                    <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                    <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                    <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                </div>
                <div className="h-96 bg-gray-900/50 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}
