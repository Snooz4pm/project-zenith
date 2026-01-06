'use client';

import { useTradeSelection } from '@/lib/store/useTradeSelection';

export default function SwapPanel() {
    const selectedToken = useTradeSelection(s => s.selectedToken);

    return (
        <div className="rounded-2xl border border-white/5 bg-[#0B0E15] p-6 shadow-2xl backdrop-blur-xl">
            <header className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Swap</h2>
            </header>

            {/* FROM (Hardcoded SOL for now) */}
            <div className="mb-4 space-y-2">
                <label className="text-xs text-zinc-400 font-medium ml-1">From</label>
                <div className="flex items-center justify-between rounded-xl bg-zinc-900/50 border border-white/5 px-4 py-3 hover:bg-zinc-900/80 transition-colors cursor-not-allowed opacity-80">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white font-bold">SOL</div>
                        <span className="text-white font-medium">SOL</span>
                    </div>
                    <span className="text-zinc-500 text-sm">Balance: 0.00</span>
                </div>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center -my-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#0B0E15] border border-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* TO (Reactive State) */}
            <div className="mb-6 space-y-2 pt-2">
                <label className="text-xs text-zinc-400 font-medium ml-1">To</label>
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${selectedToken ? 'bg-zinc-900/50 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-zinc-900/30 border-white/5'}`}>
                    {selectedToken ? (
                        <>
                            <div className="flex items-center gap-3">
                                {selectedToken.logoURI ? (
                                    <img src={selectedToken.logoURI} className="w-6 h-6 rounded-full" alt={selectedToken.symbol} />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-zinc-800" />
                                )}
                                <div className="flex flex-col">
                                    <span className="text-white font-bold tracking-wide">{selectedToken.symbol}</span>
                                    <span className="text-[10px] text-zinc-500 max-w-[100px] truncate">{selectedToken.name}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <span className="text-zinc-500 italic text-sm">Select a token on the right...</span>
                    )}
                </div>
            </div>

            <button
                disabled={!selectedToken}
                className="w-full rounded-xl bg-emerald-500 py-4 text-black font-bold tracking-wide transition-all hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
            >
                {selectedToken ? 'Review Swap' : 'Select Token'}
            </button>
        </div>
    );
}
