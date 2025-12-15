'use client';

import { motion } from 'framer-motion';

export default function CryptoTicker() {
    const stats = [
        { label: "Total Market Cap", value: "$2.4T", change: "+1.2%" },
        { label: "BTC Dominance", value: "52%", change: "-0.1%" },
        { label: "ETH Gas", value: "12 Gwei", change: "" },
        { label: "Fear & Greed", value: "72 (Greed)", change: "" }
    ];

    return (
        <div className="w-full bg-black/40 border-b border-gray-800 overflow-hidden py-2 backdrop-blur-sm">
            <div className="flex animate-marquee gap-8 w-max px-4">
                {[...stats, ...stats, ...stats].map((stat, i) => ( // Repeat for infinite loop
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 font-bold uppercase tracking-wider">{stat.label}:</span>
                        <span className="text-white font-mono">{stat.value}</span>
                        {stat.change && (
                            <span className={stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                                {stat.change}
                            </span>
                        )}
                        <span className="mx-2 text-gray-800">|</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
