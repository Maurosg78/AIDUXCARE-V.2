import React, { useState, useEffect } from 'react';

import logger from '@/shared/utils/logger';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserPreferences {
  theme: 'inside' | 'outside';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'inside',
    fontSize: 'medium',
    compactMode: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Cargar preferencias guardadas
    const savedPrefs = localStorage.getItem('aiduxcare-preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        logger.error('Error cargando preferencias:', error);
      }
    }
  }, []);

  const handlePreferenceChange = (key: keyof UserPreferences, value: string | boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Guardar en localStorage
      localStorage.setItem('aiduxcare-preferences', JSON.stringify(preferences));
      
      // Aplicar tema
      document.documentElement.setAttribute('data-app', preferences.theme);
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onClose();
    } catch (error) {
      logger.error('Error guardando preferencias:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-xl shadow-soft max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Preferencias</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSaving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tema */}
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-3">
              Tema de la interfaz
            </span>
            <div className="space-y-2">
              <label className="flex items-center" htmlFor="theme-inside">
                <input
                  id="theme-inside"
                  type="radio"
                  name="theme"
                  value="inside"
                  checked={preferences.theme === 'inside'}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="mr-3 text-brand-in-500 focus:ring-brand-in-500"
                />
                <span className="text-sm text-slate-700">Inside (Azul sobrio)</span>
              </label>
              <label className="flex items-center" htmlFor="theme-outside">
                <input
                  id="theme-outside"
                  type="radio"
                  name="theme"
                  value="outside"
                  checked={preferences.theme === 'outside'}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="mr-3 text-brand-in-500 focus:ring-brand-in-500"
                />
                <span className="text-sm text-slate-700">Outside (Verde vibrante)</span>
              </label>
            </div>
          </div>

          {/* Tamaño de texto */}
          <div>
            <label htmlFor="fontSize" className="block text-sm font-medium text-slate-700 mb-3">
              Tamaño de texto
            </label>
            <select
              value={preferences.fontSize}
              onChange={(e) => handlePreferenceChange('fontSize', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:border-transparent"
            >
              <option value="small">Pequeño</option>
              <option value="medium">Mediano</option>
              <option value="large">Grande</option>
            </select>
          </div>

          {/* Modo compacto */}
          <div>
            <label className="flex items-center" htmlFor="compactMode">
              <input
                id="compactMode"
                type="checkbox"
                checked={preferences.compactMode}
                onChange={(e) => handlePreferenceChange('compactMode', e.target.checked)}
                className="mr-3 text-brand-in-500 focus:ring-brand-in-500 rounded"
              />
              <span className="text-sm text-slate-700">Modo compacto (menos espaciado)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-brand-in-500 text-white rounded-lg hover:bg-brand-in-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
