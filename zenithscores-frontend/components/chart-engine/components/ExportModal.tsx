'use client';

import { useState } from 'react';
import { X, Download, Image, FileJson, FileSpreadsheet, Copy, Check } from 'lucide-react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: ExportFormat, options: ExportOptions) => void;
    chartRef?: React.RefObject<HTMLCanvasElement>;
}

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'json' | 'csv';

interface ExportOptions {
    includeDrawings: boolean;
    includeIndicators: boolean;
    resolution: '1x' | '2x' | '4x';
    transparent: boolean;
}

export default function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
    const [format, setFormat] = useState<ExportFormat>('png');
    const [options, setOptions] = useState<ExportOptions>({
        includeDrawings: true,
        includeIndicators: true,
        resolution: '2x',
        transparent: false,
    });
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleExport = () => {
        onExport(format, options);
        onClose();
    };

    const handleCopyToClipboard = async () => {
        onExport('png', { ...options, resolution: '1x' });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const FORMAT_OPTIONS: { id: ExportFormat; icon: React.ReactNode; label: string; desc: string }[] = [
        { id: 'png', icon: <Image size={18} />, label: 'PNG', desc: 'High quality image' },
        { id: 'jpg', icon: <Image size={18} />, label: 'JPG', desc: 'Compressed image' },
        { id: 'json', icon: <FileJson size={18} />, label: 'JSON', desc: 'Chart data' },
        { id: 'csv', icon: <FileSpreadsheet size={18} />, label: 'CSV', desc: 'Spreadsheet' },
    ];

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Download size={18} className="text-blue-400" />
                            Export Chart
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
                        {/* Format Selection */}
                        <div>
                            <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                                Format
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {FORMAT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFormat(opt.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                                            format === opt.id
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                        }`}
                                    >
                                        {opt.icon}
                                        <div className="text-left">
                                            <div className="font-medium text-sm">{opt.label}</div>
                                            <div className="text-[10px] text-white/40">{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Options */}
                        {(format === 'png' || format === 'jpg') && (
                            <>
                                {/* Resolution */}
                                <div>
                                    <label className="text-xs text-white/60 uppercase tracking-wider mb-2 block">
                                        Resolution
                                    </label>
                                    <div className="flex gap-2">
                                        {(['1x', '2x', '4x'] as const).map((res) => (
                                            <button
                                                key={res}
                                                onClick={() => setOptions({ ...options, resolution: res })}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                                                    options.resolution === res
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                }`}
                                            >
                                                {res}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-2">
                                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
                                        <span className="text-sm text-white">Include Drawings</span>
                                        <input
                                            type="checkbox"
                                            checked={options.includeDrawings}
                                            onChange={(e) => setOptions({ ...options, includeDrawings: e.target.checked })}
                                            className="w-4 h-4 accent-blue-500"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
                                        <span className="text-sm text-white">Include Indicators</span>
                                        <input
                                            type="checkbox"
                                            checked={options.includeIndicators}
                                            onChange={(e) => setOptions({ ...options, includeIndicators: e.target.checked })}
                                            className="w-4 h-4 accent-blue-500"
                                        />
                                    </label>
                                    {format === 'png' && (
                                        <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
                                            <span className="text-sm text-white">Transparent Background</span>
                                            <input
                                                type="checkbox"
                                                checked={options.transparent}
                                                onChange={(e) => setOptions({ ...options, transparent: e.target.checked })}
                                                className="w-4 h-4 accent-blue-500"
                                            />
                                        </label>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-t border-white/10 flex gap-2">
                        <button
                            onClick={handleCopyToClipboard}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 text-white/80 hover:bg-white/10 rounded-lg transition"
                        >
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
