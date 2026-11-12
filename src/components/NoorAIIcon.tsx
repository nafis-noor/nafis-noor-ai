import React from 'react';

interface NoorAIIconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * NoorAIIcon — The minimal, clean, geometric "Light / Noor" AI symbol.
 * 
 * Design characteristics:
 * - Pure 4-pointed radiant astroid (symbol of Divine Light / Noor)
 * - Central luminous intelligence core (subtle AI presence)
 * - 4 harmonic diagonal ambient light nodes (balanced geometric constellation)
 * - Recognizable at 24px, 32px, 40px, 48px
 * - Zero robots, zero human faces, zero speech bubbles, zero clutter
 */
export const NoorAIIcon: React.FC<NoorAIIconProps> = ({
  className = 'w-4 h-4',
  size,
  color = 'currentColor',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Noor AI Symbol"
    >
      {/* 4-Point Radiant Light / Noor Astroid with Central Optical Aperture */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 12 2.5 C 12 7.75 16.25 12 21.5 12 C 16.25 12 12 16.25 12 21.5 C 12 16.25 7.75 12 2.5 12 C 7.75 12 12 7.75 12 2.5 Z M 12 9.8 A 2.2 2.2 0 1 0 12 14.2 A 2.2 2.2 0 1 0 12 9.8 Z"
        fill={color}
      />
      {/* Central Luminous Nucleus */}
      <circle cx="12" cy="12" r="1.1" fill={color} />

      {/* 4 Subtle Diagonal Ambient Light Sparks (AI constellation) */}
      <circle cx="6.8" cy="6.8" r="1.1" fill={color} opacity="0.9" />
      <circle cx="17.2" cy="6.8" r="1.1" fill={color} opacity="0.9" />
      <circle cx="6.8" cy="17.2" r="1.1" fill={color} opacity="0.9" />
      <circle cx="17.2" cy="17.2" r="1.1" fill={color} opacity="0.9" />
    </svg>
  );
};

interface NoorAIAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'; // xs=24px, sm=32px, md=40px, lg=48px
  isDark?: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * NoorAIAvatar — Circular chat avatar container specifically styled for Noor AI
 */
export const NoorAIAvatar: React.FC<NoorAIAvatarProps> = ({
  size = 'sm',
  isDark = true,
  className = '',
  animate = false,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',      // 24px
    sm: 'w-8 h-8',      // 32px
    md: 'w-10 h-10',    // 40px
    lg: 'w-12 h-12',    // 48px
  }[size];

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 select-none shadow-md transition-all ${sizeClasses} ${
        isDark
          ? 'bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] shadow-[0_2px_10px_rgba(201,160,99,0.35)]'
          : 'bg-gradient-to-tr from-[#C9A063] via-[#DFBA7F] to-[#B88E4F] text-[#090B0E] shadow-sm'
      } ${animate ? 'animate-pulse' : ''} ${className}`}
      aria-label="Noor AI Avatar"
    >
      <NoorAIIcon className={iconSizes} color="#090B0E" />
    </div>
  );
};

export default NoorAIIcon;
