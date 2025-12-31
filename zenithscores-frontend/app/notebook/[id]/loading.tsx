import { Terminal } from 'lucide-react';

export default function JournalLoading() {
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-sans flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 animate-pulse">
                    <Terminal className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Loading Flight Log...</h2>
                <p className="text-sm text-zinc-500">Retrieving mission data</p>

                {/* Skeleton loader for content */}
                <div className="mt-8 max-w-md mx-auto space-y-4">
                    <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-4 bg-white/5 rounded w-3/4 mx-auto animate-pulse" />
                    <div className="h-32 bg-white/5 rounded-xl animate-pulse mt-6" />
                </div>
            </div>
        </div>
    );
}
