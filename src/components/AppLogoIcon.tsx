import React, { useState } from 'react';

interface AppLogoIconProps {
  className?: string;
  size?: number | string;
  withContainer?: boolean;
}

export const APP_ICON_URL = '/app-icon.png';
export const LOCAL_APP_ICON_URL = '/app-icon.png';

/**
 * AppLogoIcon — Main application icon emblem exactly as provided by user
 */
export const AppLogoIcon: React.FC<AppLogoIconProps> = ({
  className = 'w-8 h-8',
  size,
  withContainer = true,
}) => {
  const [currentSrc, setCurrentSrc] = useState(LOCAL_APP_ICON_URL);

  const handleError = () => {
    if (currentSrc === LOCAL_APP_ICON_URL) {
      setCurrentSrc('/app-icon.svg');
    } else if (currentSrc === '/app-icon.svg') {
      setCurrentSrc('/icon-192.png');
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${
        withContainer ? 'rounded-2xl' : 'rounded-xl'
      } ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Noor App Emblem"
    >
      <img
        src={currentSrc}
        alt="Noor App Emblem"
        className="w-full h-full object-contain select-none pointer-events-none drop-shadow-xs"
        loading="eager"
        decoding="async"
        onError={handleError}
      />
    </div>
  );
};

export default AppLogoIcon;
