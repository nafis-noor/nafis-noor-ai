import React from 'react';
import { ArabicLearningView } from './ArabicLearningView';

interface StudyDashboardProps {
  isDark: boolean;
  language?: string;
}

export const StudyDashboard: React.FC<StudyDashboardProps> = ({ isDark, language }) => {
  return (
    <div
      className={`min-h-screen pb-32 sm:pb-36 lg:pb-16 transition-colors duration-200 ${
        isDark ? 'bg-[#080B12] text-stone-100' : 'bg-[#F9FAFB] text-stone-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ArabicLearningView isDark={isDark} language={language} />
      </div>
    </div>
  );
};

