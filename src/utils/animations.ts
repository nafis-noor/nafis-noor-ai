/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Variants, Transition } from 'framer-motion';

/**
 * ANIMATION CONSTITUTION RULES:
 * - Default duration: 400ms (0.4s)
 * - Default easing: cubic-bezier(0.32, 0.72, 0, 1)
 * - Spring animations: damping: 20, stiffness: 300
 * - Maximum 2 simultaneous animations per screen
 * - Full prefers-reduced-motion compliance
 */

export const DEFAULT_DURATION = 0.4; // 400ms
export const DEFAULT_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export const SPRING_TRANSITION: Transition = {
  type: 'spring',
  damping: 20,
  stiffness: 300,
};

export const CALM_EASE_TRANSITION: Transition = {
  duration: DEFAULT_DURATION,
  ease: DEFAULT_EASE,
};

/**
 * Check whether the user's OS has requested reduced motion.
 */
export const isReducedMotionActive = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * 2. PAGE TRANSITIONS
 * Pages enter sliding up from bottom with scale 0.95 to 1.0.
 * Exit slides down with scale-down.
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DEFAULT_DURATION,
      ease: DEFAULT_EASE,
    },
    transitionEnd: {
      transform: 'none',
    },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.97,
    transition: {
      duration: 0.28,
      ease: DEFAULT_EASE,
    },
  },
};

/**
 * Parallax Background Variant
 * Gives subtle opposing offset between background stars/aurora and foreground content
 */
export const parallaxBackgroundVariants: Variants = {
  initial: { y: 0, opacity: 0.8 },
  animate: {
    y: -8,
    opacity: 1,
    transition: { duration: 0.6, ease: DEFAULT_EASE },
  },
  exit: {
    y: 8,
    opacity: 0.6,
    transition: { duration: 0.3, ease: DEFAULT_EASE },
  },
};

/**
 * 3. PRAYER CHECK & MODAL BLOOM
 * Blooms from center (scale 0.8 to 1.0, spring physics).
 * Background blurs from center outward.
 */
export const modalBackdropVariants: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(16px)',
    transition: {
      duration: DEFAULT_DURATION,
      ease: DEFAULT_EASE,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.25,
      ease: DEFAULT_EASE,
    },
  },
};

export const modalBloomVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_TRANSITION,
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 12,
    transition: {
      duration: 0.25,
      ease: DEFAULT_EASE,
    },
  },
};

/**
 * Button Stagger Container (100ms delay between items)
 */
export const staggerButtonContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1, // 100ms
      delayChildren: 0.05,
    },
  },
};

export const staggerButtonItem: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_TRANSITION,
  },
};

/**
 * 7. DAILY INSPIRATION PULSE
 * Card rises from bottom with spring.
 * Dismiss slides with -5deg rotation.
 */
export const inspirationCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 60,
    scale: 0.92,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.9,
    rotate: -5,
    transition: {
      duration: 0.35,
      ease: DEFAULT_EASE,
    },
  },
};

/**
 * Text reveal line-by-line with 150ms stagger
 */
export const lineRevealContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15, // 150ms stagger
      delayChildren: 0.1,
    },
  },
};

export const lineRevealItem: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: DEFAULT_EASE,
    },
  },
};

/**
 * Micro-interactions:
 * Buttons scale to 0.97 on press (100ms).
 */
export const buttonPressAnimation = {
  whileTap: {
    scale: 0.97,
    transition: { duration: 0.1, ease: DEFAULT_EASE },
  },
  whileHover: {
    scale: 1.015,
    transition: { duration: 0.2, ease: DEFAULT_EASE },
  },
};

/**
 * Cards lift on hover with shadow expansion
 */
export const cardHoverAnimation = {
  whileHover: {
    y: -4,
    transition: { duration: DEFAULT_DURATION, ease: DEFAULT_EASE },
  },
};

/**
 * Gentle Breathing Pulse (for Read More buttons, active elements)
 */
export const gentlePulseVariant: Variants = {
  animate: {
    scale: [1, 1.025, 1],
    boxShadow: [
      '0 0 15px rgba(201, 160, 99, 0.2)',
      '0 0 30px rgba(223, 186, 127, 0.45)',
      '0 0 15px rgba(201, 160, 99, 0.2)',
    ],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * 8. BREATHING CRESCENT MOON
 * Scale 0.9 to 1.1, 2s loop in gold
 */
export const breathingCrescentVariant: Variants = {
  animate: {
    scale: [0.9, 1.1, 0.9],
    filter: [
      'drop-shadow(0 0 6px rgba(201, 160, 99, 0.35))',
      'drop-shadow(0 0 18px rgba(223, 186, 127, 0.75))',
      'drop-shadow(0 0 6px rgba(201, 160, 99, 0.35))',
    ],
    transition: {
      duration: 2.0,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
