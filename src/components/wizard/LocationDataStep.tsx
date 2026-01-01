// @ts-nocheck
import React, { useMemo, useEffect, useState, useCallback } from 'react';

export type LocationData = {
  country?: string;
  province?: string;
  city?: string;
};

type Props = {
  data: LocationData;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof LocationData, value: string) => void;
  // Si más adelante pasáis detecciones automáticas, se puede usar aquí:
  locationData?: { countryCode?: string; region?: string; city?: string };
};

function getCitiesByProvince(province: string): string[] {
  // Dummy: reemplazar por vuestro catálogo real
  const map: Record<string, string[]> = {
    madrid: ['Madrid', 'Alcalá de Henares', 'Getafe'],
    barcelona: ['Barcelona', 'Hospitalet', 'Badalona'],
  };
  return map[province.toLowerCase()] ?? [];
}

export const LocationDataStep: React.FC<Props> = ({
  data,
  errors,
  onFieldChange,
  locationData,
}) => {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const handleFieldChangeWithContext = useCallback(
    (field: keyof LocationData, value: string) => {
      // Normalizaciones mínimas
      if (field === 'country') value = value.trim().toLowerCase();
      if (field === 'province') value = value.trim();
      if (field === 'city') value = value.trim();

      onFieldChange(field, value);
    },
    [onFieldChange]
  );

  // Si viene una detección externa y el usuario no ha rellenado aún, proponemos valores
  useEffect(() => {
    if (!locationData) return;

    if (!data.country && locationData.countryCode) {
      handleFieldChangeWithContext('country', locationData.countryCode.toLowerCase());
    }
    if (!data.province && locationData.region) {
      handleFieldChangeWithContext('province', locationData.region);
    }
    if (!data.city && locationData.city) {
      handleFieldChangeWithContext('city', locationData.city);
    }
  }, [locationData, data.country, data.province, data.city, handleFieldChangeWithContext]);

  // Cargar ciudades cuando cambie la provincia (para ES como ejemplo)
  useEffect(() => {
    if (data.province && data.country === 'es') {
      setAvailableCities(getCitiesByProvince(data.province));
    } else {
      setAvailableCities([]);
    }
  }, [data.province, data.country]);

  const countryCodePretty = useMemo(() => data.country?.toUpperCase() ?? '—', [data.country]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">País (código): {countryCodePretty}</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">País (ISO-2)</label>
          <input
            value={data.country ?? ''}
            onChange={(e) => handleFieldChangeWithContext('country', e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="es"
          />
          {errors?.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Provincia/Región</label>
          <input
            value={data.province ?? ''}
            onChange={(e) => handleFieldChangeWithContext('province', e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="Madrid"
          />
          {errors?.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Ciudad</label>
          {availableCities.length > 0 ? (
            <select
              value={data.city ?? ''}
              onChange={(e) => handleFieldChangeWithContext('city', e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Selecciona...</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={data.city ?? ''}
              onChange={(e) => handleFieldChangeWithContext('city', e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="Madrid"
            />
          )}
          {errors?.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
        </div>
      </div>
    </div>
  );
};

export default LocationDataStep;
