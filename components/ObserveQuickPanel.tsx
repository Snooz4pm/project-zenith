import { Search, Skull } from 'lucide-react';
import { useState } from 'react';
import { PositionState } from "@/lib/engine/lifecycleState";

export function ObserveQuickPanel({
    selectedGem,
    onRecycle,
    position,
    state
}: {
    selectedGem?: any;
    onRecycle?: (type: "RECYCLE", params: any) => Promise<void>;
    position?: any;
    state?: PositionState;
}) {
    const [loading, setLoading] = useState(false);

    async function handlePanicExit() {
        if (!onRecycle || !state?.hasPosition || !selectedGem) return;
        setLoading(true);
        try {
            await onRecycle("RECYCLE", {
                targetMint: selectedGem.mint,
                targetSymbol: selectedGem.symbol,
                state
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-cyan-400" />
                    Observing Market Physics
                </div>
                {state?.hasPosition && (
                    <div className="text-emerald-500/50 font-mono text-[8px] uppercase tracking-widest animate-pulse">
                        Position Active
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] font-mono text-zinc-600 italic flex-1">
                    Kernel: Scanning for momentum surges and liquidity anomalies...
                </div>

                {state?.hasPosition && (
                    <button
                        disabled={loading}
                        onClick={handlePanicExit}
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                        {loading ? "EXITING..." : (
                            <>
                                <Skull className="w-3 h-3" />
                                Exit Position
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
