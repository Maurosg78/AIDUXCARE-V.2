import React from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationBannerProps {
  type: 'info' | 'success' | 'warning' | 'error';
  messageKey: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ type, messageKey }) => {
  const { t } = useTranslation();

  const colors = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`p-3 rounded-md text-sm font-medium ${colors[type]}`}>
      {t(`notifications.${messageKey}`)}
    </div>
  );
};
