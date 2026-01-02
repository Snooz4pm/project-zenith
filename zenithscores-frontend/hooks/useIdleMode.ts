import { useState, useEffect, useCallback } from 'react';
import { IDLE_TIMEOUT } from '@/lib/animations/passiveMotion';

/**
 * Idle Mode Detection Hook
 *
 * Detects user inactivity and returns idle state.
 * When idle, dashboard enters "calm mode" with reduced pulse intensity.
 *
 * @param timeout - Time in ms before entering idle mode (default: 25s)
 * @returns isIdle - Boolean indicating if user is idle
 */
export function useIdleMode(timeout: number = IDLE_TIMEOUT) {
  const [isIdle, setIsIdle] = useState(false);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
  }, []);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, timeout);
    };

    // Listen for user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Set initial timer
    idleTimer = setTimeout(() => {
      setIsIdle(true);
    }, timeout);

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeout]);

  return { isIdle, resetIdleTimer };
}
