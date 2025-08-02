/**
 * LocationDataStep - Paso 3 del Wizard de Registro
 * Ubicación y Consentimientos Legales (4 campos + 2 checkboxes del .md)
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState, useEffect } from 'react';
import { LocationData, WizardStep, ValidationResult } from '../../types/wizard';
import { GeolocationData } from '../../services/geolocationService';
import { SPANISH_CITIES, getCitiesByProvince } from '../../data/spanishCities';
import { LegalChecklist, type LegalChecklistItem } from '../LegalChecklist';

interface LocationDataStepProps {
  data: LocationData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean) => void;
  onValidation: (step: WizardStep) => ValidationResult;
  locationData?: GeolocationData | null;
}

export const LocationDataStep: React.FC<LocationDataStepProps> = ({
  data,
  errors,
  onFieldChange,
  locationData
}) => {
  // const [legalCompliance, setLegalCompliance] = useState<LegalCompliance | null>(null);
  const [detectedLocation] = useState<GeolocationData | null>(locationData || null);
  const [availableCities, setAvailableCities] = useState<typeof SPANISH_CITIES>([]);
  const [legalChecklistItems, setLegalChecklistItems] = useState<LegalChecklistItem[]>([
    {
      id: 'terms-accepted',
      title: 'Acepto los Términos y Condiciones de Uso',
      description: 'He leído y comprendo las condiciones de uso de AiDuxCare',
      required: true,
      category: 'terms',
      checked: data.consentGDPR || false
    },
    {
      id: 'privacy-accepted',
      title: 'Acepto la Política de Privacidad',
      description: 'Autorizo el procesamiento de datos según la política de privacidad',
      required: true,
      category: 'privacy',
      checked: data.consentGDPR || false
    },
    {
      id: 'medical-disclaimer',
      title: 'Acepto el Disclaimer Médico',
      description: 'Entiendo que AiDuxCare es un asistente y no reemplaza mi juicio clínico',
      required: true,
      category: 'medical',
      checked: data.consentGDPR || false
    }
  ]);

  // Provincias españolas ordenadas alfabéticamente
  const spanishProvinces = [
    { value: 'albacete', label: 'Albacete' },
    { value: 'alava', label: 'Álava' },
    { value: 'alicante', label: 'Alicante' },
    { value: 'almeria', label: 'Almería' },
    { value: 'asturias', label: 'Asturias' },
    { value: 'avila', label: 'Ávila' },
    { value: 'badajoz', label: 'Badajoz' },
    { value: 'barcelona', label: 'Barcelona' },
    { value: 'bilbao', label: 'Bilbao' },
    { value: 'burgos', label: 'Burgos' },
    { value: 'caceres', label: 'Cáceres' },
    { value: 'cadiz', label: 'Cádiz' },
    { value: 'cantabria', label: 'Cantabria' },
    { value: 'castellon', label: 'Castellón' },
    { value: 'ceuta', label: 'Ceuta' },
    { value: 'ciudad-real', label: 'Ciudad Real' },
    { value: 'cordoba', label: 'Córdoba' },
    { value: 'cuenca', label: 'Cuenca' },
    { value: 'gerona', label: 'Gerona' },
    { value: 'granada', label: 'Granada' },
    { value: 'guadalajara', label: 'Guadalajara' },
    { value: 'guipuzcoa', label: 'Guipúzcoa' },
    { value: 'huelva', label: 'Huelva' },
    { value: 'huesca', label: 'Huesca' },
    { value: 'islas-baleares', label: 'Islas Baleares' },
    { value: 'islas-canarias', label: 'Islas Canarias' },
    { value: 'jaen', label: 'Jaén' },
    { value: 'la-coruna', label: 'La Coruña' },
    { value: 'la-rioja', label: 'La Rioja' },
    { value: 'las-palmas', label: 'Las Palmas' },
    { value: 'leon', label: 'León' },
    { value: 'lerida', label: 'Lérida' },
    { value: 'lugo', label: 'Lugo' },
    { value: 'madrid', label: 'Madrid' },
    { value: 'malaga', label: 'Málaga' },
    { value: 'melilla', label: 'Melilla' },
    { value: 'murcia', label: 'Murcia' },
    { value: 'navarra', label: 'Navarra' },
    { value: 'orense', label: 'Orense' },
    { value: 'oviedo', label: 'Oviedo' },
    { value: 'palencia', label: 'Palencia' },
    { value: 'pamplona', label: 'Pamplona' },
    { value: 'pontevedra', label: 'Pontevedra' },
    { value: 'salamanca', label: 'Salamanca' },
    { value: 'santa-cruz-tenerife', label: 'Santa Cruz de Tenerife' },
    { value: 'santander', label: 'Santander' },
    { value: 'segovia', label: 'Segovia' },
    { value: 'sevilla', label: 'Sevilla' },
    { value: 'soria', label: 'Soria' },
    { value: 'tarragona', label: 'Tarragona' },
    { value: 'teruel', label: 'Teruel' },
    { value: 'toledo', label: 'Toledo' },
    { value: 'valencia', label: 'Valencia' },
    { value: 'valladolid', label: 'Valladolid' },
    { value: 'vizcaya', label: 'Vizcaya' },
    { value: 'zamora', label: 'Zamora' },
    { value: 'zaragoza', label: 'Zaragoza' }
  ];

  // Países disponibles ordenados alfabéticamente
  const countries = [
    { value: 'ar', label: 'Argentina' },
    { value: 'bo', label: 'Bolivia' },
    { value: 'br', label: 'Brasil' },
    { value: 'bz', label: 'Belice' },
    { value: 'cl', label: 'Chile' },
    { value: 'co', label: 'Colombia' },
    { value: 'cr', label: 'Costa Rica' },
    { value: 'cu', label: 'Cuba' },
    { value: 'do', label: 'República Dominicana' },
    { value: 'ec', label: 'Ecuador' },
    { value: 'es', label: 'España' },
    { value: 'fr', label: 'Francia' },
    { value: 'gb', label: 'Reino Unido' },
    { value: 'gd', label: 'Granada' },
    { value: 'de', label: 'Alemania' },
    { value: 'gt', label: 'Guatemala' },
    { value: 'ht', label: 'Haití' },
    { value: 'hn', label: 'Honduras' },
    { value: 'it', label: 'Italia' },
    { value: 'jm', label: 'Jamaica' },
    { value: 'kn', label: 'San Cristóbal y Nieves' },
    { value: 'lc', label: 'Santa Lucía' },
    { value: 'mx', label: 'México' },
    { value: 'ni', label: 'Nicaragua' },
    { value: 'pa', label: 'Panamá' },
    { value: 'pe', label: 'Perú' },
    { value: 'pr', label: 'Puerto Rico' },
    { value: 'pt', label: 'Portugal' },
    { value: 'py', label: 'Paraguay' },
    { value: 'sv', label: 'El Salvador' },
    { value: 'sr', label: 'Surinam' },
    { value: 'tt', label: 'Trinidad y Tobago' },
    { value: 'us', label: 'Estados Unidos' },
    { value: 'uy', label: 'Uruguay' },
    { value: 'vc', label: 'San Vicente y las Granadinas' },
    { value: 've', label: 'Venezuela' },
    { value: 'other', label: 'Otro' }
  ];

  useEffect(() => {
    if (detectedLocation) {
      // Auto-completar país si se detectó ubicación
      if (!data.country && detectedLocation.countryCode) {
        onFieldChange('country', detectedLocation.countryCode.toLowerCase());
      }
      // Auto-completar provincia/región si está disponible
      if (!data.province && detectedLocation.region) {
        onFieldChange('province', detectedLocation.region.toLowerCase().replace(/\s+/g, '-'));
      }
      // Auto-completar ciudad si está disponible
      if (!data.city && detectedLocation.city) {
        onFieldChange('city', detectedLocation.city);
      }
      // Obtener compliance legal para mostrar los checkboxes correctos
      if (detectedLocation.countryCode) {
        // const compliance = geolocationService.getLegalCompliance(detectedLocation.countryCode);
        // setLegalCompliance(compliance);
      }
    } else if (data.country) {
      // Si se seleccionó país manualmente, obtener compliance
      // const compliance = geolocationService.getLegalCompliance(data.country.toUpperCase());
      // setLegalCompliance(compliance);
    }
  }, [detectedLocation, data.country, onFieldChange]);

  useEffect(() => {
    // Actualizar ciudades disponibles cuando cambie la provincia
    if (data.province && data.country === 'es') {
      const cities = getCitiesByProvince(data.province);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [data.province, data.country]);

  const handleCountryChange = (countryCode: string) => {
    onFieldChange('country', countryCode);
    
    // Obtener compliance legal para el país seleccionado
    // const compliance = geolocationService.getLegalCompliance(countryCode.toUpperCase());
    // setLegalCompliance(compliance);
  };

  const handleLegalChecklistChange = (itemId: string, checked: boolean) => {
    setLegalChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, checked } : item
      )
    );

    // Actualizar el estado del formulario - todos los elementos actualizan consentGDPR
    onFieldChange('consentGDPR', checked);
  };

  const handleLegalChecklistComplete = (allChecked: boolean) => {
    // Aquí puedes manejar la lógica cuando se complete el checklist
    console.log('Checklist legal completado:', allChecked);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Información de ubicación detectada */}
        {detectedLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-green-800 font-medium">
                  Ubicación detectada automáticamente
                </p>
                <p className="text-green-700 text-sm">
                  {detectedLocation.country} - {detectedLocation.city || detectedLocation.region}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* País y Provincia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className="wizard-label">
              País *
            </label>
            <select
              id="country"
              value={data.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className={`wizard-input ${errors.country ? 'error' : ''}`}
            >
              <option value="">Selecciona tu país</option>
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="wizard-error">{errors.country}</p>
            )}
          </div>

          <div>
            <label htmlFor="province" className="wizard-label">
              Provincia/Estado *
            </label>
            <select
              id="province"
              value={data.province}
              onChange={(e) => onFieldChange('province', e.target.value)}
              className={`wizard-input ${errors.province ? 'error' : ''}`}
            >
              <option value="">Selecciona tu provincia</option>
              {data.country === 'es' ? (
                spanishProvinces.map((province) => (
                  <option key={province.value} value={province.value}>
                    {province.label}
                  </option>
                ))
              ) : (
                <option value="other">Otro</option>
              )}
            </select>
            {errors.province && (
              <p className="wizard-error">{errors.province}</p>
            )}
          </div>
        </div>

        {/* Ciudad con autocompletado */}
        <div>
          <label htmlFor="city" className="wizard-label">
            Ciudad *
          </label>
          {data.country === 'es' && data.province && availableCities.length > 0 ? (
            <select
              id="city"
              value={data.city}
              onChange={(e) => onFieldChange('city', e.target.value)}
              className={`wizard-input ${errors.city ? 'error' : ''}`}
            >
              <option value="">Selecciona tu ciudad</option>
              {availableCities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="city"
              type="text"
              value={data.city}
              onChange={(e) => onFieldChange('city', e.target.value)}
              className={`wizard-input ${errors.city ? 'error' : ''}`}
              placeholder="Ingresa tu ciudad"
            />
          )}
          {errors.city && (
            <p className="wizard-error">{errors.city}</p>
          )}
        </div>

        {/* Checklist Legal Mejorado */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Consentimientos Legales *
          </h3>
          
          <LegalChecklist
            items={legalChecklistItems}
            onItemChange={handleLegalChecklistChange}
            onComplete={handleLegalChecklistComplete}
            showDetails={true}
          />
        </div>
      </div>
    </>
  );
}; 