import { Zap } from 'lucide-react';

export function HarvestQuickPanel() {
    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3 text-purple-400" />
                Harvesting Alpha Yield
            </div>
            <div className="text-[10px] font-mono text-zinc-600 italic">
                Kernel: Locking in realized gains and pruning risk...
            </div>
        </div>
    );
}
