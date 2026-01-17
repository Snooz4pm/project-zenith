import { Search, Skull, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
    const [snapActive, setSnapActive] = useState(false);
    const [quoteError, setQuoteError] = useState(false);
    const lastQuoteKeyRef = useRef<string>("");

    // Quote monitoring for SNAP detection
    const checkLiquidity = useCallback(async () => {
        if (!selectedGem || !state?.hasPosition) return;

        const key = `OBS-EXIT-${selectedGem.mint}`;
        if (key === lastQuoteKeyRef.current) return;
        lastQuoteKeyRef.current = key;

        try {
            const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
            const res = await fetch(`${JUPITER_PROXY_URL}/quote?inputMint=${selectedGem.mint}&outputMint=So11111111111111111111111111111111111111112&amount=1000000`); // Test small amount
            const data = await res.json();
            setQuoteError(!data?.routePlan?.length);
        } catch (e) {
            setQuoteError(true);
        }
    }, [selectedGem, state]);

    useEffect(() => {
        checkLiquidity();
    }, [checkLiquidity]);

    async function handlePanicExit() {
        if (!onRecycle || !state?.hasPosition || !selectedGem) return;
        setLoading(true);
        try {
            await onRecycle("RECYCLE", {
                targetMint: selectedGem.mint,
                targetSymbol: selectedGem.symbol,
                state,
                isSnap: snapActive
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
                    <div className="flex gap-2">
                        {quoteError && !snapActive && (
                            <button
                                onClick={() => setSnapActive(true)}
                                className="px-3 py-1.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-amber-500 hover:text-black transition-all"
                            >
                                <AlertTriangle className="w-3 h-3" />
                                SNAP
                            </button>
                        )}
                        <button
                            disabled={loading || (quoteError && !snapActive)}
                            onClick={handlePanicExit}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all disabled:opacity-50 ${snapActive
                                ? "bg-amber-600 text-white border border-amber-400 animate-pulse shadow-[0_0_15px_rgba(217,119,6,0.4)]"
                                : "bg-red-500 text-black hover:bg-red-600"
                                } text-[9px] font-black uppercase tracking-widest`}
                        >
                            {loading ? "EXITING..." : (
                                <>
                                    <Skull className="w-3 h-3" />
                                    {snapActive ? "SNAP EXIT" : "FAST EXIT"}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
