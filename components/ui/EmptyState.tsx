import { AlertCircle } from 'lucide-react';

export function EmptyState({ text, subtext }: { text: string; subtext?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/5 bg-white/5">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{text}</h3>
            {subtext && <p className="text-sm text-zinc-500">{subtext}</p>}
        </div>
    );
}
