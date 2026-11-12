/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { breathingCrescentVariant } from '../utils/animations';

interface BreathingCrescentLoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

export const BreathingCrescentLoader: React.FC<BreathingCrescentLoaderProps> = ({
  label = 'Loading...',
  size = 'md',
  isDark = true,
}) => {
  const sizeMap = {
    sm: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-[11px]' },
    md: { box: 'w-16 h-16', icon: 'w-10 h-10', text: 'text-xs' },
    lg: { box: 'w-24 h-24', icon: 'w-16 h-16', text: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3 select-none">
      {/* Breathing Crescent Moon (Scale 0.9 to 1.1, 2s loop in gold) */}
      <motion.div
        variants={breathingCrescentVariant}
        animate="animate"
        className={`flex items-center justify-center text-[#DFBA7F] ${currentSize.box}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={currentSize.icon}
          aria-hidden="true"
        >
          {/* Elegant Astronomical Crescent Moon path */}
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.79c.45-.33.94-.61 1.46-.83A8.93 8.93 0 0 0 12 3z" />
        </svg>
      </motion.div>

      {label && (
        <span
          className={`font-cinzel tracking-wider text-[#DFBA7F] font-semibold ${currentSize.text} animate-pulse`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Reusable Skeleton placeholder with flowing grey/gold gradient
 */
export const SkeletonPlaceholder: React.FC<{
  className?: string;
  isDark?: boolean;
}> = ({ className = 'h-4 w-full rounded-xl', isDark = true }) => {
  return (
    <div
      className={`${className} ${
        isDark ? 'skeleton-pulse' : 'skeleton-pulse-light'
      }`}
    />
  );
};
