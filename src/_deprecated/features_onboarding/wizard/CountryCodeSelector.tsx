// @ts-nocheck
import React from 'react';

import { geolocationService, PhoneCountryCode } from '../../services/geolocationService';

interface CountryCodeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (country: PhoneCountryCode) => void;
  selectedCode: PhoneCountryCode | null;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCode
}) => {
  if (!isOpen) return null;

  const countryCodes = geolocationService.getAllPhoneCountryCodes();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Selecciona tu país para el código de teléfono
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {countryCodes.map((country) => (
            <button
              key={country.code}
              onClick={() => {
                onSelect(country);
                onClose();
              }}
              className={`flex items-center space-x-3 p-3 border rounded-md transition-colors ${
                selectedCode?.code === country.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <span className="text-2xl">{country.flag}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">{country.country}</div>
                <div className="text-sm text-gray-600">{country.code}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 