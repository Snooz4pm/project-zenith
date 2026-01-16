import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function RecycleQuickPanel({
    wallet,
    selectedGem,
    onAction,
    isGlobalSeeding,
    preloadedQuote,
    position
}: {
    wallet: any;
    selectedGem: any;
    onAction: (type: "RECYCLE", params: any) => Promise<void>;
    isGlobalSeeding?: boolean;
    preloadedQuote?: any;
    position?: any;
}) {
    // 1. State & Refs
    const [localLoading, setLocalLoading] = useState(false);
    const [internalQuote, setInternalQuote] = useState<any>(null);
    const [isInternalFetching, setIsInternalFetching] = useState(false);

    const inputMintRef = useRef(selectedGem?.mint);
    const amountRawRef = useRef<string>("0");
    const lastQuoteKeyRef = useRef<string>("");

    useEffect(() => { inputMintRef.current = selectedGem?.mint; }, [selectedGem]);

    // 2. Recycle Calculation (100% of position)
    const recycleAmountRaw = useMemo(() => {
        if (!position || !position.amount) return "0";
        const decimals = selectedGem?.decimals || 6;
        return Math.floor(position.amount * Math.pow(10, decimals)).toString();
    }, [position, selectedGem]);

    useEffect(() => { amountRawRef.current = recycleAmountRaw; }, [recycleAmountRaw]);

    // 3. SCALE, HARVEST, RECYCLE
    const isPreloadedValid = preloadedQuote &&
        preloadedQuote.inputMint === selectedGem?.mint &&
        preloadedQuote.outputMint === SOL_MINT;

    const activeQuote = isPreloadedValid ? preloadedQuote : internalQuote;

    const fetchInternalQuote = useCallback(async () => {
        if (!selectedGem || recycleAmountRaw === "0") return;

        const currentInput = inputMintRef.current;
        const currentAmountRaw = amountRawRef.current;

        if (preloadedQuote) return; // Always prefer preloaded for SOL exit

        const key = `${currentInput}-${SOL_MINT}-${currentAmountRaw}`;
        if (key === lastQuoteKeyRef.current) return;
        lastQuoteKeyRef.current = key;

        setIsInternalFetching(true);
        try {
            const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
            const res = await fetch(`${JUPITER_PROXY_URL}/quote?inputMint=${currentInput}&outputMint=${SOL_MINT}&amount=${currentAmountRaw}&slippageBps=100`);
            const data = await res.json();

            if (data && data.routePlan?.length) {
                setInternalQuote(data);
            } else {
                setInternalQuote(null);
            }
        } catch (e) {
            console.error("[RecyclePanel] Internal Quote Fetch Failed:", e);
            setInternalQuote(null);
        } finally {
            setIsInternalFetching(false);
        }
    }, [selectedGem, recycleAmountRaw, preloadedQuote]);

    useEffect(() => {
        if (!preloadedQuote) {
            const timer = setTimeout(fetchInternalQuote, 500);
            return () => clearTimeout(timer);
        } else {
            setInternalQuote(null);
        }
    }, [preloadedQuote, fetchInternalQuote]);

    const canRecycle = activeQuote && !localLoading && !isGlobalSeeding;
    const loading = localLoading || isGlobalSeeding;
    const quoteLoading = isInternalFetching || (!activeQuote && recycleAmountRaw !== "0");

    async function handleRecycleClick() {
        if (!canRecycle || !activeQuote) return;

        console.log("🚀 RECYCLE EXECUTION START", {
            gem: selectedGem.symbol,
            rawAmount: recycleAmountRaw,
            quoteOut: activeQuote.outAmount,
            isPreloaded: isPreloadedValid
        });

        setLocalLoading(true);
        try {
            await onAction("RECYCLE", {
                overrideQuote: activeQuote,
                targetMint: selectedGem.mint,
                targetSymbol: selectedGem.symbol,
                position
            });
        } finally {
            setLocalLoading(false);
        }
    }

    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    {loading ? "SEALING RECYCLE..." : `RECYCLING LIQUIDITY • ${selectedGem?.symbol}`}
                </div>
                <div className="flex items-center gap-4">
                    {activeQuote && (
                        <div className="text-zinc-500 font-mono text-[9px]">
                            Impact: <span className={parseFloat(activeQuote.priceImpactPct) > 1 ? "text-amber-500" : "text-emerald-500"}>{activeQuote.priceImpactPct}%</span>
                        </div>
                    )}
                    <div className="text-emerald-400 font-mono">
                        (100% Exit to SOL)
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                {/* Liquidation Asset Visualization */}
                <div className="flex-[1.5] bg-black/20 border border-zinc-800/30 rounded px-3 py-2 flex items-center justify-between overflow-hidden">
                    <span className="text-[10px] font-black text-white px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">{selectedGem?.symbol}</span>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] text-zinc-600 font-black uppercase">Liquidating</span>
                        <span className="text-[10px] font-mono text-emerald-400 truncate">
                            {(parseFloat(recycleAmountRaw) / Math.pow(10, selectedGem?.decimals || 6)).toFixed(2)}
                        </span>
                    </div>
                </div>

                <button
                    disabled={!canRecycle}
                    onClick={handleRecycleClick}
                    className="flex-1 group relative px-6 py-2 rounded bg-zinc-100 text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95"
                >
                    <span className={loading ? "opacity-0" : "opacity-100"}>
                        {quoteLoading ? "WARMING..." : "Recycle All"}
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
