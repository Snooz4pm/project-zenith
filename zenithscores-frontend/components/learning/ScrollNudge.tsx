'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ScrollNudgeProps {
  /** Threshold in pixels per scroll event to trigger nudge */
  fastScrollThreshold?: number;
  /** Number of fast scrolls before showing nudge */
  triggerCount?: number;
}

export default function ScrollNudge({
  fastScrollThreshold = 100,
  triggerCount = 3
}: ScrollNudgeProps) {
  const [showNudge, setShowNudge] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const fastScrollCount = useRef(0);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (dismissed) return;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Detect fast scroll
      if (scrollDelta > fastScrollThreshold) {
        fastScrollCount.current += 1;

        if (fastScrollCount.current >= triggerCount && !showNudge) {
          setShowNudge(true);
        }
      }

      lastScrollY.current = currentScrollY;

      // Reset counter after 3 seconds of no fast scrolling
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        fastScrollCount.current = 0;
      }, 3000);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [dismissed, fastScrollThreshold, triggerCount, showNudge]);

  function handleDismiss() {
    setShowNudge(false);
    setDismissed(true);
    fastScrollCount.current = 0;
  }

  function handleTemporaryHide() {
    setShowNudge(false);
    fastScrollCount.current = 0;
  }

  if (!showNudge) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#0c0c10] border border-amber-500/30 rounded-xl px-4 py-3 shadow-xl max-w-md">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-zinc-300">
              You may want to jot this down before continuing.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/5 rounded transition-colors flex-shrink-0"
          >
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={handleTemporaryHide}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Hide for now
          </button>
          <span className="text-xs text-zinc-700">·</span>
          <button
            onClick={handleDismiss}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
