import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { computePortfolioUsd, computeSeedUsd } from "@/lib/engine/portfolio";

import { PositionState } from "@/lib/engine/lifecycleState";

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function SeedQuickPanel({
    wallet,
    selectedGem,
    onAction,
    isGlobalSeeding,
    preloadedQuote,
    state
}: {
    wallet: any;
    selectedGem: any;
    onAction: (params: {
        overrideQuote: any;
        baseMint: string;
        targetMint: string;
        seedUsd: number;
    }) => Promise<void>;
    isGlobalSeeding?: boolean;
    preloadedQuote?: any;
    state?: PositionState;
}) {
    // 1. State & Refs (The Swap Engine Pattern)
    const [baseMint, setBaseMint] = useState<string>(SOL_MINT);
    const [localLoading, setLocalLoading] = useState(false);
    const [internalQuote, setInternalQuote] = useState<any>(null);
    const [isInternalFetching, setIsInternalFetching] = useState(false);

    const baseMintRef = useRef(baseMint);
    const targetMintRef = useRef(selectedGem?.mint);
    const amountUsdRef = useRef(0);
    const lastQuoteKeyRef = useRef<string>("");

    // Update refs automatically
    useEffect(() => { baseMintRef.current = baseMint; }, [baseMint]);
    useEffect(() => { targetMintRef.current = selectedGem?.mint; }, [selectedGem]);

    // 2. Stable Portfolio and Seed USD Calculation
    const portfolioUsd = useMemo(() => computePortfolioUsd(wallet, wallet.solPrice), [wallet]);
    const seedUsd = useMemo(() => computeSeedUsd(portfolioUsd), [portfolioUsd]);

    useEffect(() => { amountUsdRef.current = seedUsd; }, [seedUsd]);

    // 3. Quote Orchestration
    // Identify if the preloaded quote is valid for our current selection
    const isPreloadedValid = preloadedQuote &&
        preloadedQuote.inputMint === SOL_MINT &&
        baseMint === SOL_MINT &&
        preloadedQuote.outputMint === selectedGem?.mint;

    // The working quote used for execution
    const activeQuote = isPreloadedValid ? preloadedQuote : internalQuote;

    // 4. Internal Fetcher (When user changes baseMint or preloaded is missing)
    const fetchInternalQuote = useCallback(async () => {
        if (!selectedGem || seedUsd <= 0) return;

        const currentBase = baseMintRef.current;
        const currentTarget = targetMintRef.current;
        const currentAmountUsd = amountUsdRef.current;

        // Skip fetch if we already have a valid preloaded quote for SOL
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

            if (rawAmount <= 0) {
                setInternalQuote(null);
                return;
            }

            const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
            const res = await fetch(`${JUPITER_PROXY_URL}/quote?inputMint=${currentBase}&outputMint=${currentTarget}&amount=${rawAmount.toString()}&slippageBps=100`);
            const data = await res.json();

            if (data && data.routePlan?.length) {
                setInternalQuote(data);
            } else {
                setInternalQuote(null);
            }
        } catch (e) {
            console.error("[SeedPanel] Internal Quote Fetch Failed:", e);
            setInternalQuote(null);
        } finally {
            setIsInternalFetching(false);
        }
    }, [selectedGem, seedUsd, wallet, preloadedQuote]);

    // Refresh internal quote when inputs change
    useEffect(() => {
        if (baseMint !== SOL_MINT || !preloadedQuote) {
            const timer = setTimeout(fetchInternalQuote, 500);
            return () => clearTimeout(timer);
        } else {
            setInternalQuote(null); // Use preloaded
        }
    }, [baseMint, preloadedQuote, fetchInternalQuote]);

    const canSeed = activeQuote && !localLoading && !isGlobalSeeding && (state?.canSeed !== false);
    const loading = localLoading || isGlobalSeeding;
    const quoteLoading = isInternalFetching || (!activeQuote && seedUsd > 0);

    // 5. Explicit Execution (Mirroring SwapPanel)
    async function handleSeedClick() {
        if (!canSeed || !activeQuote) return;

        // Log the EXACT state before launching execution
        console.log("🚀 SEED EXECUTION START", {
            gem: selectedGem.symbol,
            base: baseMint,
            usd: seedUsd,
            quoteOut: activeQuote.outAmount,
            quoteImpact: activeQuote.priceImpactPct,
            isPreloaded: isPreloadedValid
        });

        setLocalLoading(true);
        try {
            await onAction({
                overrideQuote: activeQuote,
                baseMint: baseMint,
                targetMint: selectedGem.mint,
                seedUsd: seedUsd
            });
        } finally {
            setLocalLoading(false);
        }
    }

    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                    {loading ? "SEALING TRANSACTION..." : `HOT SEEDING • ${selectedGem?.symbol}`}
                </div>
                <div className="flex items-center gap-4">
                    {activeQuote && (
                        <div className="text-zinc-500 font-mono text-[9px]">
                            Impact: <span className={parseFloat(activeQuote.priceImpactPct) > 1 ? "text-amber-500" : "text-emerald-500"}>{activeQuote.priceImpactPct}%</span>
                        </div>
                    )}
                    <div className="text-emerald-400 font-mono">
                        {seedUsd > 0 ? `$${seedUsd.toFixed(2)}` : "$0.00"} (2%)
                    </div>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                {/* Base Asset Selection */}
                <div className="relative flex-1">
                    <select
                        disabled={loading}
                        className="w-full bg-black/50 border border-zinc-800/50 rounded px-3 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer appearance-none disabled:opacity-50"
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
                    <span className="text-[10px] font-black text-white px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">{selectedGem?.symbol}</span>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] text-zinc-600 font-black uppercase">Receiving</span>
                        <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[80px]">
                            {quoteLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : activeQuote ? (
                                (parseFloat(activeQuote.outAmount) / Math.pow(10, selectedGem?.decimals || 6)).toFixed(2)
                            ) : "..."}
                        </span>
                    </div>
                </div>

                <button
                    disabled={!canSeed}
                    onClick={handleSeedClick}
                    className="group relative px-6 py-2 rounded bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95"
                >
                    <span className={loading ? "opacity-0" : "opacity-100"}>
                        {quoteLoading ? "WARMING..." : (state?.canSeed === false ? "Position Active" : "Seed")}
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
