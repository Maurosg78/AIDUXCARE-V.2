/**
 * 🏥 Professional Onboarding Page - Formulario Limpio de Captura Profesional
 * Cumple HIPAA/GDPR: Consentimiento explícito, auditoría completa, cifrado de datos sensibles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { app } from '../core/firebase/firebaseClient';
import { geolocationService, ComplianceConfig } from '../services/GeolocationService';
import { professionalServicesService, ServiceAvailability } from '../services/ProfessionalServicesService';
import { professionalProfileService } from '../services/ProfessionalProfileService';
import { emailVerificationService } from '../services/EmailVerificationService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export const ProfessionalOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [complianceConfig, setComplianceConfig] = useState<ComplianceConfig | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<ServiceAvailability[]>([]);

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Información Personal
    firstName: '',
    secondName: '',
    lastName: '',
    secondLastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseIssueDate: '',
    licenseRenewalType: 'annual' as 'annual' | 'biennial' | 'other',
    licenseRenewalPeriod: 12, // meses
    country: '',
    state: '',
    city: '',
    licenseExpiryNotification: false,

    // Paso 2: Información Profesional (SIMPLIFICADO)
    profession: '', // Dropdown con todas las profesiones de la salud
    specialty: '', // Campo de texto libre para especialidad
    certifications: '', // Campo de texto libre para certificaciones
    yearsOfExperience: 0,

    // Paso 3: Compliance y Seguridad
    hipaaConsent: false,
    gdprConsent: false,
    dataProcessingConsent: false,
    auditTrailEnabled: true,
    mfaEnabled: true,
    licenseNotifications: true,
    latamConsent: false, // Nuevo campo para el consentimiento de regulaciones latinoamericanas
    canadaConsent: false, // Nuevo campo para el consentimiento de regulaciones canadienses
    pipedaConsent: false // Nuevo campo para el consentimiento de PIPEDA
  });

  // Pasos del onboarding
  const steps: OnboardingStep[] = [
    {
      id: 'personal',
      title: 'Información Personal',
      description: 'Datos básicos y licencia profesional',
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'professional',
      title: 'Información Profesional',
      description: 'Profesión, especialidad y certificaciones',
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'compliance',
      title: 'Compliance y Seguridad',
      description: 'Consentimientos y configuración de seguridad',
      isCompleted: false,
      isRequired: true
    }
  ];

  // Verificar si el usuario ya tiene un perfil
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const user = getAuth(app).currentUser;
        
        if (user) {
          // Por ahora, solo verificamos que el usuario esté autenticado
          // En una implementación real, verificaríamos si ya tiene perfil
          console.log('Usuario autenticado:', user.uid);
        }
      } catch (error) {
        console.error('Error verificando perfil existente:', error);
      }
    };

    checkExistingProfile();
  }, [navigate]);

  // Detectar ubicación, regulaciones y servicios disponibles al cargar el componente
  useEffect(() => {
    const detectLocationAndServices = async () => {
      try {
        setLocationLoading(true);
        
        // Detectar ubicación y regulaciones
        const config = await geolocationService.getRelevantRegulations();
        setComplianceConfig(config);
        
        // Obtener servicios disponibles para la ubicación
        if (config.detectedLocation?.isDetected) {
          const services = professionalServicesService.getAvailableServices(
            config.detectedLocation.countryCode
          );
          setAvailableServices(services);
        }
        
        console.log('🌍 Ubicación detectada:', config.detectedLocation);
        console.log('📋 Regulaciones relevantes:', config.regulations.map(r => r.name));
        console.log('🏥 Servicios disponibles:', availableServices.length);
        
      } catch (error) {
        console.error('Error detectando ubicación:', error);
        // Fallback: mostrar todas las regulaciones
        setComplianceConfig({
          regulations: [],
          showAllRegulations: true,
          detectedLocation: null
        });
      } finally {
        setLocationLoading(false);
      }
    };

    detectLocationAndServices();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsLoading(true);
    setError('');

    try {
      const user = getAuth(app).currentUser;
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      // Crear perfil profesional en Firebase Firestore
      const profileData = {
        personalInfo: {
          firstName: formData.firstName,
          secondName: formData.secondName,
          lastName: formData.lastName,
          secondLastName: formData.secondLastName,
          email: formData.email,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
          country: formData.country,
          licenseRenewalType: formData.licenseRenewalType,
          licenseExpiryNotification: formData.licenseExpiryNotification
        },
        professionalInfo: {
          profession: formData.profession,
          specialty: formData.specialty,
          certifications: formData.certifications,
          yearsOfExperience: formData.yearsOfExperience
        },
        complianceInfo: {
          hipaaConsent: formData.hipaaConsent,
          gdprConsent: formData.gdprConsent,
          dataProcessingConsent: formData.dataProcessingConsent,
          auditTrailEnabled: formData.auditTrailEnabled,
          mfaEnabled: formData.mfaEnabled,
          licenseNotifications: formData.licenseNotifications,
          latamConsent: formData.latamConsent,
          canadaConsent: formData.canadaConsent,
          pipedaConsent: formData.pipedaConsent
        }
      };

      await professionalProfileService.createOrUpdateProfile(user.uid, profileData);
      
      console.log('Perfil profesional guardado exitosamente en Firebase Firestore');

      // Generar token de verificación y enviar email
      const verificationToken = emailVerificationService.generateVerificationToken();
      const verificationUrl = emailVerificationService.generateVerificationUrl(verificationToken, formData.email);
      
      const welcomeEmailData = {
        email: formData.email,
        professionalName: `${formData.firstName} ${formData.lastName}`,
        profession: formData.profession,
        verificationUrl: verificationUrl
      };

      // Enviar email de bienvenida (simulado en desarrollo)
      const emailSent = await emailVerificationService.simulateWelcomeEmail(welcomeEmailData);
      
      if (emailSent) {
        console.log('Email de bienvenida enviado exitosamente');
        
        // Redirigir a la página de confirmación
        navigate(`/onboarding-confirmation?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError('Error enviando email de verificación. El perfil se creó correctamente.');
      }

    } catch (error) {
      console.error('Error creando perfil:', error);
      setError('Error al crear el perfil profesional. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep formData={formData} onInputChange={handleInputChange} />;
      case 1:
        return <ProfessionalInfoStep 
          formData={formData} 
          onInputChange={handleInputChange} 
        />;
      case 2:
        return <ComplianceStep 
          formData={formData} 
          onInputChange={handleInputChange} 
          complianceConfig={complianceConfig}
          locationLoading={locationLoading}
        />;
      default:
        return null;
    }
  };

  const renderContextualFeature = () => {
    switch (currentStep) {
      case 0: // Información Personal
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-purple-900 mb-2">Compliance Médico</h4>
            <p className="text-sm text-purple-700 mb-3">Tus datos personales están protegidos bajo estándares HIPAA/GDPR para uso clínico seguro</p>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600">🔒 Cifrado end-to-end</p>
              <p className="text-xs text-purple-600">📋 Auditoría completa</p>
              <p className="text-xs text-purple-600">🛡️ Consentimiento explícito</p>
            </div>
          </div>
        );
      case 1: // Información Profesional
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-blue-900 mb-2">Evaluación Inteligente</h4>
            <p className="text-sm text-blue-700 mb-3">Tests clínicos especializados según tu área de expertise y especialización</p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600">🎯 Tests específicos por especialidad</p>
              <p className="text-xs text-blue-600">📊 Análisis biomecánico avanzado</p>
              <p className="text-xs text-blue-600">🔍 Detección de banderas rojas</p>
            </div>
          </div>
        );
      case 2: // Perfilamiento
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-green-900 mb-2">Documentación SOAP</h4>
            <p className="text-sm text-green-700 mb-3">Generación automática de documentos clínicos oficiales basados en tu perfil</p>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">📝 SOAP automático</p>
              <p className="text-xs text-green-600">🏥 Terminología médica</p>
              <p className="text-xs text-green-600">⚡ Ahorro de tiempo</p>
            </div>
          </div>
        );
      case 3: // Certificaciones
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-orange-900 mb-2">Gestión de Credenciales</h4>
            <p className="text-sm text-orange-700 mb-3">Verificación automática y gestión de certificaciones profesionales</p>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-600">✅ Verificación automática</p>
              <p className="text-xs text-orange-600">📅 Recordatorios de vencimiento</p>
              <p className="text-xs text-orange-600">🔗 Integración con autoridades</p>
            </div>
          </div>
        );
      case 4: // Preferencias
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-indigo-900 mb-2">Personalización IA</h4>
            <p className="text-sm text-indigo-700 mb-3">Adaptación inteligente a tu estilo de evaluación y documentación</p>
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs text-indigo-600">🧠 Aprendizaje automático</p>
              <p className="text-xs text-indigo-600">🎨 Adaptación al estilo</p>
              <p className="text-xs text-indigo-600">📈 Mejora continua</p>
            </div>
          </div>
        );
      case 5: // Compliance
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-red-900 mb-2">Seguridad Total</h4>
            <p className="text-sm text-red-700 mb-3">Auditoría completa y protección total de datos médicos</p>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600">🔐 MFA obligatorio</p>
              <p className="text-xs text-red-600">📊 Auditoría en tiempo real</p>
              <p className="text-xs text-red-600">🚨 Alertas de seguridad</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Calcular progreso real basado en campos completados
  const calculateProgress = () => {
    let completedFields = 0;
    let totalRequiredFields = 0;

    // Paso 1: Información Personal
    const personalFields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.licenseNumber,
      formData.licenseIssueDate,
      formData.country
    ];
    totalRequiredFields += personalFields.length;
    completedFields += personalFields.filter(field => field && field.toString().trim() !== '').length;

    // Paso 2: Información Profesional
    const professionalFields = [
      formData.profession,
      formData.yearsOfExperience
    ];
    totalRequiredFields += professionalFields.length;
    completedFields += professionalFields.filter(field => {
      if (field === formData.yearsOfExperience) {
        return field && field.toString().trim() !== '';
      }
      return field && field.toString().trim() !== '';
    }).length;

    // Paso 3: Compliance
    const complianceFields = [
      formData.hipaaConsent,
      formData.gdprConsent,
      formData.dataProcessingConsent,
      formData.latamConsent, // Nuevo campo para el consentimiento de regulaciones latinoamericanas
      formData.canadaConsent, // Nuevo campo para el consentimiento de regulaciones canadienses
      formData.pipedaConsent // Nuevo campo para el consentimiento de PIPEDA
    ];
    totalRequiredFields += complianceFields.length;
    completedFields += complianceFields.filter(field => field === true).length;

    return Math.round((completedFields / totalRequiredFields) * 100);
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'personal':
        return !!(formData.firstName && formData.lastName && formData.email && 
                 formData.licenseNumber && formData.country && 
                 formData.licenseRenewalType);
      case 'professional':
        return !!(formData.profession && formData.yearsOfExperience && formData.yearsOfExperience.toString().trim() !== '');
      case 'compliance':
        return !!(formData.gdprConsent && formData.dataProcessingConsent);
      default:
        return false;
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mínimo */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Configuración Profesional AiDuxCare
              </h1>
              <p className="text-gray-600 mt-1">
                Configura tu perfil profesional para una experiencia personalizada
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Paso {currentStep + 1} de {steps.length}</div>
              <div className="text-lg font-semibold text-blue-600">
                {calculateProgress()}% Completado
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal con Layout de 2 Columnas */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal - Formulario */}
          <div className="lg:col-span-2">
            {/* Indicador de Progreso */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium ${
                      index <= currentStep
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Información del Paso Actual */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Contenido del Paso */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              {renderStepContent()}
            </div>

            {/* Navegación */}
            <div className="flex justify-between">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
                className={`px-6 py-2 rounded-lg font-medium ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Anterior
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isLoading}
                  className={`px-8 py-2 rounded-lg font-medium ${
                    !canProceed() || isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Completando...' : 'Completar Configuración'}
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    !canProceed()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Siguiente
                </button>
              )}
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Columna Lateral - Característica Contextual */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  🏥 ¿Por qué AiDuxCare?
                </h3>
                {renderContextualFeature()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Componentes de pasos individuales
const PersonalInfoStep: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Nombres */}
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
          Primer Nombre *
        </label>
        <input
          type="text"
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="secondName" className="block text-sm font-medium text-gray-700 mb-2">
          Segundo Nombre
        </label>
        <input
          type="text"
          id="secondName"
          value={formData.secondName}
          onChange={(e) => onInputChange('secondName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Apellidos */}
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
          Primer Apellido *
        </label>
        <input
          type="text"
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="secondLastName" className="block text-sm font-medium text-gray-700 mb-2">
          Segundo Apellido
        </label>
        <input
          type="text"
          id="secondLastName"
          value={formData.secondLastName}
          onChange={(e) => onInputChange('secondLastName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Contacto */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Licencia */}
      <div>
        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Número de Licencia/Colegiado *
        </label>
        <input
          type="text"
          id="licenseNumber"
          value={formData.licenseNumber}
          onChange={(e) => onInputChange('licenseNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: 12345-67890 o COL-12345"
          required
        />
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
          País de Licencia *
        </label>
        <select
          id="country"
          value={formData.country}
          onChange={(e) => onInputChange('country', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Selecciona un país</option>
          <option value="ES">España</option>
          <option value="MX">México</option>
          <option value="AR">Argentina</option>
          <option value="CO">Colombia</option>
          <option value="PE">Perú</option>
          <option value="CL">Chile</option>
          <option value="VE">Venezuela</option>
          <option value="EC">Ecuador</option>
          <option value="BO">Bolivia</option>
          <option value="PY">Paraguay</option>
          <option value="UY">Uruguay</option>
          <option value="GT">Guatemala</option>
          <option value="SV">El Salvador</option>
          <option value="HN">Honduras</option>
          <option value="NI">Nicaragua</option>
          <option value="CR">Costa Rica</option>
          <option value="PA">Panamá</option>
          <option value="CU">Cuba</option>
          <option value="DO">República Dominicana</option>
          <option value="PR">Puerto Rico</option>
          <option value="US">Estados Unidos</option>
          <option value="CA">Canadá</option>
          <option value="OTHER">Otro</option>
        </select>
      </div>



      {/* Tipo de Renovación */}
      <div>
        <label htmlFor="licenseRenewalType" className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Renovación de Licencia *
        </label>
        <select
          id="licenseRenewalType"
          value={formData.licenseRenewalType}
          onChange={(e) => onInputChange('licenseRenewalType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="annual">Anual</option>
          <option value="biennial">Bienal</option>
          <option value="other">Otro</option>
        </select>
      </div>

      {/* Notificación de Vencimiento */}
      <div className="col-span-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="licenseExpiryNotification"
            checked={formData.licenseExpiryNotification}
            onChange={(e) => onInputChange('licenseExpiryNotification', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="licenseExpiryNotification" className="ml-2 block text-sm text-gray-700">
            Recibir notificaciones cuando mi licencia esté próxima a vencer
          </label>
        </div>
      </div>
    </div>

    {/* Notificación de Licencia */}
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h4 className="text-sm font-medium text-blue-800">Notificaciones de Licencia</h4>
          <p className="text-sm text-blue-700 mt-1">
            Te enviaremos una notificación 30 días antes del vencimiento de tu licencia para que puedas renovarla a tiempo.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ProfessionalInfoStep: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => {
  // Lista de profesiones de la salud ordenadas alfabéticamente
  const healthProfessions = [
    'Bioquímico/a',
    'Enfermero/a',
    'Farmacéutico/a',
    'Fisioterapeuta',
    'Kinesiólogo/a',
    'Médico/a',
    'Nutricionista',
    'Odontólogo/a',
    'Optometrista',
    'Psicólogo/a',
    'Químico Farmacéutico/a',
    'Técnico en Radiología',
    'Terapeuta Ocupacional',
    'Trabajador/a Social'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Profesional</h3>
      <p className="text-gray-600 mb-4">
        Completa tu información profesional para personalizar tu experiencia en AiDuxCare.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-blue-900 mb-2">🎯 Personalización Inteligente</h4>
        <p className="text-sm text-blue-700">
          Esta información nos ayudará a adaptar las evaluaciones y tratamientos a tu especialidad.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
            Profesión de la Salud *
          </label>
          <select
            id="profession"
            value={formData.profession}
            onChange={(e) => onInputChange('profession', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecciona tu profesión</option>
            {healthProfessions.map((profession) => (
              <option key={profession} value={profession}>
                {profession}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
            Especialidad
          </label>
          <input
            type="text"
            id="specialty"
            value={formData.specialty}
            onChange={(e) => onInputChange('specialty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Cardiología, Pediatría, Fisioterapia Deportiva, Psicología Clínica..."
          />
        </div>

        <div>
          <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
            Certificaciones
          </label>
          <textarea
            id="certifications"
            value={formData.certifications}
            onChange={(e) => onInputChange('certifications', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Lista tus certificaciones, cursos especializados, o credenciales relevantes..."
          />
        </div>

        <div>
          <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
            Años de Experiencia *
          </label>
          <input
            type="text"
            id="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={(e) => onInputChange('yearsOfExperience', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 5 años, 10+ años, 2 años en pediatría..."
            required
          />
        </div>


      </div>
    </div>
  );
};

const ComplianceStep: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInputChange: (field: string, value: any) => void;
  complianceConfig: ComplianceConfig | null;
  locationLoading: boolean;
}> = ({ formData, onInputChange, complianceConfig, locationLoading }) => {
  const renderComplianceContent = () => {
    if (locationLoading) {
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Detectando tu ubicación para mostrar las regulaciones relevantes...</p>
          </div>
        </div>
      );
    }

    if (!complianceConfig) {
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <p className="text-gray-600">No se pudo detectar tu ubicación. Mostrando regulaciones generales.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Información de ubicación detectada */}
        {complianceConfig.detectedLocation?.isDetected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">🌍</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">
                  Ubicación detectada: {complianceConfig.detectedLocation.country}
                </h4>
                <p className="text-xs text-blue-700">
                  {complianceConfig.detectedLocation.city && `${complianceConfig.detectedLocation.city}, `}
                  {complianceConfig.detectedLocation.region && `${complianceConfig.detectedLocation.region}, `}
                  {complianceConfig.detectedLocation.country}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Regulaciones relevantes */}
        {complianceConfig.regulations.map((regulation) => (
          <div key={regulation.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm font-bold">
                  {regulation.countries[0]}
                </span>
              </div>
              <h4 className="text-base font-semibold text-gray-900">{regulation.name}</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {regulation.description}
            </p>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id={`${regulation.id}Consent`}
                checked={formData[`${regulation.id}Consent` as keyof typeof formData] as boolean}
                onChange={(e) => onInputChange(`${regulation.id}Consent`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`${regulation.id}Consent`} className="ml-2 text-sm text-gray-700">
                Acepto cumplir con {regulation.name} para el manejo de información médica
              </label>
            </div>
            <a 
              href={regulation.officialUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              📋 Leer regulación oficial
            </a>
          </div>
        ))}

        {/* Opción para ver todas las regulaciones si no se detectó ubicación */}
        {complianceConfig.showAllRegulations && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-600 text-sm font-bold">🌐</span>
              </div>
              <h4 className="text-base font-semibold text-gray-900">Regulaciones Generales</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              No se pudo detectar tu ubicación específica. Por favor, selecciona las regulaciones que aplican a tu región:
            </p>
            
            {/* HIPAA - Estados Unidos */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="hipaaConsent"
                  checked={formData.hipaaConsent}
                  onChange={(e) => onInputChange('hipaaConsent', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hipaaConsent" className="ml-2 text-sm text-gray-700">
                  HIPAA - Estados Unidos
                </label>
              </div>
            </div>

            {/* GDPR - Unión Europea */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="gdprConsent"
                  checked={formData.gdprConsent}
                  onChange={(e) => onInputChange('gdprConsent', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="gdprConsent" className="ml-2 text-sm text-gray-700">
                  GDPR - Unión Europea
                </label>
              </div>
            </div>

            {/* PIPEDA - Canadá */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="pipedaConsent"
                  checked={formData.pipedaConsent}
                  onChange={(e) => onInputChange('pipedaConsent', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="pipedaConsent" className="ml-2 text-sm text-gray-700">
                  PIPEDA - Canadá
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Consentimiento de procesamiento de datos */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-purple-600 text-sm">🔒</span>
            </div>
            <h4 className="text-base font-semibold text-gray-900">Procesamiento de Datos</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Consentimiento para el procesamiento de datos personales según nuestra política de privacidad.
          </p>
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="dataProcessingConsent"
              checked={formData.dataProcessingConsent}
              onChange={(e) => onInputChange('dataProcessingConsent', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dataProcessingConsent" className="ml-2 text-sm text-gray-700">
              Acepto el procesamiento de mis datos personales según la política de privacidad
            </label>
          </div>
          <a 
            href="/privacy-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            📋 Leer política de privacidad
          </a>
        </div>

        {/* MFA Opcional */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 text-sm">🔐</span>
            </div>
            <h4 className="text-base font-semibold text-gray-900">Autenticación Multi-Factor (MFA)</h4>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Importante:</strong> MFA agrega un paso adicional de seguridad pero también de complejidad al login. 
              Es completamente opcional y puedes activarlo más tarde desde tu perfil.
            </p>
          </div>
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="mfaEnabled"
              checked={formData.mfaEnabled}
              onChange={(e) => onInputChange('mfaEnabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mfaEnabled" className="ml-2 text-sm text-gray-700">
              Quiero configurar autenticación multi-factor para mayor seguridad
            </label>
          </div>
          <a 
            href="/mfa-guide" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            📋 Guía de configuración MFA
          </a>
        </div>

        {/* Enlace a la política de privacidad de AiDuxCare */}
        <div className="mt-8 text-center">
          <a
            href="/docs/POLITICA_PRIVACIDAD_ES.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline text-sm font-medium hover:text-blue-900"
          >
            📄 Leer la Política de Privacidad de AiDuxCare (España)
          </a>
          <p className="text-xs text-gray-500 mt-2">
            Al continuar, aceptas nuestra <a href="/docs/POLITICA_PRIVACIDAD_ES.md" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidad</a>.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance y Seguridad</h3>
      {renderComplianceContent()}
    </div>
  );
};

export default ProfessionalOnboardingPage; 