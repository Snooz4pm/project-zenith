import { useState, useMemo } from "react";
import { computePortfolioUsd, computeSeedUsd } from "@/lib/engine/portfolio";

export function SeedQuickPanel({
    wallet,
    executableTokens,
    onSeed
}: {
    wallet: any;
    executableTokens: any[];
    onSeed: (params: {
        baseMint: string;
        targetMint: string;
        seedUsd: number;
    }) => Promise<void>;
}) {
    const [baseMint, setBaseMint] = useState<string>();
    const [targetMint, setTargetMint] = useState<string>();
    const [loading, setLoading] = useState(false);

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

    const canSeed = baseMint && targetMint && !loading;

    async function handleSeed() {
        if (!canSeed) return;
        setLoading(true);
        try {
            await onSeed({ baseMint: baseMint!, targetMint: targetMint!, seedUsd });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Seed new position
                </div>
                <div className="text-emerald-400 font-mono">
                    {seedUsd > 0 ? `$${seedUsd.toFixed(2)}` : "$0.00"} (2%)
                </div>
            </div>

            <div className="flex gap-4 items-center">
                {/* Base Asset Selection */}
                <select
                    className="flex-1 bg-black/50 border border-zinc-800/50 rounded px-3 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer appearance-none"
                    onChange={e => setBaseMint(e.target.value)}
                    value={baseMint || ""}
                >
                    <option value="" disabled className="bg-zinc-900">SELECT BASE</option>
                    <option value="So11111111111111111111111111111111111111112" className="bg-zinc-900">SOL</option>
                    {wallet?.tokens?.map((t: any) => (
                        <option key={t.mint} value={t.mint} className="bg-zinc-900">
                            {t.symbol} ({t.amount.toFixed(2)})
                        </option>
                    ))}
                </select>

                {/* Target Asset Selection */}
                <select
                    className="flex-1 bg-black/50 border border-zinc-800/50 rounded px-3 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer appearance-none"
                    onChange={e => setTargetMint(e.target.value)}
                    value={targetMint || ""}
                >
                    <option value="" disabled className="bg-zinc-900">SELECT TARGET</option>
                    {executableTokens?.map(t => (
                        <option key={t.mint} value={t.mint} className="bg-zinc-900">
                            {t.symbol}
                        </option>
                    ))}
                </select>

                <button
                    disabled={!canSeed}
                    onClick={handleSeed}
                    className="px-6 py-2 rounded bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95"
                >
                    {loading ? "Seeding..." : "Seed"}
                </button>
            </div>
        </div>
    );
}
