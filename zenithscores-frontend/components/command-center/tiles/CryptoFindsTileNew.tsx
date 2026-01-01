'use client';

import { useState, useEffect } from 'react';

interface CryptoFind {
    symbol: string;
    reason: string;
}

export default function CryptoFindsTileNew() {
    const [finds, setFinds] = useState<CryptoFind[]>([]);

    useEffect(() => {
        // Fetch real emerging tokens from Flow + Signals
        // For now: sample data with real signal reasons
        const sampleFinds: CryptoFind[] = [
            { symbol: 'ARB', reason: 'Volume spike detected' },
            { symbol: 'OP', reason: 'Flow shift - accumulation' },
            { symbol: 'MATIC', reason: 'Regime change - trending' },
            { symbol: 'LINK', reason: 'Liquidity injection' },
        ];
        setFinds(sampleFinds);
    }, []);

    return (
        <div className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col hover:border-emerald-500/20 transition-colors">
            <div className="mb-4">
                <h3 className="text-sm font-medium text-white mb-1">Crypto Finds</h3>
                <p className="text-xs text-zinc-500">Emerging opportunities</p>
            </div>

            {/* NO PROGRESS BARS - Just list with reasons */}
            <div className="flex-1 overflow-auto space-y-3">
                {finds.length === 0 ? (
                    <p className="text-xs text-zinc-600">No opportunities detected</p>
                ) : (
                    finds.map((find) => (
                        <div key={find.symbol} className="border-l-2 border-emerald-500/30 pl-3">
                            <div className="text-sm font-medium text-white">{find.symbol}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{find.reason}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
