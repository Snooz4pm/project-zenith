'use client';

import { X, Settings, Sun, Moon, Grid, BarChart, Eye, Ruler } from 'lucide-react';

interface ChartSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'dark' | 'light';
    onThemeChange: (theme: 'dark' | 'light') => void;
    showGrid: boolean;
    onGridToggle: (show: boolean) => void;
    showVolume: boolean;
    onVolumeToggle: (show: boolean) => void;
    showCrosshair: boolean;
    onCrosshairToggle: (show: boolean) => void;
    candleWidth: number;
    onCandleWidthChange: (width: number) => void;
}

export default function ChartSettingsModal({
    isOpen,
    onClose,
    theme,
    onThemeChange,
    showGrid,
    onGridToggle,
    showVolume,
    onVolumeToggle,
    showCrosshair,
    onCrosshairToggle,
    candleWidth,
    onCandleWidthChange
}: ChartSettingsModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Settings size={18} className="text-blue-400" />
                            Chart Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Theme */}
                        <div>
                            <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                                Theme
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onThemeChange('dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition ${
                                        theme === 'dark'
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    <Moon size={18} />
                                    <span className="font-medium">Dark</span>
                                </button>
                                <button
                                    onClick={() => onThemeChange('light')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition ${
                                        theme === 'light'
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    <Sun size={18} />
                                    <span className="font-medium">Light</span>
                                </button>
                            </div>
                        </div>

                        {/* Display Options */}
                        <div>
                            <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                                Display Options
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition">
                                    <div className="flex items-center gap-2">
                                        <Grid size={16} className="text-white/60" />
                                        <span className="text-sm text-white">Show Grid</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={showGrid}
                                        onChange={(e) => onGridToggle(e.target.checked)}
                                        className="w-4 h-4 accent-blue-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition">
                                    <div className="flex items-center gap-2">
                                        <BarChart size={16} className="text-white/60" />
                                        <span className="text-sm text-white">Show Volume</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={showVolume}
                                        onChange={(e) => onVolumeToggle(e.target.checked)}
                                        className="w-4 h-4 accent-blue-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition">
                                    <div className="flex items-center gap-2">
                                        <Eye size={16} className="text-white/60" />
                                        <span className="text-sm text-white">Show Crosshair</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={showCrosshair}
                                        onChange={(e) => onCrosshairToggle(e.target.checked)}
                                        className="w-4 h-4 accent-blue-500"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Candle Width */}
                        <div>
                            <label className="text-xs text-white/60 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Ruler size={14} />
                                    Candle Width
                                </span>
                                <span className="text-white font-mono">{Math.round(candleWidth)}px</span>
                            </label>
                            <input
                                type="range"
                                min="3"
                                max="30"
                                step="1"
                                value={candleWidth}
                                onChange={(e) => onCandleWidthChange(parseFloat(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                <span>Narrow</span>
                                <span>Wide</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-t border-white/10">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
