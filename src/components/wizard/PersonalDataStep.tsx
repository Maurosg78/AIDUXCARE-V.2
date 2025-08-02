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

      {/* Resto del formulario */}
      <div className="space-y-6">
        {/* Nombres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="wizard-label">Primer Nombre *</label>
            <input id="firstName" type="text" value={data.firstName} onChange={(e) => onFieldChange('firstName', e.target.value)} className={`wizard-input ${errors.firstName ? 'error' : ''}`} autoComplete="given-name" />
            {errors.firstName && (<p className="wizard-error">{errors.firstName}</p>)}
          </div>
          <div>
            <label htmlFor="secondName" className="wizard-label">Segundo Nombre</label>
            <input id="secondName" type="text" value={data.secondName || ''} onChange={(e) => onFieldChange('secondName', e.target.value)} className="wizard-input" autoComplete="additional-name" />
          </div>
        </div>
        {/* Apellidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lastName" className="wizard-label">Primer Apellido *</label>
            <input id="lastName" type="text" value={data.lastName} onChange={(e) => onFieldChange('lastName', e.target.value)} className={`wizard-input ${errors.lastName ? 'error' : ''}`} autoComplete="family-name" />
            {errors.lastName && (<p className="wizard-error">{errors.lastName}</p>)}
          </div>
          <div>
            <label htmlFor="secondLastName" className="wizard-label">Segundo Apellido</label>
            <input id="secondLastName" type="text" value={data.secondLastName || ''} onChange={(e) => onFieldChange('secondLastName', e.target.value)} className="wizard-input" autoComplete="family-name" />
          </div>
        </div>
        {/* Fecha de Nacimiento y Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthDate" className="wizard-label">Fecha de Nacimiento</label>
            <input id="birthDate" type="date" value={data.birthDate} onChange={(e) => onFieldChange('birthDate', e.target.value)} className={`wizard-input ${errors.birthDate ? 'error' : ''}`} />
            {errors.birthDate && (<p className="wizard-error">{errors.birthDate}</p>)}
          </div>
          <div>
            <label htmlFor="email" className="wizard-label">Email</label>
            <input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              className={`wizard-input ${errors.email ? 'error' : ''}`}
              autoComplete="email"
            />
            {emailValidationMessage && (
              <p className={`text-sm mt-1 ${
                emailValidationMessage === 'Email disponible'
                  ? 'text-green-600'
                  : emailValidationMessage === 'Email ya registrado'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {isValidatingEmail && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {emailValidationMessage}
              </p>
            )}
            {errors.email && (
              <p className="wizard-error">{errors.email}</p>
            )}
          </div>
        </div>
        {/* Teléfono con código de país */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="wizard-label">Teléfono</label>
            <div className="flex">
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCountryCodeSelector(true)}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg">{selectedCountryCode?.flag || '🌍'}</span>
                  <span className="text-sm font-medium">{selectedCountryCode?.code || '+XX'}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => onFieldChange('phone', e.target.value)}
                className={`flex-1 wizard-input rounded-l-none ${errors.phone ? 'error' : ''}`}
                autoComplete="tel"
                placeholder={selectedCountryCode?.format || 'Número de teléfono'}
              />
            </div>
            {errors.phone && (
              <p className="wizard-error">{errors.phone}</p>
            )}
          </div>
          <div>
            <label htmlFor="gender" className="wizard-label">Género</label>
            <select id="gender" value={data.gender} onChange={(e) => onFieldChange('gender', e.target.value)} className="wizard-input">
              <option value="">Selecciona tu género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero-no-decir">Prefiero no decir</option>
            </select>
          </div>
        </div>
        {/* Contraseñas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="wizard-label">Contraseña</label>
            <input id="password" type="password" value={data.password} onChange={(e) => onFieldChange('password', e.target.value)} className={`wizard-input ${errors.password ? 'error' : ''}`} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            {data.password && (
              <div className="mt-2">
                <span className={`text-sm ${getPasswordStrengthColor(checkPasswordStrength(data.password))}`}>
                  Fortaleza: {getPasswordStrengthText(checkPasswordStrength(data.password))}
                </span>
              </div>
            )}
            {errors.password && (<p className="wizard-error">{errors.password}</p>)}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="wizard-label">Confirmar Contraseña</label>
            <input id="confirmPassword" type="password" value={data.confirmPassword} onChange={(e) => onFieldChange('confirmPassword', e.target.value)} className={`wizard-input ${errors.confirmPassword ? 'error' : ''}`} autoComplete="new-password" />
            {errors.confirmPassword && (<p className="wizard-error">{errors.confirmPassword}</p>)}
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