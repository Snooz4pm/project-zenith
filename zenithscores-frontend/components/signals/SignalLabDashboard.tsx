'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Activity, AlertTriangle, Radio, Ban, Lock, RefreshCw, Server, AlertOctagon, Terminal } from 'lucide-react';
import SignalDrillDown from './SignalDrillDown';

// Mock Data Generators for "Live" Feel
const generateRejection = () => {
    const assets = ['ETH-USD', 'SOL-USD', 'AAPL', 'TSLA', 'EURUSD', 'GBPUSD', 'NVDA', 'AMD'];
    const reasons = ['Regime Mismatch (Choppy)', 'Low Liquidity Score', 'EV < 0', 'Vol Regime > 2.5s', 'Correlation Filter'];
    return {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        asset: assets[Math.floor(Math.random() * assets.length)],
        reason: reasons[Math.floor(Math.random() * reasons.length)]
    };
};

const INITIAL_SIGNALS = [
    { id: 'SIG-8821', time: '14:02:11', asset: 'BTC-USD', type: 'LONG', confidence: 88, ev: 2.1, status: 'PENDING' },
    { id: 'SIG-8822', time: '14:15:33', asset: 'XAU-USD', type: 'SHORT', confidence: 76, ev: 1.4, status: 'FILLED' },
];

export default function SignalLabDashboard() {
    const [systemState, setSystemState] = useState<'OPERATIONAL' | 'DEGRADED' | 'HALTED'>('OPERATIONAL');
    const [rejections, setRejections] = useState<any[]>([]);
    const [signals, setSignals] = useState(INITIAL_SIGNALS);
    const [riskMetrics, setRiskMetrics] = useState({ var95: 1.2, drawdown: 0.4, correlation: 0.35 });
    const [selectedSignal, setSelectedSignal] = useState<any>(null);

    // Simulate "The Black Box" Rejection Feed
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setRejections(prev => [generateRejection(), ...prev].slice(0, 20));
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#0B0E14] text-zinc-300 font-mono text-sm overflow-hidden border border-zinc-800 rounded-xl shadow-2xl">

            {/* PANEL 1: SYSTEM STATE HEADER */}
            <div className="bg-[#0f1219] border-b border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${systemState === 'OPERATIONAL' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                        <span className="text-lg font-bold tracking-widest text-zinc-100">ZENITH SIGNAL LAB <span className="text-xs text-zinc-500 ml-2">v1.2.4</span></span>
                    </div>
                    <div className="h-6 w-px bg-zinc-800" />
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Activity size={14} />
                        <span>VIX: 14.2 (COMPRESSED)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Server size={14} />
                        <span>LATENCY: 42ms</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        RISK ENGINE A: <span className="text-emerald-500">ENGAGED</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* PANEL 2: SIGNAL QUEUE (MAIN REA) */}
                <div className="flex-1 flex flex-col border-r border-zinc-800">
                    <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                        <span className="font-bold flex items-center gap-2"><Radio size={14} className="text-blue-400" /> ACTIVE SIGNAL QUEUE</span>
                        <span className="text-xs text-zinc-500">{signals.length} SIGNALS GENERATED TODAY</span>
                    </div>

                    <div className="flex-1 overflow-auto bg-[#0B0E14]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0f1219] text-xs uppercase text-zinc-500 font-medium">
                                <tr>
                                    <th className="p-3 border-b border-zinc-800">ID</th>
                                    <th className="p-3 border-b border-zinc-800">Time (UTC)</th>
                                    <th className="p-3 border-b border-zinc-800">Asset</th>
                                    <th className="p-3 border-b border-zinc-800">Type</th>
                                    <th className="p-3 border-b border-zinc-800">Confidence (SCS)</th>
                                    <th className="p-3 border-b border-zinc-800">Exp. Value</th>
                                    <th className="p-3 border-b border-zinc-800">Risk Gate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signals.map((sig) => (
                                    <tr
                                        key={sig.id}
                                        onClick={() => setSelectedSignal(sig)}
                                        className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-3 text-zinc-500 group-hover:text-blue-400 transition-colors">{sig.id}</td>
                                        <td className="p-3">{sig.time}</td>
                                        <td className="p-3 font-bold text-zinc-200">{sig.asset}</td>
                                        <td className={`p-3 font-bold ${sig.type === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>{sig.type}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${sig.confidence}%` }} />
                                                </div>
                                                <span className="text-blue-400">{sig.confidence}%</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-zinc-300">{sig.ev.toFixed(2)}R</td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] border border-emerald-500/20 rounded">PASSED</span>
                                        </td>
                                    </tr>
                                ))}
                                {signals.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-zinc-600">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <Terminal size={32} />
                                                <p>NO SIGNALS MEETING CRITERIA</p>
                                                <p className="text-xs">Silence is a signal. Capital is preserved.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="w-96 flex flex-col bg-[#0f1219]">

                    {/* PANEL 4: RISK CONSOLE */}
                    <div className="h-1/3 border-b border-zinc-800 flex flex-col">
                        <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 font-bold flex items-center gap-2">
                            <AlertOctagon size={14} className="text-amber-400" /> RISK CONSOLE
                        </div>
                        <div className="flex-1 p-4 grid grid-cols-1 gap-4 overflow-auto">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>PORTFOLIO VaR (95%)</span>
                                    <span>{riskMetrics.var95}% / 2.0%</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${riskMetrics.var95 > 1.5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(riskMetrics.var95 / 2) * 100}%` }} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>MAX DRAWDOWN</span>
                                    <span>{riskMetrics.drawdown}% / 5.0%</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(riskMetrics.drawdown / 5) * 100}%` }} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>AVG CORRELATION</span>
                                    <span>{riskMetrics.correlation.toFixed(2)}</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden block">
                                    <div className="h-full bg-purple-500" style={{ width: `${riskMetrics.correlation * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL 3: THE BLACK BOX */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 font-bold flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                                <Ban size={14} className="text-rose-500" /> REJECTION LOG
                            </div>
                            <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 rounded">FILTERING NOISE</span>
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-1 bg-[#080a0f]">
                            {rejections.map((rej) => (
                                <div key={rej.id} className="flex items-start gap-3 p-2 rounded hover:bg-zinc-800/30 transition-colors text-xs border-l-2 border-zinc-800 hover:border-rose-900">
                                    <span className="text-zinc-600 font-mono w-14 shrink-0">{rej.time}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-zinc-400">{rej.asset}</span>
                                            <span className="text-rose-500/[0.7] text-[10px] border border-rose-900/30 px-1 rounded">REJECTED</span>
                                        </div>
                                        <div className="text-zinc-600 truncate mt-0.5">{rej.reason}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div className="bg-[#0f1219] border-t border-zinc-800 p-2 px-4 flex justify-between items-center text-[10px] text-zinc-600">
                <span>SYSTEM ID: ZSL-PRIMARY-A1</span>
                <span>Wait for the setup. Stalk the trade. Kill the noise.</span>
            </div>

            {/* DRILL DOWN DRAWER */}
            {selectedSignal && (
                <SignalDrillDown
                    signal={selectedSignal}
                    onClose={() => setSelectedSignal(null)}
                />
            )}
        </div>
    );
}
