/**
 * Passive Motion System
 *
 * Core principle: Nothing screams. Everything breathes.
 * Creates subtle, professional animations that make the dashboard feel alive
 * without being distracting.
 */

import { Variants } from 'framer-motion';

/**
 * Emerald Pulse System
 * Global breathing effect - 6-8s cycle with opacity changes
 */
export const emeraldPulse: Variants = {
  idle: {
    opacity: [0.92, 1, 0.92],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  calm: {
    opacity: [0.7, 0.8, 0.7],
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Micro-Glow for Active States
 * Soft emerald glow that pulses slowly
 */
export const microGlow: Variants = {
  active: {
    opacity: [0.6, 1, 0.6],
    filter: [
      'drop-shadow(0 0 1px rgb(16 185 129 / 0.4))',
      'drop-shadow(0 0 2px rgb(16 185 129 / 0.6))',
      'drop-shadow(0 0 1px rgb(16 185 129 / 0.4))',
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Chart Endpoint Pulse
 * Tiny emerald dot that pulses at chart endpoints
 */
export const endpointPulse: Variants = {
  active: {
    opacity: [0.6, 1, 0.6],
    scale: [0.9, 1.1, 0.9],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Card Hover Depth
 * Subtle lift effect without color change
 */
export const cardDepth: Variants = {
  rest: {
    filter: 'brightness(1)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
  },
  hover: {
    filter: 'brightness(1.02)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Ambient Activity Oscillator
 * For Community card - implies presence
 */
export const ambientActivity: Variants = {
  active: {
    height: ['40%', '70%', '40%'],
    opacity: [0.3, 0.5, 0.3],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  calm: {
    height: ['30%', '50%', '30%'],
    opacity: [0.2, 0.3, 0.2],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Ripple Feedback
 * Soundless visual acknowledgment for new data
 */
export const rippleFeedback: Variants = {
  initial: {
    scale: 0,
    opacity: 0.6,
  },
  animate: {
    scale: 2.5,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Progress Energy
 * For Decision Lab - gradient that intensifies toward the end
 */
export const progressEnergy = {
  gradient: 'linear-gradient(90deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.8) 100%)',
};

/**
 * Idle Mode Timing
 */
export const IDLE_TIMEOUT = 25000; // 25 seconds

/**
 * Animation Duration Constants
 */
export const DURATIONS = {
  emeraldPulse: 7000,
  microGlow: 3000,
  endpointPulse: 2500,
  cardHover: 300,
  ambientActivity: 4000,
  ripple: 600,
} as const;
