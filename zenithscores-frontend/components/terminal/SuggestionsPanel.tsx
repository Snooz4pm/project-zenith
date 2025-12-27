/**
 * Zenith Suggestions Panel
 * The Control Surface for AI/Algo Suggestions.
 * User MUST Accept/Ignore. No auto-apply.
 */

'use client';

import { Drawing } from '../chart-engine/engine/types';
import { Target, X, Check } from 'lucide-react';

interface SuggestionsPanelProps {
    suggestions: Drawing[];
    onAccept: (id: string) => void;
    onIgnore: (id: string) => void;
}

export default function SuggestionsPanel({
    suggestions,
    onAccept,
    onIgnore
}: SuggestionsPanelProps) {
    if (suggestions.length === 0) return null;

    return (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 w-64 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                <Target size={12} className="text-cyan-400" />
                <span>Detected Patterns ({suggestions.length})</span>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {suggestions.map(s => (
                    <div
                        key={s.id}
                        className="group flex flex-col gap-2 p-2 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-200">
                                {s.label || 'Unknown Pattern'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                                {s.meta?.compressionRatio
                                    ? `Comp: ${(Number(s.meta.compressionRatio) * 100).toFixed(1)}%`
                                    : ''}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onAccept(s.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-medium transition-colors"
                            >
                                <Check size={10} />
                                Accept
                            </button>
                            <button
                                onClick={() => onIgnore(s.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white text-[10px] font-medium transition-colors"
                            >
                                <X size={10} />
                                Ignore
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
