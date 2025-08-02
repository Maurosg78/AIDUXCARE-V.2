/**
 * WelcomePage - Página principal del Wizard de Registro AiDuxCare
 * Implementa el wizard de 3 pasos con validación y progreso
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonalDataStep } from '../components/wizard/PersonalDataStep';
import { ProfessionalDataStep } from '../components/wizard/ProfessionalDataStep';
import { LocationDataStep } from '../components/wizard/LocationDataStep';
import { WizardData, WizardStep, ValidationResult } from '../types/wizard';
import { GeolocationData } from '../services/geolocationService';
import { emailActivationService } from '../services/emailActivationService';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.PERSONAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationData, setLocationData] = useState<GeolocationData | null>(null);

  // Datos del wizard - Formulario limpio para producción
  const [wizardData, setWizardData] = useState<WizardData>({
    personal: {
      firstName: '',
      lastName: '',
      birthDate: '',
      email: '',
      phone: '',
      gender: '',
      password: '',
      confirmPassword: ''
    },
    professional: {
      professionalTitle: '',
      specialty: '',
      university: '',
      licenseNumber: '',
      workplace: '',
      experienceYears: ''
    },
    location: {
      country: '',
      province: '',
      city: '',
      consentGDPR: false,
      consentHIPAA: false
    }
  });

  // Validación de paso específico
  const validateStep = useCallback((step: WizardStep): ValidationResult => {
    const errors: Record<string, string> = {};

    switch (step) {
      case WizardStep.PERSONAL_DATA:
        // Campos obligatorios del paso personal
        if (!wizardData.personal.firstName.trim()) errors.firstName = 'Primer nombre requerido';
        if (!wizardData.personal.lastName.trim()) errors.lastName = 'Primer apellido requerido';
        if (!wizardData.personal.email.trim()) errors.email = 'Email requerido';
        if (!wizardData.personal.birthDate.trim()) errors.birthDate = 'Fecha de nacimiento requerida';
        if (!wizardData.personal.phone.trim()) errors.phone = 'Teléfono requerido';
        if (!wizardData.personal.gender.trim()) errors.gender = 'Género requerido';
        if (!wizardData.personal.password.trim()) errors.password = 'Contraseña requerida';
        if (!wizardData.personal.confirmPassword.trim()) errors.confirmPassword = 'Confirmar contraseña requerida';
        
        // Validación de contraseñas
        if (wizardData.personal.password && wizardData.personal.confirmPassword) {
          if (wizardData.personal.password !== wizardData.personal.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
          }
          if (wizardData.personal.password.length < 8) {
            errors.password = 'La contraseña debe tener al menos 8 caracteres';
          }
        }
        break;

      case WizardStep.PROFESSIONAL_DATA:
        // Campos obligatorios del paso profesional
        if (!wizardData.professional.professionalTitle.trim()) errors.professionalTitle = 'Título profesional requerido';
        if (!wizardData.professional.specialty.trim()) errors.specialty = 'Especialidad requerida';
        if (!wizardData.professional.university.trim()) errors.university = 'Universidad requerida';
        if (!wizardData.professional.licenseNumber.trim()) errors.licenseNumber = 'Número de licencia requerido';
        if (!wizardData.professional.experienceYears.trim()) errors.experienceYears = 'Años de experiencia requeridos';
        break;

      case WizardStep.LOCATION_DATA:
        // Campos obligatorios del paso ubicación
        if (!wizardData.location.country.trim()) errors.country = 'País requerido';
        if (!wizardData.location.province.trim()) errors.province = 'Provincia requerida';
        if (!wizardData.location.city.trim()) errors.city = 'Ciudad requerida';
        if (!wizardData.location.consentGDPR) errors.consentGDPR = 'Debe aceptar los términos y condiciones';
        if (!wizardData.location.consentHIPAA) errors.consentHIPAA = 'Debe aceptar la política de privacidad';
        break;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }, [wizardData]);

  // Navegación entre pasos
  const nextStep = useCallback(() => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    if (currentStep < WizardStep.LOCATION_DATA) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > WizardStep.PERSONAL_DATA) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Actualizar datos del wizard
  const updateWizardData = useCallback((step: WizardStep, field: string, value: string | boolean) => {
    setWizardData(prev => ({
      ...prev,
      [step === WizardStep.PERSONAL_DATA ? 'personal' : 
       step === WizardStep.PROFESSIONAL_DATA ? 'professional' : 'location']: {
        ...prev[step === WizardStep.PERSONAL_DATA ? 'personal' : 
               step === WizardStep.PROFESSIONAL_DATA ? 'professional' : 'location'],
        [field]: value
      }
    }));
  }, []);

  // Handler para cambios de campo
  const handleFieldChange = useCallback((field: string, value: string | boolean) => {
    updateWizardData(currentStep, field, value);
  }, [currentStep, updateWizardData]);

  // Handler para recibir datos de geolocalización del PersonalDataStep
  const handleLocationDetected = useCallback((location: GeolocationData) => {
    setLocationData(location);
  }, []);

  // Finalizar wizard con registro real
  const handleSubmit = useCallback(async () => {
    console.log('Datos del wizard:', wizardData);
    console.log('Datos de ubicación:', locationData);
    
    try {
      // Registrar profesional en el sistema
      const registrationData = {
        email: wizardData.personal.email,
        displayName: `${wizardData.personal.firstName} ${wizardData.personal.lastName}`,
        professionalTitle: wizardData.professional.professionalTitle,
        specialty: wizardData.professional.specialty,
        country: wizardData.location.country,
        city: wizardData.location.city,
        province: wizardData.location.province,
        phone: wizardData.personal.phone,
        licenseNumber: wizardData.professional.licenseNumber,
        registrationDate: new Date()
      };

      const result = await emailActivationService.registerProfessional(registrationData);
      
      if (result.success) {
        // Mostrar modal de éxito con información de activación
        setShowSuccessModal(true);
        setRegistrationResult(result);
      } else {
        // Mostrar error
        alert(`Error en el registro: ${result.message}`);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      alert('Error interno del sistema. Inténtalo de nuevo.');
    }
  }, [wizardData, locationData]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message: string; professionalId?: string; activationToken?: string } | null>(null);

  const handleCompleteRegistration = () => {
    setShowSuccessModal(false);
    // NO navegar al dashboard - el usuario debe activar su cuenta primero
    navigate('/login');
  };

  // Renderizar paso actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case WizardStep.PERSONAL_DATA:
        return (
          <PersonalDataStep
            data={wizardData.personal}
            errors={errors}
            onFieldChange={handleFieldChange}
            onLocationDetected={handleLocationDetected}
          />
        );

      case WizardStep.PROFESSIONAL_DATA:
        return (
          <ProfessionalDataStep
            data={wizardData.professional}
            errors={errors}
            onFieldChange={handleFieldChange}
          />
        );

      case WizardStep.LOCATION_DATA:
        return (
          <LocationDataStep
            data={wizardData.location}
            errors={errors}
            onFieldChange={handleFieldChange}
            onValidation={validateStep}
            locationData={locationData}
          />
        );

      default:
        return null;
    }
  };

  const isStepValid = validateStep(currentStep).isValid;

  return (
    <div className="bg-white flex items-center justify-center py-2 px-4 h-screen overflow-hidden">
      <div className="w-full max-w-lg max-h-full overflow-y-auto">
        {/* Header Apple-style */}
        <div className="text-center space-y-3 mb-6">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">
            Bienvenido a{' '}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
              AiDuxCare
            </span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed font-light">
            Ficha médica electrónica asistida por AI.<br/>
            Menos papeleo, más seguridad, más tiempo.
          </p>
        </div>

        {/* Contenido del paso Apple-style */}
        <div className="space-y-3">
          {renderCurrentStep()}
        </div>

        {/* Navegación Apple-style */}
        <div className="flex space-x-4 pt-4">
          {currentStep !== WizardStep.PERSONAL_DATA && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 px-6 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 text-base font-medium"
            >
              Anterior
            </button>
          )}
          <button
            onClick={currentStep === WizardStep.LOCATION_DATA ? handleSubmit : nextStep}
            className="flex-1 py-3 px-6 border border-transparent text-white rounded-lg bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base font-medium"
            disabled={!isStepValid}
          >
            {currentStep === WizardStep.LOCATION_DATA ? 'Completar Registro' : 'Siguiente'}
          </button>
        </div>
      </div>

      {/* Modal de Éxito Apple-style */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-50">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">
                  Registro Completado
                </h2>
                <p className="text-gray-500 text-sm">
                  Tu cuenta ha sido creada y está pendiente de activación.
                </p>
              </div>
            </div>

            {/* Instrucciones de Verificación Apple-style */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Verificación de Email Requerida
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Para completar tu registro y activar tu cuenta:
              </p>
              <ul className="text-gray-500 text-sm space-y-1">
                <li>• Revisar tu bandeja de entrada (y carpeta de spam)</li>
                <li>• Hacer clic en el enlace de verificación enviado a tu email</li>
                <li>• Confirmar tu dirección de email</li>
                <li>• Iniciar sesión con tus credenciales</li>
              </ul>
              
              {registrationResult && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-xs">
                    <span className="font-medium">Email enviado a:</span> {wizardData.personal.email}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-2 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 text-sm font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={handleCompleteRegistration}
                className="flex-1 py-2 px-4 border border-transparent text-white rounded-lg bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 text-sm font-medium"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 