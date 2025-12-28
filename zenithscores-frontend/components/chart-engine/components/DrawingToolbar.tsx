'use client';

import { useState } from 'react';
import {
    TrendingUp,
    Minus,
    Circle,
    Square,
    Triangle,
    Type,
    Ruler,
    Grid,
    ArrowRight,
    Trash2,
    ChevronDown,
    ChevronUp,
    Move,
    Crosshair
} from 'lucide-react';

export type DrawingTool =
    | 'trendline'
    | 'horizontal'
    | 'vertical'
    | 'ray'
    | 'channel'
    | 'fibonacci'
    | 'rectangle'
    | 'ellipse'
    | 'triangle'
    | 'text'
    | 'arrow'
    | 'measure'
    | null;

interface DrawingToolbarProps {
    activeTool: DrawingTool;
    onToolSelect: (tool: DrawingTool) => void;
    onClear: () => void;
}

const DRAWING_TOOLS: { id: DrawingTool; icon: React.ReactNode; label: string; group: string }[] = [
    // Lines
    { id: 'trendline', icon: <TrendingUp size={18} />, label: 'Trend Line', group: 'lines' },
    { id: 'horizontal', icon: <Minus size={18} />, label: 'Horizontal Line', group: 'lines' },
    { id: 'vertical', icon: <Minus size={18} className="rotate-90" />, label: 'Vertical Line', group: 'lines' },
    { id: 'ray', icon: <ArrowRight size={18} />, label: 'Ray', group: 'lines' },
    { id: 'channel', icon: <Grid size={18} />, label: 'Channel', group: 'lines' },

    // Fibonacci
    { id: 'fibonacci', icon: <Ruler size={18} />, label: 'Fibonacci Retracement', group: 'fib' },

    // Shapes
    { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle', group: 'shapes' },
    { id: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse', group: 'shapes' },
    { id: 'triangle', icon: <Triangle size={18} />, label: 'Triangle', group: 'shapes' },

    // Annotation
    { id: 'text', icon: <Type size={18} />, label: 'Text', group: 'annotation' },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow', group: 'annotation' },

    // Measure
    { id: 'measure', icon: <Ruler size={18} />, label: 'Measure', group: 'tools' },
];

export default function DrawingToolbar({ activeTool, onToolSelect, onClear }: DrawingToolbarProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedGroup, setExpandedGroup] = useState<string | null>('lines');

    const groups = Array.from(new Set(DRAWING_TOOLS.map(t => t.group)));

    return (
        <div className="bg-black/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Move size={16} className="text-white/60" />
                    <span className="text-xs font-medium text-white">Draw</span>
                </div>
                {isExpanded ? (
                    <ChevronUp size={14} className="text-white/60" />
                ) : (
                    <ChevronDown size={14} className="text-white/60" />
                )}
            </div>

            {isExpanded && (
                <div className="px-2 pb-2">
                    {/* Crosshair / Select Mode */}
                    <button
                        onClick={() => onToolSelect(null)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg mb-2 transition ${
                            activeTool === null
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <Crosshair size={16} />
                        <span className="text-xs">Select</span>
                    </button>

                    {/* Tool Groups */}
                    {groups.map(group => (
                        <div key={group} className="mb-1">
                            <button
                                onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                                className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase text-white/40 hover:text-white/60"
                            >
                                <span>{group}</span>
                                {expandedGroup === group ? (
                                    <ChevronUp size={12} />
                                ) : (
                                    <ChevronDown size={12} />
                                )}
                            </button>

                            {expandedGroup === group && (
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                    {DRAWING_TOOLS.filter(t => t.group === group).map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => onToolSelect(tool.id)}
                                            className={`flex items-center justify-center p-2 rounded-lg transition ${
                                                activeTool === tool.id
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                            }`}
                                            title={tool.label}
                                        >
                                            {tool.icon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Clear All */}
                    <button
                        onClick={onClear}
                        className="w-full flex items-center justify-center gap-2 p-2 mt-2 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                    >
                        <Trash2 size={14} />
                        <span className="text-xs">Clear All</span>
                    </button>
                </div>
            )}
        </div>
    );
}
