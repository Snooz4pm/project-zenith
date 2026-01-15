import { useState, useMemo, useEffect } from "react";
import { computePortfolioUsd, computeSeedUsd } from "@/lib/engine/portfolio";

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function SeedQuickPanel({
    wallet,
    selectedGem,
    onSeed,
    isGlobalSeeding,
    preloadedQuote
}: {
    wallet: any;
    selectedGem: any;
    onSeed: (params: {
        quote: any;
        baseMint: string;
        targetMint: string;
        seedUsd: number;
    }) => Promise<void>;
    isGlobalSeeding?: boolean;
    preloadedQuote?: any;
}) {
    const [baseMint, setBaseMint] = useState<string>(SOL_MINT);
    const [localLoading, setLocalLoading] = useState(false);
    const [quote, setQuote] = useState<any>(preloadedQuote || null);
    const [error, setError] = useState<string | null>(null);

    const targetMint = selectedGem?.mint;
    const loading = localLoading || isGlobalSeeding;

    // We assume solPrice is passed or global, for now we will use wallet.solUsd if present
    // or default to a baseline if we can't find it.
    const portfolioUsd = useMemo(
        () => computePortfolioUsd(wallet),
        [wallet]
    );

    const seedUsd = useMemo(
        () => computeSeedUsd(portfolioUsd),
        [portfolioUsd]
    );

    // Sync with preloaded quote
    useEffect(() => {
        if (preloadedQuote && !quote && baseMint === SOL_MINT) {
            setQuote(preloadedQuote);
        }
    }, [preloadedQuote, quote, baseMint]);

    // Background fetcher (if preloaded missing or base changed)
    useEffect(() => {
        if (!baseMint || !targetMint || !seedUsd || seedUsd <= 0) return;
        if (preloadedQuote && baseMint === SOL_MINT) return; // Skip if we have a hot quote for SOL

        let active = true;
        setQuote(null);
        setError(null);

        const fetchQuote = async () => {
            try {
                // 1. Convert USD to base amount (we need current base price)
                // Note: The parent handleSeed also calculates this, but for UX preview we do it here
                const basePrice = baseMint === SOL_MINT ? (wallet.solUsd / wallet.sol) : (wallet.tokens.find((t: any) => t.mint === baseMint)?.usdValue / wallet.tokens.find((t: any) => t.mint === baseMint)?.amount) || 0;

                if (!basePrice) throw new Error("Price unknown");

                const baseDecimals = baseMint === SOL_MINT ? 9 : wallet.tokens.find((t: any) => t.mint === baseMint)?.decimals || 6;
                const rawAmount = Math.floor((seedUsd / basePrice) * Math.pow(10, baseDecimals));

                const res = await fetch("/api/jupiter/quote", {
                    method: "POST",
                    body: JSON.stringify({
                        inputMint: baseMint,
                        outputMint: targetMint,
                        amount: rawAmount.toString()
                    })
                });
                const data = await res.json();

                if (!active) return;
                if (data.error || !data.routePlan?.length) {
                    setError(data.error || "No route");
                } else {
                    setQuote(data);
                }
            } catch (err: any) {
                if (active) setError(err.message);
            }
        };

        const timer = setTimeout(fetchQuote, 200); // Debounce
        return () => { active = false; clearTimeout(timer); };
    }, [baseMint, targetMint, seedUsd, wallet, preloadedQuote]);

    const canSeed = quote && !loading;

    async function handleSeedClick() {
        if (!canSeed) return;
        setLocalLoading(true);
        try {
            await onSeed({ quote, baseMint, targetMint, seedUsd });
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
                    {quote && (
                        <div className="text-zinc-500 font-mono text-[9px]">
                            Impact: <span className={parseFloat(quote.priceImpactPct) > 1 ? "text-amber-500" : "text-emerald-500"}>{quote.priceImpactPct}%</span>
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
                            {quote ? (parseFloat(quote.outAmount) / Math.pow(10, selectedGem?.decimals || 6)).toFixed(2) : "..."}
                        </span>
                    </div>
                </div>

                <button
                    disabled={!canSeed}
                    onClick={handleSeedClick}
                    className="group relative px-6 py-2 rounded bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95"
                >
                    <span className={loading ? "opacity-0" : "opacity-100"}>
                        {error ? "No Route" : "Seed"}
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        </div>
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-2 text-[8px] font-black text-red-500/80 uppercase tracking-widest text-center animate-pulse">
                    ⚠ Execution Error: {error}
                </div>
            )}
        </div>
    );
}
