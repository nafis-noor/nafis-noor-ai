/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_EASE, SPRING_TRANSITION, isReducedMotionActive } from '../utils/animations';
import { t, getLanguageCode } from '../utils/i18n';

interface SplashScreenProps {
  onComplete: () => void;
  isDark?: boolean;
  language?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  scale: number;
  duration: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isDark = true, language }) => {
  const lang = getLanguageCode(language);
  const [phase, setPhase] = useState<'fade-in' | 'scattering' | 'complete'>('fade-in');
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // If reduced motion is requested, complete immediately
    if (isReducedMotionActive()) {
      onComplete();
      return;
    }

    // Generate gold scattering particles
    const generated: Particle[] = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
      const distance = 90 + Math.random() * 160;
      generated.push({
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: Math.random() * 3 + 2,
        scale: Math.random() * 0.8 + 0.6,
        duration: 0.6 + Math.random() * 0.4,
      });
    }
    setParticles(generated);

    // Timeline:
    // 0s - 1.2s: Calligraphy fades in with upward float
    // At 2.0s: Dissolve into gold particles scattering outward
    const scatterTimer = setTimeout(() => {
      setPhase('scattering');
    }, 2000);

    // At 2.8s: Scatter complete, trigger slide-up transition to Home screen
    const finishTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(scatterTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('complete');
    onComplete();
  };

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.4, ease: DEFAULT_EASE },
          }}
          onClick={handleSkip}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden ${
            isDark ? 'bg-[#06080D] text-stone-100' : 'bg-[#FAF8F5] text-stone-900'
          }`}
        >
          {/* Subtle Ambient Golden Glow Behind Calligraphy */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.25, scale: 1.2 }}
            transition={{ duration: 1.5, ease: DEFAULT_EASE }}
            className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#C9A063]/30 to-[#DFBA7F]/20 blur-3xl pointer-events-none"
          />

          {/* Central Calligraphy Container */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-4">
            {/* 1. Bismillah Calligraphy: Fades in with upward float over 1.2s */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={
                phase === 'fade-in'
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, scale: 0.95 }
              }
              transition={{
                duration: phase === 'fade-in' ? 1.2 : 0.5,
                ease: DEFAULT_EASE,
              }}
              className="space-y-4"
            >
              {/* Crescent Moon Embellishment */}
              <div className="flex justify-center mb-2">
                <span className="text-2xl text-[#DFBA7F] drop-shadow-sm">☪</span>
              </div>

              {/* Authentic Arabic Bismillah Calligraphy */}
              <h1
                dir="rtl"
                className="font-arabic text-3xl sm:text-5xl font-bold text-[#DFBA7F] drop-shadow-[0_2px_12px_rgba(201,160,99,0.35)] leading-relaxed select-none"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </h1>

              {/* Reverent Translation & App Brand */}
              <p className="font-serif-heading italic text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-md mx-auto">
                {t(lang, 'bismillahTranslation')}
              </p>

              <div className="pt-4 flex items-center justify-center gap-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#C9A063]/60" />
                <span className="text-[10px] font-cinzel uppercase tracking-[0.25em] text-[#DFBA7F]">
                  {t(lang, 'appEmblemText')}
                </span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#C9A063]/60" />
              </div>
            </motion.div>

            {/* 2. Gold Particles Scattering Outward after 2s */}
            {phase === 'scattering' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: p.scale }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      opacity: 0,
                      scale: 0.2,
                    }}
                    transition={{
                      duration: p.duration,
                      ease: DEFAULT_EASE,
                    }}
                    className="absolute rounded-full bg-gradient-to-br from-[#FFE3A8] to-[#C9A063] shadow-[0_0_8px_rgba(223,186,127,0.8)]"
                    style={{
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Discreet Skip Prompt */}
          <div className="absolute bottom-6 text-[11px] text-stone-500 font-sans tracking-wide">
            Tap anywhere to enter
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
