import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

interface SystemAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  messageKey: string;
}

export const SystemAlert: React.FC<SystemAlertProps> = ({ type, messageKey }) => {
  const { t } = useTranslation();

  const icons = {
    success: <CheckCircle2 className="text-green-600" />,
    error: <AlertCircle className="text-red-600" />,
    warning: <TriangleAlert className="text-yellow-600" />,
    info: <Info className="text-blue-600" />
  };

  const colors = {
    success: 'bg-green-50 border-green-400 text-green-800',
    error: 'bg-red-50 border-red-400 text-red-800',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800'
  };

  return (
    <div className={`flex items-center gap-3 border-l-4 p-3 rounded-md mb-2 ${colors[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{t(messageKey)}</span>
    </div>
  );
};
