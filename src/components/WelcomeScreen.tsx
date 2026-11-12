import React from 'react';
import { AuthWelcomeScreen } from './AuthWelcomeScreen';
import { UserStats } from '../types';

interface WelcomeScreenProps {
  isDark: boolean;
  onCompleteWelcome: (stats: UserStats) => void;
  onToggleTheme?: () => void;
  initialZeroStats: UserStats;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isDark,
  onCompleteWelcome,
  onToggleTheme,
  initialZeroStats,
}) => {
  return (
    <AuthWelcomeScreen
      isDark={isDark}
      onAuthenticated={onCompleteWelcome}
      onToggleTheme={onToggleTheme}
      initialZeroStats={initialZeroStats}
    />
  );
};
