import React from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = '',
}) => {
  const { t } = useTranslation();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-sm mx-auto text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">
          {message || t('ui.loading')}
        </h2>
      </div>
    </div>
  );
};
