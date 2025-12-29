'use client';

import { useState, useEffect } from 'react';
import { Save, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { saveCourseNote } from '@/lib/actions/notebook';

interface CourseScratchPadProps {
  userId: string;
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  moduleTitle?: string;
}

type SavePromptState = 'hidden' | 'visible' | 'saving' | 'saved';

export default function CourseScratchPad({
  userId,
  courseId,
  courseTitle,
  moduleId,
  moduleTitle
}: CourseScratchPadProps) {
  const [content, setContent] = useState('');
  const [savePromptState, setSavePromptState] = useState<SavePromptState>('hidden');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState('');

  // Show save prompt after user types 20+ characters
  useEffect(() => {
    if (content.trim().length >= 20 && content !== lastSavedContent) {
      setSavePromptState('visible');
    } else if (content.trim().length < 20) {
      setSavePromptState('hidden');
    }
  }, [content, lastSavedContent]);

  async function handleSave() {
    setSavePromptState('saving');

    const result = await saveCourseNote(userId, content.trim(), {
      source: 'course',
      courseId,
      courseTitle,
      moduleId,
      moduleTitle
    });

    if (result.success) {
      setSavePromptState('saved');
      setLastSavedContent(content);

      setTimeout(() => {
        setContent('');
        setSavePromptState('hidden');
        setLastSavedContent('');
      }, 1500);
    } else {
      setSavePromptState('visible');
      alert('Failed to save note. Please try again.');
    }
  }

  function handleDiscard() {
    setContent('');
    setSavePromptState('hidden');
    setLastSavedContent('');
  }

  function handleKeepDraft() {
    setSavePromptState('hidden');
  }

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/20 transition-all shadow-lg backdrop-blur-sm"
        >
          <FileText size={16} />
          <span className="text-sm">Scratch Notes</span>
          <ChevronUp size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-[#0c0c10] border border-white/10 rounded-xl shadow-2xl z-30">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-zinc-500" />
          <h3 className="text-sm font-medium text-white">Scratch Notes</h3>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-white/5 rounded transition-colors"
        >
          <ChevronDown size={16} className="text-zinc-500" />
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Jot down quick notes while reading... (temporary until you save)"
          className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[var(--accent-mint)]/50 focus:outline-none resize-none"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-600">
            {content.trim().length} characters
          </span>
          {content.trim().length >= 20 && (
            <span className="text-xs text-zinc-500">Not saved yet</span>
          )}
        </div>
      </div>

      {savePromptState !== 'hidden' && (
        <div className="px-4 pb-4">
          <div className="bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 rounded-lg p-3">
            {savePromptState === 'saving' && (
              <div className="text-sm text-zinc-400 text-center">Saving to Notebook...</div>
            )}

            {savePromptState === 'saved' && (
              <div className="text-sm text-[var(--accent-mint)] text-center font-medium">
                ✓ Saved to Notebook
              </div>
            )}

            {savePromptState === 'visible' && (
              <>
                <p className="text-sm text-zinc-300 mb-3">Save this to your Notebook?</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-[var(--accent-mint)] text-[var(--void)] text-xs font-medium rounded hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/20 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleKeepDraft}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 text-zinc-400 text-xs rounded hover:bg-white/10 transition-colors"
                  >
                    Keep Draft
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
