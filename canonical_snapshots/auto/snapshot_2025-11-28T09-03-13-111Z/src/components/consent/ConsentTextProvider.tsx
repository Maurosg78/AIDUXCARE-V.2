import React from 'react';
import { useTranslation } from 'react-i18next';

interface ConsentTextProviderProps {
  variant?: 'default' | 'phipa' | 'pipeda';
}

export const ConsentTextProvider: React.FC<ConsentTextProviderProps> = ({ variant = 'default' }) => {
  const { t } = useTranslation();
  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      {variant === 'phipa' && <p>{t('consent.phipaNotice')}</p>}
      {variant === 'pipeda' && <p>{t('consent.pipedaNotice')}</p>}
      {variant === 'default' && <p>{t('consent.generalNotice')}</p>}
    </div>
  );
};
