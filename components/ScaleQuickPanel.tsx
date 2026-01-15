import { TrendingUp } from 'lucide-react';

export function ScaleQuickPanel() {
    return (
        <div className="mt-2 p-3 rounded bg-zinc-900 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-amber-400" />
                Scaling Position Volume
            </div>
            <div className="text-[10px] font-mono text-zinc-600 italic">
                Kernel: Calculating compound allocation based on momentum...
            </div>
        </div>
    );
}
