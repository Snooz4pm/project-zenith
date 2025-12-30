export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
            <div className="text-center">
                <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-[#0B0E1A] font-bold text-3xl font-mono">Z</span>
                    <div className="absolute inset-0 rounded-lg bg-cyan-400 opacity-50 animate-ping"></div>
                </div>
                <p className="text-cyan-400 text-sm font-mono uppercase tracking-widest animate-pulse">Loading Zenith...</p>
            </div>
        </div>
    );
}
