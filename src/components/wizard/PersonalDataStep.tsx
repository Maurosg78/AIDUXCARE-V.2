/**
 * PersonalDataStep - Paso 1 del Wizard de Registro
 * Datos Personales (7 campos obligatorios del .md)
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState, useEffect } from 'react';
import { PersonalData } from '../../types/wizard';
import { emailValidationService, type EmailValidationResult } from '../../services/emailValidationService';
import { geolocationService, GeolocationData, PhoneCountryCode } from '../../services/geolocationService';
import { EmailRecoveryModal } from './EmailRecoveryModal';
import { GeolocationPermission } from './GeolocationPermission';
import { CountryCodeSelector } from './CountryCodeSelector'; // Added import for CountryCodeSelector

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
  const [selectedCountryCode, setSelectedCountryCode] = useState<PhoneCountryCode | null>(null);
  const [showCountryCodeSelector, setShowCountryCodeSelector] = useState(false);
  const [showGeolocationModal, setShowGeolocationModal] = useState(false);

  useEffect(() => {
    // Mostrar modal de geolocalización al cargar el componente
    setShowGeolocationModal(true);
  }, []);

  // Indicador de fortaleza de contraseña del .md
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  };

  const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Media';
      case 'strong': return 'Fuerte';
    }
  };

  const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
    }
  };

  // Email validation
  const [emailValidationMessage, setEmailValidationMessage] = useState<string>('');
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    const validateEmail = async () => {
      if (!data.email || data.email.length < 5) {
        setEmailValidationMessage('');
        return;
      }

      setIsValidatingEmail(true);
      try {
        const result = await emailValidationService.validateEmail(data.email);
        setEmailValidation(result);
        
        if (result.exists) {
          setEmailValidationMessage('Email ya registrado');
          setShowRecoveryModal(true);
        } else {
          setEmailValidationMessage('Email disponible');
        }
      } catch (error) {
        setEmailValidationMessage('');
      } finally {
        setIsValidatingEmail(false);
      }
    };

    const timeoutId = setTimeout(validateEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [data.email]);

  // Handlers para geolocalización
  const handleLocationDetected = (location: GeolocationData) => {
    setShowGeolocationModal(false);
    
    // Configurar código de país automáticamente
    if (location.countryCode) {
      const countryCode = geolocationService.getPhoneCountryCode(location.countryCode);
      if (countryCode) {
        setSelectedCountryCode(countryCode);
        onFieldChange('phoneCountryCode', countryCode.code);
      }
    }

    // Notificar al componente padre sobre la ubicación detectada
    if (onLocationDetected) {
      onLocationDetected(location);
    }
  };

  const handleManualLocationSelection = () => {
    setShowGeolocationModal(false);
    // El usuario puede seleccionar manualmente el código de país
  };

  // Handlers para email recovery
  const handlePasswordRecovery = async () => {
    try {
      await emailValidationService.sendPasswordRecovery(data.email);
      setShowRecoveryModal(false);
    } catch (error) {
      console.error('Error sending password recovery:', error);
    }
  };

  const handleAccountActivation = async () => {
    try {
      await emailValidationService.sendAccountActivation(data.email);
      setShowRecoveryModal(false);
    } catch (error) {
      console.error('Error sending account activation:', error);
    }
  };

  const handleContinueRegistration = () => {
    setShowRecoveryModal(false);
  };

  // Handler para selección de código de país
  const handleCountryCodeSelect = (country: PhoneCountryCode) => {
    setSelectedCountryCode(country);
    onFieldChange('phoneCountryCode', country.code);
  };

  return (
    <>
      {/* Modal de geolocalización */}
      {showGeolocationModal && (
        <GeolocationPermission
          onLocationDetected={handleLocationDetected}
          onManualSelection={handleManualLocationSelection}
        />
      )}

              {/* Formulario Apple-style */}
        <div className="space-y-3">
          {/* Nombres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">Primer Nombre *</label>
              <input 
                id="firstName" 
                type="text" 
                value={data.firstName} 
                onChange={(e) => onFieldChange('firstName', e.target.value)} 
                className={`block w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`} 
                autoComplete="given-name" 
                placeholder="Tu nombre"
              />
              {errors.firstName && (<p className="text-sm text-red-600 mt-1">{errors.firstName}</p>)}
            </div>
            <div>
              <label htmlFor="secondName" className="block text-sm font-medium text-gray-700 mb-2">Segundo Nombre</label>
              <input 
                id="secondName" 
                type="text" 
                value={data.secondName || ''} 
                onChange={(e) => onFieldChange('secondName', e.target.value)} 
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base" 
                autoComplete="additional-name" 
                placeholder="Tu segundo nombre"
              />
            </div>
          </div>
                  {/* Apellidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido *</label>
              <input 
                id="lastName" 
                type="text" 
                value={data.lastName} 
                onChange={(e) => onFieldChange('lastName', e.target.value)} 
                className={`block w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`} 
                autoComplete="family-name" 
                placeholder="Tu apellido"
              />
              {errors.lastName && (<p className="text-xs text-red-600 mt-1">{errors.lastName}</p>)}
            </div>
            <div>
              <label htmlFor="secondLastName" className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
              <input 
                id="secondLastName" 
                type="text" 
                value={data.secondLastName || ''} 
                onChange={(e) => onFieldChange('secondLastName', e.target.value)} 
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm" 
                autoComplete="family-name" 
                placeholder="Tu segundo apellido"
              />
            </div>
          </div>
                  {/* Fecha de Nacimiento y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input 
                id="birthDate" 
                type="date" 
                value={data.birthDate} 
                onChange={(e) => onFieldChange('birthDate', e.target.value)} 
                className={`block w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm ${errors.birthDate ? 'border-red-300' : 'border-gray-200'}`} 
              />
              {errors.birthDate && (<p className="text-xs text-red-600 mt-1">{errors.birthDate}</p>)}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => onFieldChange('email', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                autoComplete="email"
                placeholder="tu@email.com"
              />
              {emailValidationMessage && (
                <p className={`text-xs mt-1 ${
                  emailValidationMessage === 'Email disponible'
                    ? 'text-green-600'
                    : emailValidationMessage === 'Email ya registrado'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}>
                  {isValidatingEmail && (
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {emailValidationMessage}
                </p>
              )}
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
          </div>
                  {/* Teléfono y Género - En la misma línea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <div className="flex">
                <div className="flex-shrink-0 w-16">
                  <button
                    type="button"
                    onClick={() => setShowCountryCodeSelector(true)}
                    className="flex items-center justify-center space-x-1 px-2 py-2 w-full border border-gray-200 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    <span className="text-sm">{selectedCountryCode?.flag || '🌍'}</span>
                    <span className="text-xs font-medium">{selectedCountryCode?.code || '+XX'}</span>
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={(e) => onFieldChange('phone', e.target.value)}
                  className={`flex-1 px-3 py-2 border border-gray-200 rounded-r-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.phone ? 'border-red-300' : ''}`}
                  autoComplete="tel"
                  placeholder="XXX XXX XXX"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
            
            {/* Género */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Género</label>
              <select 
                id="gender" 
                value={data.gender} 
                onChange={(e) => onFieldChange('gender', e.target.value)} 
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
              >
                <option value="">Selecciona tu género</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero-no-decir">Prefiero no decir</option>
              </select>
            </div>
          </div>
                  {/* Contraseñas - En la misma línea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                id="password" 
                type="password" 
                value={data.password} 
                onChange={(e) => onFieldChange('password', e.target.value)} 
                className={`block w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.password ? 'border-red-300' : 'border-gray-200'}`} 
                placeholder="••••••••" 
                autoComplete="new-password" 
              />
              {data.password && (
                <div className="mt-1">
                  <span className={`text-sm ${getPasswordStrengthColor(checkPasswordStrength(data.password))}`}>
                    Fortaleza: {getPasswordStrengthText(checkPasswordStrength(data.password))}
                  </span>
                </div>
              )}
              {errors.password && (<p className="text-sm text-red-600 mt-1">{errors.password}</p>)}
            </div>
            
            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
              <input 
                id="confirmPassword" 
                type="password" 
                value={data.confirmPassword} 
                onChange={(e) => onFieldChange('confirmPassword', e.target.value)} 
                className={`block w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`} 
                placeholder="••••••••" 
                autoComplete="new-password" 
              />
              {errors.confirmPassword && (<p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>)}
            </div>
          </div>
      </div>

      {/* Modal de recuperación de email */}
      {emailValidation && (
        <EmailRecoveryModal
          isOpen={showRecoveryModal}
          email={data.email}
          validationResult={emailValidation}
          onClose={() => setShowRecoveryModal(false)}
          onPasswordRecovery={handlePasswordRecovery}
          onAccountActivation={handleAccountActivation}
          onContinueRegistration={handleContinueRegistration}
        />
      )}

      {/* Modal de selección de código de país */}
      {showCountryCodeSelector && (
        <CountryCodeSelector
          isOpen={showCountryCodeSelector}
          onClose={() => setShowCountryCodeSelector(false)}
          onSelect={handleCountryCodeSelect}
          selectedCode={selectedCountryCode}
        />
      )}
    </>
  );
}; 