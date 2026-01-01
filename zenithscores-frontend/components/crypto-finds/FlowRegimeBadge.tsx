'use client';

import { FlowRegime } from '@/lib/flow/flow-types';
import { getRegimeColor, getRegimeEmoji, getRegimeBgColor } from '@/lib/flow/flow-regime';

interface FlowRegimeBadgeProps {
    regime: FlowRegime;
    compact?: boolean;
}

export default function FlowRegimeBadge({ regime, compact = false }: FlowRegimeBadgeProps) {
    const emoji = getRegimeEmoji(regime);
    const color = getRegimeColor(regime);
    const bgColor = getRegimeBgColor(regime);

    if (compact) {
        return (
            <div className={`px-2 py-1 rounded-full flex items-center gap-1.5 ${bgColor}`}>
                <span className="text-xs">{emoji}</span>
                <span className={`text-[10px] font-bold uppercase ${color}`}>
                    {regime}
                </span>
            </div>
        );
    }

    return (
        <div className={`
            px-3 py-1.5 rounded-lg flex items-center gap-2
            ${bgColor}
            ${regime === FlowRegime.FRENZY ? 'animate-pulse' : ''}
        `}>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Flow
            </span>
            <span className="text-sm">{emoji}</span>
            <span className={`text-xs font-bold uppercase tracking-wide ${color}`}>
                {regime}
            </span>
        </div>
    );
}
