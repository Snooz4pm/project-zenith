'use client';

import { useState, useTransition } from 'react';
import { recordNewsBias, type NewsBias } from '@/lib/actions/news';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

interface NewsBiasSelectorProps {
  articleId: number;
  initialBias?: string | null;
  className?: string;
}

export default function NewsBiasSelector({
  articleId,
  initialBias,
  className = ''
}: NewsBiasSelectorProps) {
  const [selectedBias, setSelectedBias] = useState<string | null>(initialBias || null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (bias: NewsBias) => {
    startTransition(async () => {
      setSelectedBias(bias);
      const result = await recordNewsBias(articleId, bias);

      if (result.error) {
        console.error('Failed to save:', result.error);
        setSelectedBias(initialBias || null); // Revert on error
      }
    });
  };

  const options: Array<{
    value: NewsBias;
    label: string;
    icon: React.ReactNode;
    activeColor: string;
  }> = [
    {
      value: 'BULLISH',
      label: 'Bullish',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      activeColor: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
    },
    {
      value: 'BEARISH',
      label: 'Bearish',
      icon: <TrendingDown className="w-3.5 h-3.5" />,
      activeColor: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30',
    },
    {
      value: 'NEUTRAL',
      label: 'Neutral',
      icon: <Minus className="w-3.5 h-3.5" />,
      activeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      value: 'UNCLEAR',
      label: 'Unclear',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      activeColor: 'bg-[#2D3F5A] text-gray-400 border-[#2D3F5A]',
    },
  ];

  return (
    <div className={`border-t border-[#2D3F5A] pt-6 mt-6 ${className}`}>
      <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-3">
        Market Bias
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map(opt => {
          const isSelected = selectedBias === opt.value;
          const baseClasses = 'py-2.5 text-xs font-mono uppercase tracking-wider transition-all border rounded flex items-center justify-center gap-1.5';
          const activeClasses = isSelected ? opt.activeColor : 'bg-[#1A2332] text-gray-400 border-[#2D3F5A] hover:border-cyan-500/30';

          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              disabled={isPending}
              className={`${baseClasses} ${activeClasses} disabled:opacity-50`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {selectedBias && (
        <p className="text-[10px] font-mono text-gray-600 mt-2">
          Your bias recorded • Click to change
        </p>
      )}
    </div>
  );
}
