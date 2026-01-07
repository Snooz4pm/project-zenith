'use client';

import { motion } from 'framer-motion';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="inline-flex bg-zinc-900/50 rounded-md p-0.5 gap-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="relative px-3 py-1 text-xs font-medium transition-colors"
        >
          {value === option.value && (
            <motion.div
              layoutId="activeSegment"
              className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/30 rounded"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span
            className={`relative z-10 ${
              value === option.value ? 'text-emerald-500' : 'text-zinc-500'
            }`}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
