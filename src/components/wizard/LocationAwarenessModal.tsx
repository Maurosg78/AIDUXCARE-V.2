import React, { useState } from 'react';
import { geolocationService } from '../../services/GeolocationService';

interface LocationAwarenessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (countryCode: string) => void;
  onUseCurrentLocation: () => void;
}

export const LocationAwarenessModal: React.FC<LocationAwarenessModalProps> = ({
  isOpen,
  onClose,
  onLocationSelected,
  onUseCurrentLocation
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [showCountryDetails, setShowCountryDetails] = useState(false);

  if (!isOpen) return null;

  const geolocationServiceInstance = geolocationService;
  const availableCountries = geolocationServiceInstance.getAvailableCountriesForManualSelection();
  const importanceExplanation = geolocationServiceInstance.getLocationImportanceExplanation();

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setShowCountryDetails(true);
  };

  const handleConfirmCountry = () => {
    if (selectedCountry) {
      onLocationSelected(selectedCountry);
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    onUseCurrentLocation();
    onClose();
  };

  const selectedCountryData = selectedCountry ? 
    geolocationServiceInstance.getFiduciaryDataForCountry(selectedCountry) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Ubicación y compliance legal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Explicación de importancia */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ¿Por qué es importante tu ubicación real?
              </h3>
              <div className="mt-2 text-sm text-blue-700 whitespace-pre-line">
                {importanceExplanation}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="space-y-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={handleUseCurrentLocation}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Usar mi ubicación real (recomendado)
            </button>
            <button
              onClick={() => setShowCountryDetails(false)}
              className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Seleccionar país manualmente
            </button>
          </div>
        </div>

        {/* Selección manual de país */}
        {!showCountryDetails && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Selecciona tu país de uso:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className="text-left p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{country.name}</div>
                  <div className="text-sm text-gray-600">
                  {country.gdpr && 'GDPR'} {country.hipaa && 'HIPAA'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Retención: {country.dataRetention} días
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detalles del país seleccionado */}
        {showCountryDetails && selectedCountryData && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Datos fiduciarios para {selectedCountryData.location.country}
            </h3>
            
            <div className="space-y-3 mb-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-sm text-gray-600">Ubicación por defecto:</div>
                <div className="font-medium">
                  {selectedCountryData.location.city}, {selectedCountryData.location.region}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="text-sm text-gray-600">Compliance legal:</div>
                <div className="text-sm">
                  {selectedCountryData.explanation}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmCountry}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Confirmar y usar estos datos
              </button>
              <button
                onClick={() => setShowCountryDetails(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cambiar país
              </button>
            </div>
          </div>
        )}

        {/* Nota importante */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="text-sm text-yellow-800">
            <strong>Nota importante:</strong> Si seleccionas un país diferente al real, 
            las regulaciones legales aplicadas pueden no ser las correctas para tu jurisdicción. 
            Esto puede afectar la protección de tus datos médicos.
          </div>
        </div>
      </div>
    </div>
  );
};
