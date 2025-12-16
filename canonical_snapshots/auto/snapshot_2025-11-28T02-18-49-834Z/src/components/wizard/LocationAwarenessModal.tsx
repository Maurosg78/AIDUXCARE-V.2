// @ts-nocheck
import React, { useMemo } from 'react';


export type CountryMeta = {
  code: string;         // ISO-2 o equivalente
  name: string;         // nombre legible
  gdpr?: boolean;
  hipaa?: boolean;
  dataRetention?: number; // días
};

export type SelectedCountryData = {
  location: { city?: string; region?: string; country?: string };
  explanation?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (countryCode: string) => void;
  onUseCurrentLocation: () => void;
};

const COUNTRIES: CountryMeta[] = [
  { code: 'es', name: 'España', gdpr: true, dataRetention: 365 },
  { code: 'us', name: 'Estados Unidos', hipaa: true, dataRetention: 180 },
  { code: 'uk', name: 'Reino Unido', gdpr: true, dataRetention: 365 },
  { code: 'cl', name: 'Chile', dataRetention: 180 },
];

export default function LocationAwarenessModal({
  isOpen,
  onClose,
  onLocationSelected,
  onUseCurrentLocation,
}: Props): JSX.Element | null {
  const selectedCountryData: SelectedCountryData | null = null;

  const complianceNote = useMemo(() => {
    return 'Las normativas y retención de datos varían por país.';
  }, []);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-gray-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Selecciona tu país</h2>
        </div>

        <div className="p-4 space-y-3">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => onLocationSelected(country.code)}
              className="w-full text-left border rounded-md p-3 hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">{country.name}</div>
              <div className="text-xs text-gray-600">
                {country.gdpr && 'GDPR'} {country.hipaa && 'HIPAA'}
                {typeof country.dataRetention === 'number' && (
                  <span className="ml-2">· Retención: {country.dataRetention} días</span>
                )}
              </div>
            </button>
          ))}

          <div className="text-xs text-gray-500">{complianceNote}</div>

          {selectedCountryData && (
            <div className="mt-2 text-sm text-gray-700">
              Datos fiduciarios para {(selectedCountryData as SelectedCountryData | undefined)?.location?.country}
              <div className="text-xs text-gray-500">
                {(selectedCountryData as SelectedCountryData | undefined)?.location?.city}, {(selectedCountryData as SelectedCountryData | undefined)?.location?.region}
              </div>
              <div className="mt-1">{(selectedCountryData as SelectedCountryData | undefined)?.explanation}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2 justify-end">
          <button type="button" onClick={onUseCurrentLocation} className="px-3 py-2 rounded-md border">
            Usar mi ubicación actual
          </button>
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-md bg-gray-900 text-white">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
