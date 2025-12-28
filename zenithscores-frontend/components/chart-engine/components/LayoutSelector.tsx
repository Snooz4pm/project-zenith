'use client';

import { useState } from 'react';
import {
    LayoutGrid,
    Sparkles,
    TrendingUp,
    Minimize2,
    BarChart3,
    Layers,
    ChevronDown
} from 'lucide-react';

export interface LayoutPreset {
    id: string;
    name: string;
    description: string;
}

interface LayoutSelectorProps {
    layouts: LayoutPreset[];
    selected: LayoutPreset;
    onChange: (layout: LayoutPreset) => void;
    compact?: boolean;
}

const LAYOUT_ICONS: Record<string, React.ReactNode> = {
    'basic': <Sparkles size={16} />,
    'technical': <TrendingUp size={16} />,
    'minimal': <Minimize2 size={16} />,
    'multi-chart': <Layers size={16} />,
    'volume-profile': <BarChart3 size={16} />,
};

export default function LayoutSelector({ layouts, selected, onChange, compact = true }: LayoutSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur border border-white/10 rounded-lg hover:bg-white/5 transition"
                    title={selected.description}
                >
                    <LayoutGrid size={14} className="text-white/60" />
                    <span className="text-xs font-medium text-white">{selected.name}</span>
                    <ChevronDown size={14} className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute top-full mt-1 left-0 z-50 bg-black/95 backdrop-blur border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[220px]">
                            {layouts.map((layout) => (
                                <button
                                    key={layout.id}
                                    onClick={() => {
                                        onChange(layout);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition ${
                                        selected.id === layout.id
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span className="mt-0.5 text-white/60">{LAYOUT_ICONS[layout.id] || <LayoutGrid size={16} />}</span>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{layout.name}</div>
                                        <div className="text-xs text-white/40 mt-0.5">{layout.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-1">
            {layouts.map((layout) => (
                <button
                    key={layout.id}
                    onClick={() => onChange(layout)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition ${
                        selected.id === layout.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                    title={layout.description}
                >
                    {LAYOUT_ICONS[layout.id] || <LayoutGrid size={14} />}
                    <span>{layout.name}</span>
                </button>
            ))}
        </div>
    );
}
