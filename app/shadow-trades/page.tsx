'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Terminal, ArrowRight, Activity, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ShadowTrade {
    type: 'BUY' | 'SELL';
    pair: string;
    amountUsd: number;
    time: number;
    signature: string;
    symbol: string;
    badges?: string[];
}

const MAX_ROWS = 50;

const BADGE_STYLES: Record<string, string> = {
    'High Impact': 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
    'Accumulation': 'border-purple-500/50 text-purple-400 bg-purple-500/10'
};

function TradeBadges({ badges }: { badges?: string[] }) {
    if (!badges?.length) return null;

    return (
        <div className="flex gap-2">
            {badges.map(badge => (
                <span
                    key={badge}
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${BADGE_STYLES[badge] || 'border-zinc-500 text-zinc-500'
                        }`}
                >
                    {badge}
                </span>
            ))}
        </div>
    );
}

export default function ShadowTradesPage() {
    const [trades, setTrades] = useState<ShadowTrade[]>([]);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const proxyUrl = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

        // Init Socket
        const socket = io(proxyUrl, {
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('Connected to Shadow Stream');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Shadow Stream');
            setConnected(false);
        });

        socket.on('shadow-trade', (newTrades: ShadowTrade[]) => {
            setTrades(prev => {
                const combined = [...newTrades, ...prev];
                return combined.slice(0, MAX_ROWS);
            });
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-mono p-4 md:p-8 pt-24 selection:bg-emerald-500/30">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Terminal className="w-5 h-5 text-emerald-500" />
                            Shadow Trades
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="flex items-center gap-1.5">
                                <span className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                {connected ? "LIVE FEED ACTIVE" : "CONNECTING..."}
                            </span>
                            <span className="text-zinc-700">|</span>
                            <span>MIN VALUE: $1,000</span>
                        </div>
                    </div>
                    {/* Status Icon */}
                    <div className="text-zinc-700">
                        <Wifi className={cn("w-5 h-5", connected ? "text-emerald-900" : "text-zinc-800")} />
                    </div>
                </div>

                {/* Feed */}
                <div className="min-h-[600px] relative">
                    {/* Empty State */}
                    {trades.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                            <Activity className="w-8 h-8 opacity-20" />
                            <div className="text-sm text-center">
                                <p>Monitoring Solana mainnet for significant swaps...</p>
                                <p className="text-xs opacity-50 mt-1">Listening for value {'>'} $1,000</p>
                            </div>
                        </div>
                    )}

                    {/* Rows */}
                    <div className="space-y-1 relative z-10">
                        {trades.map((trade) => (
                            <div
                                key={trade.signature}
                                className="group grid grid-cols-[80px_1fr_1fr_120px] gap-4 items-center py-2 px-3 border-l-2 border-transparent hover:border-emerald-500/50 hover:bg-white/[0.02] transition-colors rounded-r animate-in fade-in slide-in-from-top-2 duration-300"
                            >
                                {/* Type */}
                                <div className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded w-fit",
                                    trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-400"
                                )}>
                                    {trade.type}
                                </div>

                                {/* Pair + Badges */}
                                <div className="text-sm text-zinc-400 flex items-center gap-3">
                                    <span>{trade.pair}</span>
                                    <TradeBadges badges={trade.badges} />
                                </div>

                                {/* Value */}
                                <div className="text-sm text-zinc-200 font-medium">
                                    ${trade.amountUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>

                                {/* Time */}
                                <div className="text-xs text-zinc-600 text-right font-mono">
                                    {new Date(trade.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
