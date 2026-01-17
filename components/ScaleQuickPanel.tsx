import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Loader2, TrendingUp, ArrowUpRight, Skull, AlertTriangle } from "lucide-react";
import { computePortfolioUsd } from "@/lib/engine/portfolio";

import { PositionState } from "@/lib/engine/lifecycleState";

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function ScaleQuickPanel({
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
    onAction: (type: "SCALE", params: any) => Promise<void>;
    onRecycle?: (type: "RECYCLE", params: any) => Promise<void>;
    isGlobalSeeding?: boolean;
    preloadedQuote?: any;
    position?: any;
    state?: PositionState;
}) {
    // 1. State & Refs
    const [baseMint, setBaseMint] = useState<string>(SOL_MINT);
    const [localLoading, setLocalLoading] = useState(false);
    const [internalQuote, setInternalQuote] = useState<any>(null);
    const [isInternalFetching, setIsInternalFetching] = useState(false);
    const [snapActive, setSnapActive] = useState(false);
    const [quoteError, setQuoteError] = useState(false);

    const baseMintRef = useRef(baseMint);
    const targetMintRef = useRef(selectedGem?.mint);
    const amountUsdRef = useRef(0);
    const lastQuoteKeyRef = useRef<string>("");

    useEffect(() => { baseMintRef.current = baseMint; }, [baseMint]);
    useEffect(() => { targetMintRef.current = selectedGem?.mint; }, [selectedGem]);

    // 2. Scale Calculation (6% of portfolio)
    const portfolioUsd = useMemo(() => computePortfolioUsd(wallet, wallet.solPrice), [wallet]);
    const scaleUsd = useMemo(() => portfolioUsd * 0.06, [portfolioUsd]);

    useEffect(() => { amountUsdRef.current = scaleUsd; }, [scaleUsd]);

    // 3. Quote Orchestration
    const isPreloadedValid = preloadedQuote &&
        preloadedQuote.inputMint === SOL_MINT &&
        baseMint === SOL_MINT &&
        preloadedQuote.outputMint === selectedGem?.mint;

    const activeQuote = isPreloadedValid ? preloadedQuote : internalQuote;

    const fetchInternalQuote = useCallback(async () => {
        if (!selectedGem || scaleUsd <= 0) return;

        const currentBase = baseMintRef.current;
        const currentTarget = targetMintRef.current;
        const currentAmountUsd = amountUsdRef.current;

        if (currentBase === SOL_MINT && preloadedQuote) return;

        const key = `${currentBase}-${currentTarget}-${currentAmountUsd}`;
        if (key === lastQuoteKeyRef.current) return;
        lastQuoteKeyRef.current = key;

        setIsInternalFetching(true);
        try {
            const basePrice = currentBase === SOL_MINT
                ? wallet.solPrice
                : (wallet.tokens?.find((t: any) => t.mint === currentBase)?.usdValue / wallet.tokens?.find((t: any) => t.mint === currentBase)?.amount) || 1;

            const decimals = currentBase === SOL_MINT ? 9 : (wallet.tokens?.find((t: any) => t.mint === currentBase)?.decimals || 6);
            const rawAmount = Math.floor((currentAmountUsd / basePrice) * Math.pow(10, decimals));

            if (rawAmount <= 0) return;

            const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
            const res = await fetch(`${JUPITER_PROXY_URL}/quote?inputMint=${currentBase}&outputMint=${currentTarget}&amount=${rawAmount.toString()}&slippageBps=100`);
            const data = await res.json();

            if (data && data.routePlan?.length) {
                setInternalQuote(data);
                setQuoteError(false);
            } else {
                setInternalQuote(null);
                setQuoteError(true);
            }
        } catch (e) {
            console.error("[ScalePanel] Internal Quote Fetch Failed:", e);
            setInternalQuote(null);
            setQuoteError(true);
        } finally {
            setIsInternalFetching(false);
        }
    }, [selectedGem, scaleUsd, wallet, preloadedQuote]);

    useEffect(() => {
        if (baseMint !== SOL_MINT || !preloadedQuote) {
            const timer = setTimeout(fetchInternalQuote, 500);
            return () => clearTimeout(timer);
        } else {
            setInternalQuote(null);
        }
    }, [baseMint, preloadedQuote, fetchInternalQuote]);

    const canScale = activeQuote && !localLoading && !isGlobalSeeding && (state?.canScale !== false);
    const loading = localLoading || isGlobalSeeding;
    const quoteLoading = isInternalFetching || (!activeQuote && scaleUsd > 0);

    async function handleScaleClick() {
        if (!canScale || !activeQuote) return;

        console.log("🚀 SCALE EXECUTION START", {
            gem: selectedGem.symbol,
            base: baseMint,
            usd: scaleUsd,
            quoteOut: activeQuote.outAmount,
            isPreloaded: isPreloadedValid
        });

        setLocalLoading(true);
        try {
            await onAction("SCALE", {
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
                state,
                isSnap: snapActive
            });
        } finally {
            setLocalLoading(false);
        }
    }

    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                    {loading ? "SEALING SCALE..." : `SCALING POSITION • ${selectedGem?.symbol}`}
                </div>
                <div className="flex items-center gap-4">
                    {activeQuote && (
                        <div className="text-zinc-500 font-mono text-[9px]">
                            Impact: <span className={parseFloat(activeQuote.priceImpactPct) > 1 ? "text-amber-500" : "text-emerald-500"}>{activeQuote.priceImpactPct}%</span>
                        </div>
                    )}
                    <div className="text-cyan-400 font-mono">
                        ${scaleUsd.toFixed(2)} (6%)
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                {/* Base Asset Selection */}
                <div className="relative flex-1">
                    <select
                        disabled={loading}
                        className="w-full bg-black/50 border border-zinc-800/50 rounded px-3 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-cyan-500/50 transition-colors cursor-pointer appearance-none disabled:opacity-50"
                        onChange={e => setBaseMint(e.target.value)}
                        value={baseMint || ""}
                    >
                        <option value={SOL_MINT} className="bg-zinc-900">SOL</option>
                        {wallet?.tokens?.map((t: any) => (
                            <option key={t.mint} value={t.mint} className="bg-zinc-900">
                                {t.symbol} ({t.amount.toFixed(2)})
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-zinc-600 font-black">BASE</div>
                </div>

                {/* Target Asset Visualization */}
                <div className="flex-1 bg-black/20 border border-zinc-800/30 rounded px-3 py-2 flex items-center justify-between overflow-hidden">
                    <span className="text-[10px] font-black text-white px-1.5 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20">{selectedGem?.symbol}</span>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] text-zinc-600 font-black uppercase">Adding</span>
                        <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[80px]">
                            {quoteLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : activeQuote ? (
                                (parseFloat(activeQuote.outAmount) / Math.pow(10, selectedGem?.decimals || 6)).toFixed(2)
                            ) : "..."}
                        </span>
                    </div>
                </div>

                <button
                    disabled={!canScale}
                    onClick={handleScaleClick}
                    className="group relative px-6 py-2 rounded bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:scale-105 active:scale-95"
                >
                    <span className={loading ? "opacity-0" : "opacity-100"}>
                        {quoteLoading ? "WARMING..." : (state?.canScale === false ? "Waiting for Profit" : "Scale")}
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        </div>
                    )}
                </button>

                <div className="flex gap-2">
                    {quoteError && !snapActive && (
                        <button
                            onClick={() => setSnapActive(true)}
                            className="px-3 py-2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-amber-500 hover:text-black transition-all"
                            title="Activate SNAP Safe Exit (Fallback Route)"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            SNAP
                        </button>
                    )}
                    <button
                        disabled={loading || (quoteError && !snapActive)}
                        onClick={handlePanicExit}
                        className={`px-3 py-2 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${snapActive
                                ? "bg-amber-600 text-white border border-amber-400 animate-pulse shadow-[0_0_15px_rgba(217,119,6,0.4)]"
                                : "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                            }`}
                        title={snapActive ? "FAST EXIT (SNAP MODE)" : "FAST EXIT - Liquidate 100% to SOL"}
                    >
                        <Skull className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {snapActive ? "SNAP EXIT" : "FAST EXIT"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
