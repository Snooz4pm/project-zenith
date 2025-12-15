'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const SECTORS = [
    { name: 'Technology', score: 78, change: 2.4, trend: [65, 68, 72, 75, 74, 78] },
    { name: 'Finance', score: 62, change: 0.8, trend: [58, 60, 59, 61, 62, 62] },
    { name: 'Healthcare', score: 54, change: -1.2, trend: [58, 56, 55, 53, 54, 54] },
    { name: 'Energy', score: 85, change: 3.1, trend: [70, 75, 78, 80, 82, 85] },
    { name: 'Consumer', score: 45, change: -0.5, trend: [48, 47, 46, 45, 46, 45] },
    { name: 'Industrial', score: 58, change: 1.1, trend: [54, 55, 56, 57, 57, 58] },
    { name: 'Utilities', score: 41, change: -2.3, trend: [48, 45, 44, 42, 41, 41] },
    { name: 'Real Estate', score: 38, change: -4.1, trend: [45, 42, 40, 39, 38, 38] },
];

// Simple Sparkline Component (SVG)
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

interface SectorMatrixProps {
    onSelectSector?: (sector: string) => void;
}

export default function SectorMatrix({ onSelectSector }: SectorMatrixProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
            <h3 className="text-gray-800 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Sector Momentum Matrix
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {SECTORS.map((sector) => {
                    const color = sector.score >= 60 ? '#0A7B0A' : sector.score >= 40 ? '#768396' : '#D93B3B';

                    return (
                        <motion.button
                            key={sector.name}
                            whileHover={{ y: -2 }}
                            onClick={() => onSelectSector?.(sector.name)}
                            className="flex flex-col p-3 rounded-lg border border-gray-100 hover:border-blue-500/30 hover:shadow-md transition-all bg-gray-50 text-left group"
                        >
                            <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">{sector.name}</span>

                            <div className="flex items-end justify-between mb-2">
                                <span className="text-xl font-bold text-gray-900" style={{ color: color }}>{sector.score}</span>
                                <div className={`text-[10px] font-bold flex items-center ${sector.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {sector.change > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {Math.abs(sector.change)}%
                                </div>
                            </div>

                            <div className="mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
                                <Sparkline data={sector.trend} color={color} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
