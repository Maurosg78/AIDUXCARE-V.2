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
import { geolocationService, GeolocationData } from '../../services/geolocationService';
import { EmailRecoveryModal } from './EmailRecoveryModal';
import { GeolocationPermission } from './GeolocationPermission';
import { PhoneInput } from './PhoneInput';

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
  const [showGeolocationModal, setShowGeolocationModal] = useState(false);

  useEffect(() => {
    // Mostrar modal de geolocalización al cargar el componente
    setShowGeolocationModal(true);
  }, []);

  // Indicador de fortaleza de contraseña
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
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    const validateEmail = async () => {
      if (!data.email || data.email.length < 5) {
        setEmailValidationMessage('');
        return;
      }

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

  return (
    <>
      {/* Modal de geolocalización */}
      {showGeolocationModal && (
        <GeolocationPermission
          onLocationDetected={handleLocationDetected}
          onManualSelection={handleManualLocationSelection}
        />
      )}

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
              value={data.firstName} 
              onChange={(e) => onFieldChange('firstName', e.target.value)} 
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
              value={data.secondName || ''} 
              onChange={(e) => onFieldChange('secondName', e.target.value)} 
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
              value={data.lastName} 
              onChange={(e) => onFieldChange('lastName', e.target.value)} 
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
              value={data.secondLastName || ''} 
              onChange={(e) => onFieldChange('secondLastName', e.target.value)} 
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
              value={data.birthDate} 
              onChange={(e) => onFieldChange('birthDate', e.target.value)} 
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
              value={data.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
              autoComplete="email"
              placeholder="tu@email.com"
            />
            {emailValidationMessage && (
              <p className={`text-sm mt-1 ${emailValidationMessage.includes('disponible') ? 'text-green-600' : 'text-red-600'}`}>
                {emailValidationMessage}
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>
          
          {/* Fila 4: Teléfono y Género */}
          <div className="form-group">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <PhoneInput
              value={data.phone}
              onChange={(phone) => onFieldChange('phone', phone)}
              countryCode={data.phoneCountryCode || '+34'}
              onCountryChange={(code) => onFieldChange('phoneCountryCode', code)}
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
              value={data.gender} 
              onChange={(e) => onFieldChange('gender', e.target.value)} 
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
                <input 
                  id="password" 
                  type="password" 
                  value={data.password} 
                  onChange={(e) => onFieldChange('password', e.target.value)} 
                  className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.password ? 'border-red-300' : 'border-gray-200'}`} 
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
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input 
                  id="confirmPassword" 
                  type="password" 
                  value={data.confirmPassword} 
                  onChange={(e) => onFieldChange('confirmPassword', e.target.value)} 
                  className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`} 
                  placeholder="••••••••" 
                  autoComplete="new-password" 
                />
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
          email={data.email}
          validationResult={emailValidation}
          onClose={() => setShowRecoveryModal(false)}
          onPasswordRecovery={handlePasswordRecovery}
          onAccountActivation={handleAccountActivation}
          onContinueRegistration={handleContinueRegistration}
        />
      )}
    </>
  );
}; 