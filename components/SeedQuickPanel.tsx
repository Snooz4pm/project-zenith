export function SeedQuickPanel() {
    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Seed new position
            </div>

            <div className="flex gap-4 items-center">
                <div className="flex-1 bg-black/50 border border-zinc-800/50 rounded px-3 py-2 text-[10px] font-mono text-zinc-400 italic">
                    Base: SOL (Auto)
                </div>
                <div className="flex-1 bg-black/50 border border-zinc-800/50 rounded px-3 py-2 text-[10px] font-mono text-zinc-400 italic">
                    Target: SELECT_GEM
                </div>

                <button
                    disabled
                    className="px-4 py-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest opacity-50 cursor-not-allowed hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                    Seed
                </button>
            </div>
        </div>
    );
}
