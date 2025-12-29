'use client';

import { useState } from 'react';
import { BookOpen, X, ChevronRight } from 'lucide-react';

interface CoreConcept {
  term: string;
  definition: string;
  importance: 'critical' | 'important' | 'good-to-know';
}

interface CoreConceptsPanelProps {
  concepts: CoreConcept[];
}

const importanceColors = {
  critical: 'border-red-500/30 bg-red-500/5 text-red-400',
  important: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  'good-to-know': 'border-blue-500/30 bg-blue-500/5 text-blue-400'
};

export default function CoreConceptsPanel({ concepts }: CoreConceptsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-24 right-6 flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/20 transition-all shadow-lg backdrop-blur-sm z-40"
      >
        <BookOpen size={16} />
        <span className="text-sm font-medium">Core Concepts</span>
        <ChevronRight size={14} />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-screen w-96 bg-[#0c0c10] border-l border-white/10 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0c0c10] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--accent-mint)]" />
            <h2 className="text-lg font-bold text-white">Core Concepts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
          >
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {/* Concepts List */}
        <div className="p-6 space-y-4">
          {concepts.map((concept, index) => (
            <div
              key={index}
              className={`border rounded-xl p-4 ${importanceColors[concept.importance]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white">{concept.term}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full border border-current opacity-60 capitalize">
                  {concept.importance === 'good-to-know' ? 'Good to Know' : concept.importance}
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {concept.definition}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0c0c10] border-t border-white/10 px-6 py-4">
          <p className="text-xs text-zinc-600 text-center">
            These concepts will be referenced throughout the course
          </p>
        </div>
      </div>
    </>
  );
}
