'use client';

import { useState, useEffect } from 'react';
import { PenLine, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollNudgeProps {
  onTriggerNotes: () => void;
  threshold?: number; // pixels scrolled before showing
  cooldown?: number; // ms between nudges
}

export default function ScrollNudge({
  onTriggerNotes,
  threshold = 1500,
  cooldown = 30000 // 30 seconds
}: ScrollNudgeProps) {
  const [showNudge, setShowNudge] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lastNudgeTime, setLastNudgeTime] = useState(0);

  useEffect(() => {
    let scrollSpeed = 0;
    let lastScrollTop = 0;
    let scrollTimeout: NodeJS.Timeout;

    function handleScroll() {
      const scrollTop = window.scrollY;
      const scrollDelta = Math.abs(scrollTop - lastScrollTop);

      // Detect fast scrolling
      scrollSpeed = scrollDelta;
      lastScrollTop = scrollTop;

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // If user scrolls fast AND has scrolled far enough
      if (
        scrollSpeed > 100 && // Fast scroll
        scrollTop > threshold &&
        !dismissed &&
        Date.now() - lastNudgeTime > cooldown
      ) {
        setShowNudge(true);
        setLastNudgeTime(Date.now());

        // Auto-hide after 8 seconds
        scrollTimeout = setTimeout(() => {
          setShowNudge(false);
        }, 8000);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [dismissed, lastNudgeTime, threshold, cooldown]);

  function handleDismiss() {
    setShowNudge(false);
    setDismissed(true);

    // Re-enable after cooldown period
    setTimeout(() => {
      setDismissed(false);
    }, cooldown);
  }

  function handleTakeNotes() {
    setShowNudge(false);
    onTriggerNotes();
  }

  return (
    <AnimatePresence>
      {showNudge && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-3 bg-[#0a0a0c] border border-amber-500/30 rounded-xl shadow-2xl max-w-md"
        >
          <PenLine className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-zinc-300 flex-1">
            You may want to jot this down before continuing.
          </p>
          <button
            onClick={handleTakeNotes}
            className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
          >
            Take Notes
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
