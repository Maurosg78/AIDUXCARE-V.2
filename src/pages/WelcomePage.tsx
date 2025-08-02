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

  // Datos del wizard según el .md
  const [wizardData, setWizardData] = useState<WizardData>({
    personal: {
      firstName: 'Mauricio',
      lastName: 'Sobarzo',
      birthDate: '1985-03-15',
      email: 'msobarzo78@gmail.com',
      phone: '+34 600 000 000',
      gender: 'masculino',
      password: 'aidux2025',
      confirmPassword: 'aidux2025'
    },
    professional: {
      professionalTitle: 'FT',
      specialty: 'fisioterapia',
      university: 'Universidad Complutense de Madrid',
      licenseNumber: 'FT-12345',
      workplace: 'Clínica Privada',
      experienceYears: '8'
    },
    location: {
      country: 'España',
      province: 'Madrid',
      city: 'Madrid',
      consentGDPR: false,
      consentHIPAA: false
    }
  });

  // Validación de paso específico
  const validateStep = useCallback((step: WizardStep): ValidationResult => {
    const errors: Record<string, string> = {};

    switch (step) {
      case WizardStep.PERSONAL_DATA:
        if (!wizardData.personal.firstName.trim()) errors.firstName = 'Nombre requerido';
        if (!wizardData.personal.lastName.trim()) errors.lastName = 'Apellido requerido';
        if (!wizardData.personal.email.trim()) errors.email = 'Email requerido';
        break;

      case WizardStep.PROFESSIONAL_DATA:
        if (!wizardData.professional.professionalTitle.trim()) errors.professionalTitle = 'Título profesional requerido';
        if (!wizardData.professional.specialty.trim()) errors.specialty = 'Especialidad requerida';
        break;

      case WizardStep.LOCATION_DATA:
        if (!wizardData.location.country.trim()) errors.country = 'País requerido';
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
    navigate('/professional-workflow');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="wizard-card">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Bienvenido a{' '}
            <span className="aiduxcare-gradient">AiDuxCare</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Ficha médica electrónica asistida por AI.<br/>
            Menos papeleo, más seguridad, más tiempo.
          </p>
          {/* Indicador progreso del .md */}
          <div className="flex items-center justify-center mt-6">
            <div className="progress-indicator">
              {currentStep}/3
            </div>
            <span className="ml-3 text-gray-600">
              Paso {currentStep} de 3
            </span>
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="wizard-step">
          {renderCurrentStep()}
        </div>

        {/* Navegación */}
        <div className="flex space-x-4">
          {currentStep !== WizardStep.PERSONAL_DATA && (
            <button
              onClick={prevStep}
              className="secondary-button w-full"
            >
              Anterior
            </button>
          )}
          <button
            onClick={currentStep === WizardStep.LOCATION_DATA ? handleSubmit : nextStep}
            className="primary-button w-full"
            disabled={!isStepValid}
          >
            {currentStep === WizardStep.LOCATION_DATA ? 'Completar Registro' : 'Siguiente'}
          </button>
        </div>
      </div>

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Registro Completado Exitosamente!
              </h2>
              <p className="text-gray-600">
                Bienvenido a AiDuxCare. Tu cuenta ha sido creada y está pendiente de activación.
              </p>
            </div>

            {/* Instrucciones de Verificación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                📧 Verificación de Email Requerida
              </h3>
              <p className="text-blue-800 mb-3">
                Para completar tu registro y activar tu cuenta, debes:
              </p>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• Revisar tu bandeja de entrada (y carpeta de spam)</li>
                <li>• Hacer clic en el enlace de verificación enviado a tu email</li>
                <li>• Confirmar tu dirección de email</li>
                <li>• Iniciar sesión con tus credenciales</li>
              </ul>
              
              {registrationResult && (
                <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                  <p className="text-green-800 text-xs">
                    <strong>Email enviado a:</strong> {wizardData.personal.email}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleCompleteRegistration}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continuar al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 