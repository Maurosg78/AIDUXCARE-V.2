/**
 * PersonalDataStep - Paso 1 del Wizard de Registro
 * Formulario con Grid Simétrico Perfecto
 * 
 * @version 2.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState, useEffect } from 'react';
import { PersonalData } from '../../types/wizard';
import { emailValidationService, type EmailValidationResult } from '../../services/emailValidationService';
import { GeolocationData, GeolocationService } from '../../services/geolocationService';
import { EmailRecoveryModal } from './EmailRecoveryModal';
import { LocationAwarenessModal } from './LocationAwarenessModal';
import { GeolocationPermissionModal } from './GeolocationPermissionModal';
import { PhoneInput } from './PhoneInput';
import { useProfessionalProfile, ProfessionalProfile } from '../../context/ProfessionalProfileContext';
import '../../styles/form.css';

interface PersonalDataStepProps {
  data: PersonalData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean) => void;
  onLocationDetected?: (location: GeolocationData) => void;
}

export const PersonalDataStep: React.FC<PersonalDataStepProps> = ({
  data,
  errors,
  onFieldChange,
  onLocationDetected
}) => {
  // Debug: Log de datos recibidos
  console.log('PersonalDataStep - Datos recibidos:', data);
  console.log('PersonalDataStep - Teléfono recibido:', data.phone);
  console.log('PersonalDataStep - Código de país recibido:', data.phoneCountryCode);
  
  const { updateWizardData } = useProfessionalProfile();
  // const [showGeolocationModal, setShowGeolocationModal] = useState(false);
  
  // Ejecutar geolocalización automáticamente solo una vez al montar
  useEffect(() => {
    detectLocationAutomatically();
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLocationAwareness, setShowLocationAwareness] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Protección contra data undefined
  const safeData = data || {
    firstName: '',
    lastName: '',
    secondName: '',
    secondLastName: '',
    birthDate: '',
    email: '',
    phone: '',
    phoneCountryCode: '+34',
    gender: '',
    password: '',
    confirmPassword: ''
  };
  
  // Función para detectar ubicación automáticamente
  const detectLocationAutomatically = async () => {
    try {
      // Usar el servicio de geolocalización que maneja fallbacks automáticamente
      const geolocationService = (await import('../../services/geolocationService')).GeolocationService.getInstance();
      const locationData = await geolocationService.detectLocation();
      
      if (locationData) {
        // Verificar si se necesitan resetear permisos
        if (locationData.needsPermissionReset) {
          console.log('Permisos denegados - mostrando modal de instrucciones');
          setShowPermissionModal(true);
          return;
        }
        
        // Llenar automáticamente los campos de ciudad y país si están disponibles
        if (locationData.city) {
          handleFieldChangeWithContext('city', locationData.city);
        }
        if (locationData.country) {
          handleFieldChangeWithContext('country', locationData.country);
        }
        
        // ACTUALIZAR AUTOMÁTICAMENTE EL CÓDIGO DE PAÍS DEL TELÉFONO
        if (locationData.country) {
          const countryCode = getCountryCodeFromCountry(locationData.country);
          if (countryCode) {
            handleFieldChangeWithContext('phoneCountryCode', countryCode);
          }
        }
        
        // Llamar al callback si existe
        if (onLocationDetected) {
          onLocationDetected(locationData);
        }
      }
    } catch (error) {
      console.error('PersonalDataStep - Error en geolocalización automática:', error);
    }
  };

  // Función para obtener el código de país del teléfono basado en el nombre del país
  const getCountryCodeFromCountry = (countryName: string): string => {
    const countryMap: Record<string, string> = {
      'España': '+34',
      'Spain': '+34',
      'Estados Unidos': '+1',
      'United States': '+1',
      'United States of America': '+1',
      'Reino Unido': '+44',
      'United Kingdom': '+44',
      'Great Britain': '+44',
      'Francia': '+33',
      'France': '+33',
      'Alemania': '+49',
      'Germany': '+49',
      'Italia': '+39',
      'Italy': '+39',
      'Países Bajos': '+31',
      'Netherlands': '+31',
      'Bélgica': '+32',
      'Belgium': '+32',
      'Portugal': '+351',
      'México': '+52',
      'Argentina': '+54',
      'Chile': '+56',
      'Colombia': '+57',
      'Perú': '+51',
      'Venezuela': '+58',
      'Brasil': '+55',
      'Uruguay': '+598',
      'Paraguay': '+595',
      'Bolivia': '+591',
      'Ecuador': '+593'
    };
    
    return countryMap[countryName] || '+34'; // Default a España
  };

  // Función para manejar selección manual de país
  const handleManualCountrySelection = (countryCode: string) => {
    const geolocationService = GeolocationService.getInstance();
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
      
      console.log('PersonalDataStep - Datos fiduciarios aplicados para:', countryCode);
    }
  };

  // Función para usar ubicación actual
  const handleUseCurrentLocation = () => {
    detectLocationAutomatically();
  };

  const handlePermissionModalClose = () => {
    setShowPermissionModal(false);
  };

  const handlePermissionModalRetry = () => {
    setShowPermissionModal(false);
    // Reintentar después de un breve delay
    setTimeout(() => {
      detectLocationAutomatically();
    }, 1000);
  };

  // Mapear campos del wizard a campos del contexto
  const handleFieldChangeWithContext = (field: string, value: string | boolean) => {
    // Solo logear cambios importantes, no cada letra
    if (field === 'firstName' || field === 'lastName' || field === 'email' || field === 'city' || field === 'country' || field === 'phone' || field === 'phoneCountryCode') {
      console.log(`PersonalDataStep - Campo cambiado: ${field} = ${value}`);
    }
    
    // Actualizar el contexto del wizard
    const fieldMapping: Record<string, keyof ProfessionalProfile> = {
      firstName: 'fullName',
      lastName: 'fullName', // Se maneja en el componente
      email: 'email',
      phone: 'phone'
    };

    const contextField = fieldMapping[field];
    if (contextField) {
      updateWizardData(contextField, value);
    }
    
    // Llamar al callback original si existe
    if (onFieldChange && typeof onFieldChange === 'function') {
      onFieldChange(field, value);
    }
  };

  // Indicador de fortaleza de contraseña
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  };

  const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Media';
      case 'strong': return 'Fuerte';
      default: return 'Desconocida';
    }
  };

  const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Validación de email en tiempo real
  const [emailValidation] = useState<EmailValidationResult>({ 
    exists: false, 
    message: '',
    isActive: false,
    canRecover: false,
    canActivate: false
  });
  // const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Función para manejar ubicación detectada (ahora se llama automáticamente)
  // const handleLocationDetected = (location: GeolocationData) => {
  //   console.log('Ubicación detectada en PersonalDataStep:', location);
  //   
  //   // Mapear país a código correcto
  //   const countryMapping: Record<string, string> = {
  //     'España': 'es',
  //     'Spain': 'es',
  //     'México': 'mx',
  //     'Mexico': 'mx',
  //     'Argentina': 'ar',
  //     'Colombia': 'co',
  //     'Chile': 'cl',
  //     'Perú': 'pe',
  //     'Peru': 'pe',
  //     'Estados Unidos': 'us',
  //     'United States': 'us'
  //   };
  //   
  //   // Mapear provincia a valor del dropdown
  //   const provinceMapping: Record<string, string> = {
  //     'Comunidad Valenciana': 'valencia',
  //     'Valencia': 'valencia',
  //     'Madrid': 'madrid',
  //     'Barcelona': 'barcelona',
  //     'Andalucía': 'andalucia',
  //     'Cataluña': 'cataluna',
  //     'Galicia': 'galicia',
  //     'Castilla y León': 'castilla-leon',
  //     'Castilla-La Mancha': 'castilla-mancha',
  //     'País Vasco': 'pais-vasco',
  //     'Aragón': 'aragon',
  //     'Asturias': 'asturias',
  //     'Cantabria': 'cantabria',
  //     'La Rioja': 'la-rioja',
  //     'Navarra': 'navarra',
  //     'Extremadura': 'extremadura',
  //     'Murcia': 'murcia',
  //     'Islas Baleares': 'islas-balears',
  //     'Islas Canarias': 'islas-canarias',
  //     'Ceuta': 'ceuta',
  //     'Melilla': 'melilla'
  //   };
  //   
  //   const countryCode = countryMapping[location.country || ''] || location.country || '';
  //   const provinceCode = provinceMapping[location.region || ''] || location.region || '';
  //   
  //   console.log('Mapeo de ubicación:', {
  //     original: { country: location.country, region: location.region },
  //     city: location.city,
  //     countryCode,
  //     provinceCode
  //   };
  //   
  //   // Actualizar campos del wizard
  //   if (location.city) {
  //     handleFieldChangeWithContext('city', location.city);
  //   }
  //   if (countryCode) {
  //     handleFieldChangeWithContext('country', countryCode);
  //     if (provinceCode) {
  //       handleFieldChangeWithContext('province', provinceCode);
  //     }
  //   }
  // };

  // Función para manejar selección manual de ubicación (ya no se usa)
  // const handleManualLocationSelection = () => {
  //   console.log('Selección manual de ubicación');
  //   // setShowGeolocationModal(false); // Eliminado
  // };



  // Handlers para email recovery
  const handlePasswordRecovery = async () => {
    try {
      await emailValidationService.sendPasswordRecovery(safeData.email);
      setShowRecoveryModal(false);
    } catch (error) {
      console.error('Error sending password recovery:', error);
    }
  };

  // Debug: Log antes de renderizar
  console.log('PersonalDataStep - Antes de renderizar con datos:', {
    phone: safeData.phone,
    phoneCountryCode: safeData.phoneCountryCode,
    errors: errors
  });

  return (
    <>
      {/* Modal de geolocalización */}
      {/* Eliminado */}

      {/* Botón opcional de geolocalización - SOLO si el usuario lo solicita */}
      {/* <div className="max-w-2xl mx-auto mb-6">
        <button
          type="button"
          onClick={() => setShowGeolocationModal(true)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Detectar ubicación automáticamente
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Opcional: Permite completar automáticamente tu ciudad y país
        </p>
      </div> */}

      {/* Formulario con Grid Simétrico Perfecto */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Fila 1: Nombres */}
          <div className="form-group">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              Primer Nombre *
            </label>
            <input 
              id="firstName" 
              type="text" 
              value={safeData.firstName} 
              onChange={(e) => handleFieldChangeWithContext('firstName', e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`} 
              autoComplete="given-name" 
              placeholder="Tu nombre"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="secondName" className="block text-sm font-medium text-gray-700 mb-2">
              Segundo Nombre
            </label>
            <input 
              id="secondName" 
              type="text" 
              value={safeData.secondName || ''} 
              onChange={(e) => handleFieldChangeWithContext('secondName', e.target.value)} 
              className="block w-full h-12 px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base" 
              autoComplete="additional-name" 
              placeholder="Tu segundo nombre"
            />
          </div>
          
          {/* Fila 2: Apellidos */}
          <div className="form-group">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Primer Apellido *
            </label>
            <input 
              id="lastName" 
              type="text" 
              value={safeData.lastName} 
              onChange={(e) => handleFieldChangeWithContext('lastName', e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`} 
              autoComplete="family-name" 
              placeholder="Tu apellido"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="secondLastName" className="block text-sm font-medium text-gray-700 mb-2">
              Segundo Apellido
            </label>
            <input 
              id="secondLastName" 
              type="text" 
              value={safeData.secondLastName || ''} 
              onChange={(e) => handleFieldChangeWithContext('secondLastName', e.target.value)} 
              className="block w-full h-12 px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base" 
              autoComplete="family-name" 
              placeholder="Tu segundo apellido"
            />
          </div>
          
          {/* Fila 3: Fecha y Email */}
          <div className="form-group">
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento
            </label>
            <input 
              id="birthDate" 
              type="date" 
              value={safeData.birthDate} 
              onChange={(e) => handleFieldChangeWithContext('birthDate', e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.birthDate ? 'border-red-300' : 'border-gray-200'}`} 
            />
            {errors.birthDate && (
              <p className="text-sm text-red-600 mt-1">{errors.birthDate}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={safeData.email}
              onChange={(e) => handleFieldChangeWithContext('email', e.target.value)}
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
              autoComplete="email"
              placeholder="tu@email.com"
            />
            {emailValidation && (
              <p className={`text-sm mt-1 ${!emailValidation.exists ? 'text-green-600' : 'text-red-600'}`}>
                {!emailValidation.exists ? 'Email válido y disponible' : emailValidation.message || 'Email ya existe'}
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>
          
          {/* Fila 4: Teléfono y Género */}
          <div className="form-group">
            <PhoneInput
              value={safeData.phone}
              onChange={(phone) => handleFieldChangeWithContext('phone', phone)}
              countryCode={safeData.phoneCountryCode || '+34'}
              onCountryChange={(code) => handleFieldChangeWithContext('phoneCountryCode', code)}
              error={errors.phone}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              Género
            </label>
            <select 
              id="gender" 
              value={safeData.gender} 
              onChange={(e) => handleFieldChangeWithContext('gender', e.target.value)} 
              className="block w-full h-12 px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
            >
              <option value="">Selecciona tu género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero-no-decir">Prefiero no decir</option>
            </select>
          </div>
          
          {/* Fila 5: Contraseñas (ancho completo) */}
          <div className="form-group md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={safeData.password} 
                    onChange={(e) => handleFieldChangeWithContext('password', e.target.value)} 
                    className={`block w-full h-12 px-4 py-3 pr-12 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.password ? 'border-red-300' : 'border-gray-200'}`} 
                    placeholder="••••••••" 
                    autoComplete="new-password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {safeData.password && (
                  <div className="mt-1">
                    <span className={`text-sm ${getPasswordStrengthColor(checkPasswordStrength(safeData.password))}`}>
                      Fortaleza: {getPasswordStrengthText(checkPasswordStrength(safeData.password))}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={safeData.confirmPassword} 
                    onChange={(e) => handleFieldChangeWithContext('confirmPassword', e.target.value)} 
                    className={`block w-full h-12 px-4 py-3 pr-12 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`} 
                    placeholder="••••••••" 
                    autoComplete="new-password" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Validación en tiempo real de coincidencia de contraseñas */}
                {safeData.password && safeData.confirmPassword && (
                  <div className="mt-1">
                    {safeData.password === safeData.confirmPassword ? (
                      <span className="text-sm text-green-600">✓ Las contraseñas coinciden</span>
                    ) : (
                      <span className="text-sm text-red-600">✗ Las contraseñas no coinciden</span>
                    )}
                  </div>
                )}
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de recuperación de email */}
      {emailValidation && (
        <EmailRecoveryModal
          isOpen={showRecoveryModal}
          onClose={() => setShowRecoveryModal(false)}
          onRecover={handlePasswordRecovery}
        />
      )}

      {/* Modal de concienciación de ubicación */}
      <LocationAwarenessModal
        isOpen={showLocationAwareness}
        onClose={() => setShowLocationAwareness(false)}
        onLocationSelected={handleManualCountrySelection}
        onUseCurrentLocation={handleUseCurrentLocation}
      />

      {/* Modal de permisos de geolocalización */}
      <GeolocationPermissionModal
        isOpen={showPermissionModal}
        onClose={handlePermissionModalClose}
        onRetry={handlePermissionModalRetry}
      />
    </>
  );
}; 