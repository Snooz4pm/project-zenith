'use client';

import { useState } from 'react';
import { MoreVertical, Download, Share2, Settings, Layers } from 'lucide-react';
import { LayoutPreset } from './LayoutSelector';

interface QuickActionsMenuProps {
    onExport: () => void;
    onCompare: () => void;
    onSettings: () => void;
    onLayoutChange: (layout: LayoutPreset) => void;
    layouts: LayoutPreset[];
    currentLayout: LayoutPreset;
}

export default function QuickActionsMenu({
    onExport,
    onCompare,
    onSettings,
    onLayoutChange,
    layouts,
    currentLayout
}: QuickActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                title="More Actions"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 z-50 bg-black/95 backdrop-blur border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[200px]">
                        {/* Quick Actions */}
                        <div className="p-2">
                            <button
                                onClick={() => {
                                    onExport();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition"
                            >
                                <Download size={16} />
                                Export Chart
                            </button>
                            <button
                                onClick={() => {
                                    onCompare();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition"
                            >
                                <Share2 size={16} />
                                Compare Symbols
                            </button>
                            <button
                                onClick={() => {
                                    onSettings();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition"
                            >
                                <Settings size={16} />
                                Chart Settings
                            </button>
                        </div>

                        {/* Layouts */}
                        <div className="border-t border-white/10 p-2">
                            <div className="px-3 py-1.5 text-xs text-white/40 uppercase tracking-wider flex items-center gap-2">
                                <Layers size={12} />
                                Layouts
                            </div>
                            {layouts.map((layout) => (
                                <button
                                    key={layout.id}
                                    onClick={() => {
                                        onLayoutChange(layout);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex flex-col gap-0.5 px-3 py-2 text-left rounded-lg transition ${
                                        currentLayout.id === layout.id
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span className="text-sm font-medium">{layout.name}</span>
                                    <span className="text-[10px] text-white/40">{layout.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
