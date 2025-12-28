'use client';

import { useState, useEffect } from 'react';
import { BookMarked, X, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScratchNote {
  id: string;
  content: string;
  timestamp: number;
}

interface CourseScratchPadProps {
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  moduleTitle?: string;
  onSaveToNotebook: (content: string, metadata: any) => Promise<void>;
}

export default function CourseScratchPad({
  courseId,
  courseTitle,
  moduleId,
  moduleTitle,
  onSaveToNotebook
}: CourseScratchPadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Detect if user has written something substantial
  useEffect(() => {
    if (currentNote.trim().length > 20 && !showSavePrompt) {
      // User has written enough - show save prompt
      const timer = setTimeout(() => {
        if (currentNote.trim().length > 20) {
          setShowSavePrompt(true);
        }
      }, 2000); // Wait 2s after they stop typing

      return () => clearTimeout(timer);
    }
  }, [currentNote]);

  async function handleSave() {
    if (!currentNote.trim()) return;

    setIsSaving(true);
    try {
      await onSaveToNotebook(currentNote, {
        source: 'course',
        courseId,
        courseTitle,
        moduleId,
        moduleTitle
      });

      // Clear the note after successful save
      setCurrentNote('');
      setShowSavePrompt(false);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    if (confirm('Discard this note? This cannot be undone.')) {
      setCurrentNote('');
      setShowSavePrompt(false);
    }
  }

  function handleKeepDraft() {
    setShowSavePrompt(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-96 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Scratch Notes
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Textarea */}
            <div className="p-4">
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Capture your thoughts while reading...&#10;&#10;These notes are temporary until you save them to your Notebook."
                className="w-full h-48 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none font-mono"
              />
              <div className="text-right text-[10px] text-zinc-600 mt-1">
                {currentNote.length} characters
              </div>
            </div>

            {/* Save Prompt */}
            <AnimatePresence>
              {showSavePrompt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/5 bg-emerald-500/5"
                >
                  <div className="p-4">
                    <p className="text-xs text-zinc-400 mb-3">
                      Save this to your Notebook?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleKeepDraft}
                        className="px-3 py-2 bg-white/5 text-zinc-400 text-xs rounded-lg hover:bg-white/10 transition-colors"
                      >
                        Keep Draft
                      </button>
                      <button
                        onClick={handleDiscard}
                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Discard"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Context Info */}
            <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01]">
              <div className="text-[10px] text-zinc-600 font-mono">
                {courseTitle} {moduleTitle && `› ${moduleTitle}`}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl hover:border-emerald-500/50 transition-all group"
          >
            <BookMarked className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">
              {currentNote.trim() ? 'Draft Note' : 'Take Notes'}
            </span>
            {currentNote.trim() && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
