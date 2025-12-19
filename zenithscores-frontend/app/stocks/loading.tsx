export default function StocksLoading() {
    return (
        <div className="theme-stock min-h-screen bg-[var(--background-dark)] pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <div className="w-full max-w-md mx-auto h-12 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="h-48 bg-gray-200/50 rounded-xl animate-pulse mb-6" />
                <div className="h-96 bg-gray-200/50 rounded-xl animate-pulse" />
            </main>
        </div>
    );
}
