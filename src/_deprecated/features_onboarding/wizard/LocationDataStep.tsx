// @ts-nocheck
/**
 * LocationDataStep - Paso 3 del Wizard de Registro
 * Ubicación y Consentimientos Legales (4 campos + 2 checkboxes del .md)
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState, useEffect } from 'react';
import { LocationData, WizardStep, ValidationResult } from '../../types/wizard';
import { GeolocationData, geolocationService } from '../../services/geolocationService';
import { SPANISH_CITIES, getCitiesByProvince } from '../../data/spanishCities';
import { LegalChecklist, type LegalChecklistItem } from '../LegalChecklist';
import { useProfessionalProfile, ProfessionalProfile } from '../../context/ProfessionalProfileContext';
import { LocationAwarenessModal } from './LocationAwarenessModal';

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
  const { updateWizardData } = useProfessionalProfile();
  // const [legalCompliance, setLegalCompliance] = useState<LegalCompliance | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<GeolocationData | null>(locationData || null);
  const [availableCities, setAvailableCities] = useState<typeof SPANISH_CITIES>([]);
  const [showLocationAwareness, setShowLocationAwareness] = useState(false);
  
  // Ejecutar geolocalización automáticamente al montarse el componente
  useEffect(() => {
    console.log('LocationDataStep - Componente montado, verificando geolocalización...');
    
    // Si ya tenemos datos de ubicación detectados, usarlos
    if (locationData) {
      console.log('LocationDataStep - Usando datos de ubicación ya detectados:', locationData);
      setDetectedLocation(locationData);
      return;
    }
    
    // Si no tenemos datos, ejecutar geolocalización automáticamente
    console.log('LocationDataStep - No hay datos de ubicación, ejecutando geolocalización automática...');
    detectLocationAutomatically();
  }, [locationData]);
  
  // Función para manejar selección manual de país
  const handleManualCountrySelection = (countryCode: string) => {
    const geolocationService = geolocationService.getInstance();
    const fiduciaryData = geolocationService.getFiduciaryDataForCountry(countryCode);
    
    if (fiduciaryData) {
      // Llenar campos con datos fiduciarios
      if (fiduciaryData.location.city) {
        handleFieldChangeWithContext('city', fiduciaryData.location.city);
      }
      if (fiduciaryData.location.region) {
        handleFieldChangeWithContext('province', fiduciaryData.location.region);
      }
      if (fiduciaryData.location.country) {
        handleFieldChangeWithContext('country', fiduciaryData.location.country);
      }
      
      console.log('LocationDataStep - Datos fiduciarios aplicados para:', countryCode);
    }
  };

  // Función para usar ubicación actual
  const handleUseCurrentLocation = () => {
    detectLocationAutomatically();
  };

  // Función para detectar ubicación automáticamente
  const detectLocationAutomatically = async () => {
    try {
      console.log('LocationDataStep - Iniciando detección automática de ubicación...');
      
      // Usar el servicio de geolocalización que maneja fallbacks automáticamente
      const geolocationService = (await import('../../services/geolocationService')).geolocationService.getInstance();
      const newLocationData = await geolocationService.detectLocation();
      
      if (newLocationData) {
        console.log('LocationDataStep - Datos de ubicación obtenidos:', newLocationData);
        setDetectedLocation(newLocationData);
        
        // Llenar automáticamente los campos de ubicación si están disponibles
        if (newLocationData.country) {
          handleFieldChangeWithContext('country', newLocationData.country);
        }
        if (newLocationData.region) {
          handleFieldChangeWithContext('province', newLocationData.region);
        }
        if (newLocationData.city) {
          handleFieldChangeWithContext('city', newLocationData.city);
        }
      } else {
        console.log('LocationDataStep - No se pudo obtener ubicación automáticamente');
      }
    } catch (error) {
      console.error('LocationDataStep - Error en geolocalización automática:', error);
    }
  };
  
  // Usar datos de ubicación detectados si están disponibles
  const currentData = {
    ...data,
    // Usar los datos del wizard que ya están mapeados correctamente
    country: data.country,
    province: data.province,
    city: data.city
  };
  
  console.log('LocationDataStep - Datos actuales:', currentData);
  console.log('LocationDataStep - Datos detectados:', detectedLocation);
  console.log('LocationDataStep - Datos del wizard:', data);
  const [legalChecklistItems, setLegalChecklistItems] = useState<LegalChecklistItem[]>([
    {
      id: 'terms-accepted',
      title: 'I accept the Terms of Use',
      description: 'I have read and understand the Terms of Use for AiDuxCare',
      required: true,
      category: 'terms',
      checked: false // NO pre-cargar consentimientos
    },
    {
      id: 'privacy-accepted',
      title: 'I accept the Privacy Policy',
      description: 'I authorize data processing according to the Privacy Policy',
      required: true,
      category: 'privacy',
      checked: false // NO pre-cargar consentimientos
    },
    {
      id: 'phipa-pipeda-accepted',
      title: 'I acknowledge PHIPA / PIPEDA requirements',
      description: 'I understand my responsibilities as Health Information Custodian (HIC)',
      required: true,
      category: 'phipa-pipeda',
      checked: false // NO pre-cargar consentimientos
    }
  ]);

  // Mapear campos del wizard a campos del contexto
  const handleFieldChangeWithContext = (field: string, value: string | boolean) => {
    // Solo logear cambios importantes, no cada letra
    if (field === 'country' || field === 'province' || field === 'city') {
      console.log(`LocationDataStep - Campo cambiado: ${field} = ${value}`);
    }
    
    // Mapear campos del wizard a campos del contexto
    const fieldMapping: Record<string, keyof ProfessionalProfile> = {
      country: 'country',
      province: 'province',
      city: 'city',
      consentGDPR: 'consentGranted',
      consentHIPAA: 'consentGranted'
    };

    const contextField = fieldMapping[field];
    if (contextField) {
      updateWizardData(contextField, value);
    }
    
    // También llamar al callback original para mantener compatibilidad
    onFieldChange(field, value);
  };

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
        handleFieldChangeWithContext('country', detectedLocation.countryCode.toLowerCase());
      }
      // Auto-completar provincia/región si está disponible
      if (!data.province && detectedLocation.region) {
        handleFieldChangeWithContext('province', detectedLocation.region.toLowerCase().replace(/\s+/g, '-'));
      }
      // Auto-completar ciudad si está disponible
      if (!data.city && detectedLocation.city) {
        handleFieldChangeWithContext('city', detectedLocation.city);
      }
      // Obtener compliance legal para mostrar los checkboxes correctos
      // if (detectedLocation.countryCode) {
      //   // const compliance = geolocationService.getLegalCompliance(detectedLocation.countryCode);
      //   // setLegalCompliance(compliance);
      // }
    } else if (data.country) {
      // Si se seleccionó país manualmente, obtener compliance
      // const compliance = geolocationService.getLegalCompliance(data.country.toUpperCase());
      // setLegalCompliance(compliance);
    }
  }, [detectedLocation, data.country, handleFieldChangeWithContext]);

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
    handleFieldChangeWithContext('country', countryCode);
    
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

    // Actualizar el estado del formulario según el tipo de consentimiento
    if (itemId === 'terms-accepted') {
      // Terms acceptance (stored in location data if needed)
    } else if (itemId === 'privacy-accepted') {
      handleFieldChangeWithContext('pipedaConsent', checked);
    } else if (itemId === 'phipa-pipeda-accepted') {
      handleFieldChangeWithContext('phipaConsent', checked);
    }
  };

  const handleLegalChecklistComplete = (allChecked: boolean) => {
    // Aquí puedes manejar la lógica cuando se complete el checklist
    console.log('Checklist legal completado:', allChecked);
  };

  return (
    <>
      {/* Formulario Ultra-Optimizado para 13" sin scroll */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          
          {/* Información de ubicación detectada - Ultra-compacta */}
          {detectedLocation && (
            <div className="form-group md:col-span-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="flex items-center space-x-1">
                  <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-gray-900 font-medium text-xs">
                      Ubicación detectada automáticamente
                    </p>
                    <p className="text-gray-600 text-xs">
                      {detectedLocation.country} - {detectedLocation.city || detectedLocation.region}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Fila 1: País y Provincia */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-0.5">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                País *
              </label>
              <button
                type="button"
                onClick={() => setShowLocationAwareness(true)}
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                title="Información sobre ubicación y compliance legal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¿Por qué es importante?
              </button>
            </div>
            <select
              id="country"
              value={currentData.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className={`block w-full h-8 px-2 py-1 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-xs ${errors.country ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option value="">Selecciona tu país</option>
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="text-xs text-red-600 mt-0.5">{errors.country}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-0.5">
              Provincia/Estado *
            </label>
            <select
              id="province"
              value={currentData.province}
              onChange={(e) => handleFieldChangeWithContext('province', e.target.value)}
              className={`block w-full h-8 px-2 py-1 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-xs ${errors.province ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option value="">Selecciona tu provincia</option>
              {currentData.country === 'es' ? (
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
              <p className="text-xs text-red-600 mt-0.5">{errors.province}</p>
            )}
          </div>
          
          {/* Fila 2: Ciudad - Ancho completo */}
          <div className="form-group md:col-span-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-0.5">
              Ciudad *
            </label>
            {currentData.country === 'es' && currentData.province && availableCities.length > 0 ? (
              <select
                id="city"
                value={currentData.city}
                onChange={(e) => handleFieldChangeWithContext('city', e.target.value)}
                className={`block w-full h-8 px-2 py-1 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-xs ${errors.city ? 'border-red-300' : 'border-gray-200'}`}
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
                value={currentData.city}
                onChange={(e) => handleFieldChangeWithContext('city', e.target.value)}
                className={`block w-full h-8 px-2 py-1 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-xs ${errors.city ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="Ingresa tu ciudad"
              />
            )}
            {errors.city && (
              <p className="text-xs text-red-600 mt-0.5">{errors.city}</p>
            )}
          </div>
          
          {/* Fila 3: Consentimientos Legales - Ultra-compactos */}
          <div className="form-group md:col-span-2">
            <h3 className="text-xs font-medium text-gray-900 mb-1">
              Legal Consent * (Required)
            </h3>
            
            <LegalChecklist
              items={legalChecklistItems}
              onItemChange={handleLegalChecklistChange}
              onComplete={handleLegalChecklistComplete}
              showDetails={true}
            />
          </div>
        </div>
      </div>

      {/* Modal de concienciación de ubicación */}
      <LocationAwarenessModal
        isOpen={showLocationAwareness}
        onClose={() => setShowLocationAwareness(false)}
        onLocationSelected={handleManualCountrySelection}
        onUseCurrentLocation={handleUseCurrentLocation}
      />
    </>
  );
}; 