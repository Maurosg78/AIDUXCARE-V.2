import React from 'react';
import { useTranslation } from 'react-i18next';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type }) => {
  const { t } = useTranslation();

  const message =
    type === 'success'
      ? t('clinical.success')
      : type === 'error'
      ? t('clinical.error')
      : t('clinical.warning');

  const color =
    type === 'success'
      ? 'bg-green-100 text-green-800'
      : type === 'error'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <div className={`p-3 rounded-md text-sm font-medium ${color}`}>
      {message}
    </div>
  );
};
