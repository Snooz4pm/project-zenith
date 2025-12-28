'use client';

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoreConcept {
  term: string;
  definition: string;
  importance: 'critical' | 'important' | 'good-to-know';
}

interface CoreConceptsPanelProps {
  concepts: CoreConcept[];
  moduleTitle?: string;
}

export default function CoreConceptsPanel({ concepts, moduleTitle }: CoreConceptsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!concepts || concepts.length === 0) return null;

  const importanceColors = {
    critical: 'border-red-500/30 bg-red-500/5',
    important: 'border-amber-500/30 bg-amber-500/5',
    'good-to-know': 'border-blue-500/30 bg-blue-500/5'
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl hover:border-amber-500/50 transition-all group"
      >
        <Lightbulb className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold text-white">Core Concepts</span>
        <span className="text-[10px] text-zinc-600 font-mono">
          ({concepts.length})
        </span>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Panel Content */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0c] border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0c]/95 backdrop-blur-xl z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                      Core Concepts
                    </h2>
                  </div>
                  {moduleTitle && (
                    <p className="text-[10px] text-zinc-600 font-mono">
                      {moduleTitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              {/* Concepts List */}
              <div className="p-6 space-y-4">
                {concepts.map((concept, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${importanceColors[concept.importance]}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-bold text-white">
                        {concept.term}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-500 uppercase">
                        {concept.importance.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {concept.definition}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer Tip */}
              <div className="sticky bottom-0 px-6 py-3 border-t border-white/5 bg-[#0a0a0c]/95 backdrop-blur-xl">
                <p className="text-[10px] text-zinc-600 text-center">
                  These concepts are key to understanding this module
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
