import React from 'react';
import { CreditDisplay } from './CreditDisplay';
import { LanguageToggle } from './LanguageToggle';
import { getTranslation } from '../i18n/translations';
import { useLanguage } from '../contexts/LanguageContext';

interface ResponsiveHeaderProps {
  title: string;
  credits: number;
  onAddCredits: () => void;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  title,
  credits,
  onAddCredits
}) => {
  const { language } = useLanguage();
  
  return (
    <header className="w-full mb-8">
      {/* Mobile: Stack vertically */}
      <div className="sm:hidden">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <LanguageToggle />
        </div>
        <div className="w-full">
          <CreditDisplay credits={credits} onAddCredits={onAddCredits} />
        </div>
      </div>
      
      {/* Desktop: Horizontal layout with proper spacing */}
      <div className="hidden sm:block">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="flex items-center gap-6">
            <CreditDisplay credits={credits} onAddCredits={onAddCredits} />
            <div className="border-l border-gray-300 h-8"></div>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
