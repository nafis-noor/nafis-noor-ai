import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  isDark?: boolean;
  pullThreshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  isDark = true,
  pullThreshold = 75,
}) => {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if scrolled at the very top of the window
      if (window.scrollY <= 2) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
        setCanPull(true);
      } else {
        isPullingRef.current = false;
        setCanPull(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing || window.scrollY > 2) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Elastic rubber-band dampening: sqrt resistance
        const dampened = Math.min(110, Math.pow(diff, 0.85) * 1.8);
        setPullY(dampened);

        // Prevent native overscroll when actively pulling down
        if (diff > 10 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullY >= pullThreshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullY(65);

        // Tactile vibration if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([15, 30, 20]); } catch {}
        }

        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullY(0);
          }, 600);
        }
      } else {
        setPullY(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullY, pullThreshold, isRefreshing, onRefresh]);

  const progress = Math.min(1, pullY / pullThreshold);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Peak Celestial Pull-To-Refresh Header */}
      <AnimatePresence>
        {(pullY > 5 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ height: `${pullY}px` }}
            className="w-full flex items-center justify-center overflow-hidden pointer-events-none select-none transition-all duration-75 relative z-30"
          >
            <div className="flex flex-col items-center justify-center relative">
              {/* Outer Radiating Celestial Glow Rings */}
              <div
                className={`absolute w-14 h-14 rounded-full border border-[#DFBA7F]/40 transition-transform ${
                  isRefreshing ? 'animate-peak-rings' : ''
                }`}
                style={{
                  transform: `scale(${0.6 + progress * 0.5})`,
                  opacity: progress * 0.8,
                }}
              />
              <div
                className={`absolute w-20 h-20 rounded-full border border-[#C9A063]/20 transition-transform ${
                  isRefreshing ? 'animate-peak-rings delay-150' : ''
                }`}
                style={{
                  transform: `scale(${0.7 + progress * 0.4})`,
                  opacity: progress * 0.5,
                }}
              />

              {/* Central Glowing Crescent Emblem */}
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  isRefreshing
                    ? 'animate-peak-pulse bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#FFE8B8] text-[#080B10] shadow-[0_0_25px_rgba(223,186,127,0.7)]'
                    : isDark
                    ? 'bg-[#151922] border border-[#DFBA7F]/40 text-[#DFBA7F]'
                    : 'bg-white border border-[#C9A063]/50 text-[#8E6527] shadow-sm'
                }`}
                style={{
                  transform: `rotate(${pullY * 3.6}deg) scale(${0.8 + progress * 0.25})`,
                }}
              >
                <span className="text-lg leading-none font-bold select-none drop-shadow-sm">☪</span>
              </div>

              {/* Status Hint */}
              <div className="mt-1 flex items-center gap-1 text-[10px] font-mono tracking-wider font-semibold text-[#DFBA7F] drop-shadow-sm">
                <Sparkles className="w-2.5 h-2.5 animate-spin" />
                <span>
                  {isRefreshing
                    ? 'REFRESHING...'
                    : pullY >= pullThreshold
                    ? 'RELEASE TO REFRESH'
                    : 'PULL TO REFRESH'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with subtle pull translation */}
      <div
        style={{
          transform: pullY > 0 && !isRefreshing ? `translateY(${pullY * 0.2}px)` : undefined,
          transition: isRefreshing || pullY === 0 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
