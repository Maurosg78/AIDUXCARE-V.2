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
import { Gender, WizardStep, ValidationResult } from '../types/wizard';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { GeolocationData } from '../services/geolocationService';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedLocationData, setDetectedLocationData] = useState<GeolocationData | null>(null);

  // Función para manejar ubicación detectada
  const handleLocationDetected = useCallback((locationData: GeolocationData) => {
    setDetectedLocationData(locationData);
    
    // Mapear país a código correcto
    const countryMapping: Record<string, string> = {
      'España': 'es',
      'Spain': 'es',
      'México': 'mx',
      'Mexico': 'mx',
      'Argentina': 'ar',
      'Colombia': 'co',
      'Chile': 'cl',
      'Perú': 'pe',
      'Peru': 'pe',
      'Estados Unidos': 'us',
      'United States': 'us'
    };
    
    // Mapear provincia a valor del dropdown
    const provinceMapping: Record<string, string> = {
      'Comunidad Valenciana': 'valencia',
      'Valencia': 'valencia',
      'Madrid': 'madrid',
      'Barcelona': 'barcelona',
      'Andalucía': 'andalucia',
      'Cataluña': 'cataluna',
      'Galicia': 'galicia',
      'Castilla y León': 'castilla-leon',
      'Castilla-La Mancha': 'castilla-mancha',
      'País Vasco': 'pais-vasco',
      'Aragón': 'aragon',
      'Asturias': 'asturias',
      'Cantabria': 'cantabria',
      'La Rioja': 'la-rioja',
      'Navarra': 'navarra',
      'Extremadura': 'extremadura',
      'Murcia': 'murcia',
      'Islas Baleares': 'islas-baleares',
      'Islas Canarias': 'islas-canarias',
      'Ceuta': 'ceuta',
      'Melilla': 'melilla'
    };
    
    const countryCode = countryMapping[locationData.country || ''] || locationData.country || '';
    const provinceCode = provinceMapping[locationData.region || ''] || locationData.region || '';
    
    setWizardData((prev: typeof wizardData) => {
      const newLocation = {
        ...prev.location,
        country: countryCode,
        province: provinceCode,
        city: locationData.city || prev.location.city
      };
      
      return {
        ...prev,
        location: newLocation
      };
    });
  }, []);

  // Manejador optimizado para cambios de campos
  const handleFieldChange = useCallback((field: string, value: string | boolean) => {
    setWizardData((prev: typeof wizardData) => {
      const newData = {
        ...prev,
        personal: {
          ...prev.personal,
          [field]: value
        }
      };
      
      // Guardar en localStorage para persistencia
      try {
        localStorage.setItem('aiduxcare-wizard-data', JSON.stringify(newData));
      } catch (error) {
        console.error('WelcomePage - Error al guardar en localStorage:', error);
      }
      
      return newData;
    });
  }, []); // Sin dependencias para evitar re-creación

  // Datos del wizard como estado - con persistencia local
  const [wizardData, setWizardData] = useState(() => {
    // LIMPIAR DATOS DE PRUEBA DEL LOCALSTORAGE POR SEGURIDAD
    try {
      localStorage.removeItem('aiduxcare-wizard-data');
      console.log('WelcomePage - Datos de prueba eliminados del localStorage por seguridad');
    } catch (error) {
      console.error('WelcomePage - Error al limpiar localStorage:', error);
    }
    
    // Estado inicial por defecto - SIN DATOS SENSIBLES
    const defaultData = {
      personal: {
        firstName: '',
        secondName: '',
        lastName: '',
        secondLastName: '',
        email: '',
        phone: '',
        phoneCountryCode: '+34',
        birthDate: '',
        gender: '' as Gender,
        password: '',
        confirmPassword: ''
      },
      professional: {
        professionalTitle: '',
        specialty: '',
        licenseNumber: '',
        university: '',
        experienceYears: '',
        workplace: ''
      },
      location: {
        country: '',
        province: '',
        city: '',
        consentGDPR: false,
        consentHIPAA: false
      }
    };
    
    return defaultData;
  });

  // Validación de paso específico
  const validateStep = useCallback((step: number): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1: // Personal Data
        if (!wizardData.personal.firstName.trim()) errors.firstName = 'Primer nombre requerido';
        if (!wizardData.personal.lastName.trim()) errors.lastName = 'Apellido requerido';
        if (!wizardData.personal.email.trim()) errors.email = 'Email requerido';
        break;

      case 2: // Professional Data
        if (!wizardData.professional.professionalTitle.trim()) errors.professionalTitle = 'Título profesional requerido';
        if (!wizardData.professional.specialty.trim()) errors.specialty = 'Especialidad requerida';
        if (!wizardData.professional.licenseNumber.trim()) errors.licenseNumber = 'Número de licencia requerido';
        break;

      case 3: // Location Data
        if (!wizardData.location.country.trim()) errors.country = 'País requerido';
        if (!wizardData.location.province.trim()) errors.province = 'Provincia requerida';
        if (!wizardData.location.city.trim()) errors.city = 'Ciudad requerida';
        break;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }, [wizardData]);

  const isStepValid = validateStep(currentStep).isValid;

  const nextStep = useCallback(() => {
    setErrors({});
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('=== INICIO DE REGISTRO ===');
      
      // VERIFICACIÓN CRÍTICA: Asegurar que estamos usando UAT
      if (import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'aiduxcare-mvp-uat') {
        console.error('❌ ERROR CRÍTICO: No estamos usando UAT!');
        console.error('Proyecto actual:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
        setErrors({ general: 'Error de configuración: Debe usar UAT para desarrollo' });
        return;
      }
      
      console.log('✅ CONFIGURACIÓN CORRECTA: Usando UAT');
      console.log('Proyecto Firebase:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
      
      // Validar que todos los datos estén presentes
      const allDataPresent = wizardData.personal && wizardData.professional && wizardData.location;
      console.log('¿Todos los datos están presentes?', allDataPresent);
      
      if (!allDataPresent) {
        console.error('Faltan datos en el wizard');
        setErrors({ general: 'Por favor completa todos los campos requeridos' });
        return;
      }

      // Validar consentimientos legales
      if (!wizardData.location.consentGDPR || !wizardData.location.consentHIPAA) {
        console.error('Faltan consentimientos legales');
        setErrors({ general: 'Debes aceptar todos los consentimientos legales' });
        return;
      }

      // Generar contraseña temporal segura
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
      
      console.log('Procediendo directamente con registro en Firebase Auth...');
      console.log('Registrando usuario en Firebase Auth...');
      
      // Registrar usuario en Firebase Auth (Firebase manejará la verificación)
      const authResult = await firebaseAuthService.register({
        email: wizardData.personal.email,
        password: tempPassword
      });

      if (!authResult.success) {
        console.error('Error en registro de Firebase:', authResult.message);
        
        // Mensajes de error más específicos
        let errorMessage = authResult.message;
        if (authResult.message.includes('email-already-in-use')) {
          errorMessage = 'Este email ya está registrado. Por favor, intenta iniciar sesión o usa un email diferente.';
        } else if (authResult.message.includes('weak-password')) {
          errorMessage = 'La contraseña es demasiado débil. Usa al menos 6 caracteres.';
        } else if (authResult.message.includes('invalid-email')) {
          errorMessage = 'El formato del email no es válido.';
        }
        
        setErrors({ general: errorMessage });
        return;
      }

      console.log('Usuario registrado exitosamente en Firebase Auth');

      // Crear objeto de registro profesional
      const professionalData = {
        fullName: `${wizardData.personal.firstName} ${wizardData.personal.lastName}`,
        email: wizardData.personal.email,
        phone: wizardData.personal.phone,
        professionalTitle: wizardData.professional.professionalTitle,
        specialty: wizardData.professional.specialty,
        licenseNumber: wizardData.professional.licenseNumber,
        university: wizardData.professional.university,
        experienceYears: wizardData.professional.experienceYears,
        workplace: wizardData.professional.workplace,
        country: wizardData.location.country,
        province: wizardData.location.province,
        city: wizardData.location.city,
        consentGranted: true
      };

      console.log('=== DATOS FINALES PARA REGISTRO ===');
      console.log('Datos profesionales completos:', professionalData);
      console.log('Nombre completo:', professionalData.fullName);
      console.log('Email para registro:', professionalData.email);
      console.log('Especialidad:', professionalData.specialty);
      console.log('Ubicación:', `${professionalData.city}, ${professionalData.province}, ${professionalData.country}`);

      // Navegar a página de éxito de registro
      console.log('Registro exitoso - Redirigiendo a página de éxito');
      navigate('/registration-success', { 
        state: { 
          email: wizardData.personal.email,
          fullName: professionalData.fullName,
          specialty: professionalData.specialty,
          location: `${professionalData.city}, ${professionalData.province}, ${professionalData.country}`
        } 
      });

    } catch (error) {
      console.error('Error al registrar usuario:', error);
      setErrors({ general: 'Error al registrar usuario. Por favor intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDataStep
            data={wizardData.personal}
            errors={errors}
            onFieldChange={handleFieldChange}
            onLocationDetected={handleLocationDetected}
          />
        );

      case 2:
        return (
          <ProfessionalDataStep
            data={wizardData.professional}
            errors={errors}
            onFieldChange={(field: string, value: string | boolean) => {
              setWizardData((prev: typeof wizardData) => ({
                ...prev,
                professional: {
                  ...prev.professional,
                  [field]: value
                }
              }));
            }}
          />
        );

      case 3:
        return (
          <LocationDataStep
            data={wizardData.location}
            errors={errors}
            onFieldChange={(field: string, value: string | boolean) => {
              setWizardData((prev: typeof wizardData) => ({
                ...prev,
                location: {
                  ...prev.location,
                  [field]: value
                }
              }));
            }}
            onValidation={(step: WizardStep): ValidationResult => {
              const validation = validateStep(step);
              return validation;
            }}
            locationData={detectedLocationData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenido a AiDuxCare
          </h1>
          <p className="text-xl text-gray-600">
            Complete su perfil profesional para comenzar
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Paso {currentStep} de 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Mostrar errores generales */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error en el registro
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errors.general}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="flex space-x-4">
          {currentStep !== 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 text-base font-medium"
            >
              Anterior
            </button>
          )}
          <button
            onClick={currentStep === 3 ? handleSubmit : nextStep}
            className="flex-1 py-3 px-6 border border-transparent text-white rounded-lg bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base font-medium"
            disabled={!isStepValid || isSubmitting}
          >
            {currentStep === 3 ? (isSubmitting ? 'Enviando...' : 'Completar') : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}; 