import React from 'react';

interface LocationDataStepProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  onComplete: () => void;
  onBack: () => void;
}

const LocationDataStep: React.FC<LocationDataStepProps> = ({ data, onUpdate, onComplete, onBack }) => {
  const handleFieldChange = (field: string, value: any) => {
    onUpdate(field, value);
  };

  const canComplete = data.city && data.gdprConsent && data.hipaaConsent && data.dataProcessingConsent;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ubicación y Compliance</h2>
        <p className="text-gray-600">Regulaciones y consentimientos legales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad *
          </label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Madrid, Barcelona, Valencia"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provincia/Estado
          </label>
          <input
            type="text"
            value={data.state || ''}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Madrid, Cataluña, Valencia"
          />
        </div>
      </div>

      {/* Sección de Compliance */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consentimientos Legales</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="gdprConsent"
              checked={data.gdprConsent || false}
              onChange={(e) => handleFieldChange('gdprConsent', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <div>
              <label htmlFor="gdprConsent" className="text-sm font-medium text-gray-700">
                Consentimiento GDPR (Unión Europea) *
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Autorizo el procesamiento de mis datos personales según el Reglamento General de Protección de Datos de la UE.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="hipaaConsent"
              checked={data.hipaaConsent || false}
              onChange={(e) => handleFieldChange('hipaaConsent', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <div>
              <label htmlFor="hipaaConsent" className="text-sm font-medium text-gray-700">
                Consentimiento HIPAA (Estados Unidos) *
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Autorizo el uso y divulgación de mi información de salud protegida según la Ley HIPAA.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="pipedaConsent"
              checked={data.pipedaConsent || false}
              onChange={(e) => handleFieldChange('pipedaConsent', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div>
              <label htmlFor="pipedaConsent" className="text-sm font-medium text-gray-700">
                Consentimiento PIPEDA (Canadá)
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Autorizo la recopilación, uso y divulgación de mi información personal según PIPEDA.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="dataProcessingConsent"
              checked={data.dataProcessingConsent || false}
              onChange={(e) => handleFieldChange('dataProcessingConsent', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <div>
              <label htmlFor="dataProcessingConsent" className="text-sm font-medium text-gray-700">
                Procesamiento de Datos *
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Autorizo el procesamiento de mis datos para la prestación de servicios médicos y administrativos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
        >
          Anterior
        </button>
        <button
          onClick={onComplete}
          disabled={!canComplete}
          className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-fuchsia-500 to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:from-fuchsia-600 hover:to-blue-600 transition-all"
        >
          Completar Registro
        </button>
      </div>
    </div>
  );
};

export default LocationDataStep; 