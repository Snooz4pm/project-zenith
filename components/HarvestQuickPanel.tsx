import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Loader2, Zap, TrendingDown, Skull } from "lucide-react";

import { PositionState, resolveExitMints, SOL_MINT } from "@/lib/engine/lifecycleState";


export function HarvestQuickPanel({
    wallet,
    selectedGem,
    onAction,
    isGlobalSeeding,
    preloadedQuote,
    position,
    state
}: {
    wallet: any;
    selectedGem: any;
    onAction: (type: "HARVEST", params: any) => Promise<void>;
    onRecycle?: (type: "RECYCLE", params: any) => Promise<void>;
    isGlobalSeeding?: boolean;
    preloadedQuote?: any;
    position?: any;
    state?: PositionState;
}) {
    // 1. State & Refs
    const [outputMint, setOutputMint] = useState<string>(SOL_MINT);
    const [localLoading, setLocalLoading] = useState(false);
    const [internalQuote, setInternalQuote] = useState<any>(null);
    const [isInternalFetching, setIsInternalFetching] = useState(false);

    const inputMintRef = useRef(selectedGem?.mint);
    const outputMintRef = useRef(outputMint);
    const amountRawRef = useRef<string>("0");
    const lastQuoteKeyRef = useRef<string>("");

    useEffect(() => { outputMintRef.current = outputMint; }, [outputMint]);
    useEffect(() => { inputMintRef.current = selectedGem?.mint; }, [selectedGem]);

    // 2. Harvest Calculation (40% of position)
    const harvestAmountRaw = useMemo(() => {
        const walletToken = wallet?.tokens?.find((t: any) => t.mint === selectedGem?.mint);
        const liveRaw = walletToken?.rawAmount ? BigInt(walletToken.rawAmount) : BigInt(0);

        // Debug Log for audit
        console.log("🔍 HARVEST BALANCE AUDIT", {
            mint: selectedGem?.mint,
            walletRaw: liveRaw.toString(),
            shadowAmount: position?.amount,
            factor: 0.4
        });

        if (liveRaw <= BigInt(0)) return "0";
        const factor = 0.4; // 40% Harvest
        return (liveRaw * BigInt(40) / BigInt(100)).toString();
    }, [wallet, selectedGem, position]);

    useEffect(() => { amountRawRef.current = harvestAmountRaw; }, [harvestAmountRaw]);

    // 3. Quote Orchestration
    const isPreloadedValid = preloadedQuote &&
        preloadedQuote.inputMint === selectedGem?.mint &&
        outputMint === SOL_MINT &&
        preloadedQuote.outputMint === SOL_MINT;

    const activeQuote = isPreloadedValid ? preloadedQuote : internalQuote;

    const fetchInternalQuote = useCallback(async () => {
        if (!selectedGem || harvestAmountRaw === "0") return;

        const currentInput = inputMintRef.current;
        let currentOutput = outputMintRef.current;
        const currentAmountRaw = amountRawRef.current;

        // Auto-resolve identity swap if it occurs
        if (currentInput === currentOutput) {
            const resolved = resolveExitMints(currentInput);
            currentOutput = resolved.outputMint;

            // Sync the UI if it drifted (optional, but good for feedback)
            if (outputMint !== currentOutput) {
                setOutputMint(currentOutput);
            }
        }

        const key = `${currentInput}-${currentOutput}-${currentAmountRaw}`;
        if (key === lastQuoteKeyRef.current) return;
        lastQuoteKeyRef.current = key;

        setIsInternalFetching(true);
        try {
            const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
            const res = await fetch(`${JUPITER_PROXY_URL}/quote?inputMint=${currentInput}&outputMint=${currentOutput}&amount=${currentAmountRaw}&slippageBps=100`);
            const data = await res.json();

            if (data && data.routePlan?.length) {
                setInternalQuote(data);
            } else {
                setInternalQuote(null);
            }
        } catch (e) {
            console.error("[HarvestPanel] Internal Quote Fetch Failed:", e);
            setInternalQuote(null);
        } finally {
            setIsInternalFetching(false);
        }
    }, [selectedGem, harvestAmountRaw, preloadedQuote]);

    useEffect(() => {
        if (outputMint !== SOL_MINT || !preloadedQuote) {
            const timer = setTimeout(fetchInternalQuote, 500);
            return () => clearTimeout(timer);
        } else {
            setInternalQuote(null);
        }
    }, [outputMint, preloadedQuote, fetchInternalQuote]);

    const canHarvest = activeQuote && !localLoading && !isGlobalSeeding && (state?.canHarvest !== false);
    const loading = localLoading || isGlobalSeeding;
    const quoteLoading = isInternalFetching || (!activeQuote && harvestAmountRaw !== "0");

    async function handleHarvestClick() {
        if (!canHarvest || !activeQuote) return;

        console.log("🚀 HARVEST EXECUTION START", {
            gem: selectedGem.symbol,
            output: outputMint,
            rawAmount: harvestAmountRaw,
            quoteOut: activeQuote.outAmount,
            isPreloaded: isPreloadedValid
        });

        setLocalLoading(true);
        try {
            await onAction("HARVEST", {
                overrideQuote: activeQuote,
                targetMint: selectedGem.mint,
                targetSymbol: selectedGem.symbol,
                position
            });
        } finally {
            setLocalLoading(false);
        }
    }

    async function handlePanicExit() {
        if (!onRecycle || !selectedGem) return;
        setLocalLoading(true);
        try {
            await onRecycle("RECYCLE", {
                targetMint: selectedGem.mint,
                targetSymbol: selectedGem.symbol,
                state
            });
        } finally {
            setLocalLoading(false);
        }
    }

    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {loading ? "SEALING HARVEST..." : `HARVESTING PROFITS • ${selectedGem?.symbol}`}
                </div>
                <div className="flex items-center gap-4">
                    {activeQuote && (
                        <div className="text-zinc-500 font-mono text-[9px]">
                            Impact: <span className={parseFloat(activeQuote.priceImpactPct) > 1 ? "text-amber-500" : "text-emerald-500"}>{activeQuote.priceImpactPct}%</span>
                        </div>
                    )}
                    <div className="text-amber-400 font-mono">
                        (40% Partial Exit)
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                {/* Selling Asset Visualization */}
                <div className="flex-1 bg-black/20 border border-zinc-800/30 rounded px-3 py-2 flex items-center justify-between overflow-hidden">
                    <span className="text-[10px] font-black text-white px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">{selectedGem?.symbol}</span>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] text-zinc-600 font-black uppercase">Selling</span>
                        <span className="text-[10px] font-mono text-amber-400 truncate max-w-[80px]">
                            {(parseFloat(harvestAmountRaw) / Math.pow(10, selectedGem?.decimals || 6)).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Destination Asset Selection */}
                <div className="relative flex-1">
                    <select
                        disabled={loading}
                        className="w-full bg-black/50 border border-zinc-800/50 rounded px-3 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-amber-500/50 transition-colors cursor-pointer appearance-none disabled:opacity-50"
                        onChange={e => setOutputMint(e.target.value)}
                        value={outputMint || ""}
                    >
                        <option value={SOL_MINT} className="bg-zinc-900">SOL</option>
                        {wallet?.tokens?.map((t: any) => (
                            <option key={t.mint} value={t.mint} className="bg-zinc-900">
                                {t.symbol}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-zinc-600 font-black">TO</div>
                </div>

                <button
                    disabled={!canHarvest}
                    onClick={handleHarvestClick}
                    className="group relative px-6 py-2 rounded bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95"
                >
                    <span className={loading ? "opacity-0" : "opacity-100"}>
                        {quoteLoading ? "WARMING..." : (state?.canHarvest === false ? "No Profit Yet" : "Harvest")}
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        </div>
                    )}
                </button>

                <button
                    disabled={loading}
                    onClick={handlePanicExit}
                    className="px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    title="Panic Exit - Liquidate 100% to SOL"
                >
                    <Skull className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
