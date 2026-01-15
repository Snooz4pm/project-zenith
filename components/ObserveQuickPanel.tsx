import { Search } from 'lucide-react';

export function ObserveQuickPanel() {
    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Search className="w-3 h-3 text-cyan-400" />
                Observing Market Physics
            </div>
            <div className="text-[10px] font-mono text-zinc-600 italic">
                Kernel: Scanning for momentum surges and liquidity anomalies...
            </div>
        </div>
    );
}
