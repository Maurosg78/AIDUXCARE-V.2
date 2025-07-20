/**
 * 🏥 Professional Onboarding Page - Identificación Profesional Especializada
 * Cumple HIPAA/GDPR: Consentimiento explícito, auditoría completa, cifrado de datos sensibles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthService } from '../core/auth/firebaseAuthService';
import { ProfessionalProfileService } from '../core/services/ProfessionalProfileService';
import { 
  ProfessionalProfile, 
  ProfessionalSpecialization, 
  PHYSIOTHERAPY_SPECIALIZATIONS,
  TECHNICAL_SPECIALIZATIONS,
  Certification 
} from '../core/domain/professionalType';
import { FirestoreAuditLogger } from '../core/audit/FirestoreAuditLogger';

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

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Información Personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    country: '',
    state: '',
    city: '',

    // Paso 2: Información Profesional
    specializationType: 'predefined' as 'predefined' | 'custom',
    specializationId: '',
    customSpecialization: {
      name: '',
      description: '',
      category: 'PHYSIOTHERAPY' as const
    },
    yearsOfExperience: 0,
    practiceType: 'CLINIC' as const,
    languages: ['Español'],

    // Paso 2.5: Información de Colegiado
    colegiateNumber: '',
    professionalId: '',
    registrationAuthority: '',
    registrationDate: '',
    registrationExpiry: '',

    // Paso 3: Perfilamiento Detallado
    areasOfInterest: [] as string[],
    patientPopulation: 'general' as const,
    practiceSettings: [] as string[],
    continuingEducation: {
      hoursCompleted: 0,
      areas: [] as string[]
    },

    // Paso 4: Certificaciones
    certifications: [] as Certification[],

    // Paso 5: Preferencias Clínicas
    assessmentStyle: 'COMPREHENSIVE' as const,
    documentationStyle: 'STRUCTURED' as const,
    aiAssistanceLevel: 'MODERATE' as const,

    // Paso 6: Compliance y Seguridad
    hipaaConsent: false,
    gdprConsent: false,
    dataProcessingConsent: false,
    auditTrailEnabled: true,
    mfaEnabled: true
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
      description: 'Especialización y experiencia',
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'credentials',
      title: 'Información de Colegiado',
      description: 'Número de colegiado e identificación oficial',
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'profiling',
      title: 'Perfilamiento Detallado',
      description: 'Áreas de interés y población de pacientes',
      isCompleted: false,
      isRequired: true
    },
    {
      id: 'certifications',
      title: 'Certificaciones',
      description: 'Certificaciones y credenciales',
      isCompleted: false,
      isRequired: false
    },
    {
      id: 'preferences',
      title: 'Preferencias Clínicas',
      description: 'Estilo de evaluación y documentación',
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
        const authService = new FirebaseAuthService();
        const session = await authService.getCurrentSession();
        
        if (session.user) {
          const existingProfile = await ProfessionalProfileService.getProfileByUserId(session.user.id);
          if (existingProfile) {
            // Usuario ya tiene perfil, redirigir al dashboard
            navigate('/professional-workflow');
            return;
          }
        }
      } catch (error) {
        console.error('Error verificando perfil existente:', error);
      }
    };

    checkExistingProfile();
  }, [navigate]);

  // Actualizar estado de pasos completados
  useEffect(() => {
    // Actualizar steps (esto sería mejor con un estado separado)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updatedSteps = steps.map((step) => {
      let isCompleted = false;

      switch (step.id) {
        case 'personal':
          isCompleted = !!(formData.firstName && formData.lastName && formData.email && 
                          formData.licenseNumber && formData.licenseExpiry && formData.country);
          break;
        case 'professional':
          isCompleted = !!(formData.specializationId && formData.yearsOfExperience > 0);
          break;
        case 'certifications':
          isCompleted = true; // Opcional
          break;
        case 'preferences':
          isCompleted = !!(formData.assessmentStyle && formData.documentationStyle && 
                          formData.aiAssistanceLevel);
          break;
        case 'compliance':
          isCompleted = !!(formData.hipaaConsent && formData.gdprConsent && 
                          formData.dataProcessingConsent);
          break;
      }

      return { ...step, isCompleted };
    });

    // Actualizar steps (esto sería mejor con un estado separado)
  }, [formData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
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
    setIsLoading(true);
    setError(null);

    try {
      // Obtener usuario actual
      const authService = new FirebaseAuthService();
      const session = await authService.getCurrentSession();
      
      if (!session.user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener especialización seleccionada
      const specialization = PHYSIOTHERAPY_SPECIALIZATIONS.find((s: ProfessionalSpecialization) => s.id === formData.specializationId);
      if (!specialization) {
        throw new Error('Especialización no válida');
      }

      // Crear perfil profesional
      const profile: Omit<ProfessionalProfile, 'id' | 'metadata'> = {
        userId: session.user.id,
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: new Date(formData.licenseExpiry),
          country: formData.country,
          state: formData.state,
          city: formData.city
        },
        professionalInfo: {
          officialCredentials: {
            colegiateNumber: formData.colegiateNumber || undefined,
            professionalId: formData.professionalId || undefined,
            registrationAuthority: formData.registrationAuthority,
            registrationDate: new Date(formData.registrationDate),
            registrationExpiry: formData.registrationExpiry ? new Date(formData.registrationExpiry) : undefined,
            isVerified: false // Por defecto no verificado
          },
          specialization,
          subSpecializations: [],
          yearsOfExperience: formData.yearsOfExperience,
          practiceType: formData.practiceType,
          certifications: formData.certifications,
          languages: formData.languages,
          areasOfInterest: formData.areasOfInterest,
          patientPopulation: formData.patientPopulation,
          practiceSettings: formData.practiceSettings,
          continuingEducation: {
            lastUpdate: new Date(),
            hoursCompleted: formData.continuingEducation.hoursCompleted,
            areas: formData.continuingEducation.areas
          },
          technicalCertifications: [],
          professionalSignature: {
            title: `Fisioterapeuta Especialista en ${specialization.name}`,
            displayName: `${formData.firstName} ${formData.lastName}`,
            specialization: specialization.name,
            isVerified: false
          }
        },
        clinicalPreferences: {
          preferredTests: specialization.clinicalTests.filter((test: any) => test.isDefault),
          customTests: [],
          assessmentStyle: formData.assessmentStyle,
          documentationStyle: formData.documentationStyle,
          aiAssistanceLevel: formData.aiAssistanceLevel
        },
        compliance: {
          hipaaConsent: formData.hipaaConsent,
          gdprConsent: formData.gdprConsent,
          dataProcessingConsent: formData.dataProcessingConsent,
          auditTrailEnabled: formData.auditTrailEnabled,
          mfaEnabled: formData.mfaEnabled,
          lastComplianceReview: new Date()
        },
        systemAccess: {
          role: session.user.role,
          permissions: ['manage_patients', 'create_visits', 'view_own_data'],
          sessionTimeout: 30 // 30 minutos
        }
      };

      // Crear perfil en el sistema
      const profileId = await ProfessionalProfileService.createProfile(profile, session.user.id);

      // Registrar evento de onboarding completado
      await FirestoreAuditLogger.logEvent({
        type: 'professional_onboarding_completed',
        userId: session.user.id,
        userRole: session.user.role,
        metadata: {
          profileId,
          specialization: specialization.name,
          country: formData.country,
          complianceAccepted: formData.hipaaConsent && formData.gdprConsent
        }
      });

      console.log('✅ Onboarding completado exitosamente');
      
      // Redirigir al dashboard
      navigate('/professional-workflow');

    } catch (error) {
      console.error('❌ Error en onboarding:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep formData={formData} onInputChange={handleInputChange} />;
      case 1:
        return <ProfessionalInfoStep formData={formData} onInputChange={handleInputChange} />;
      case 2:
        return <CredentialsStep formData={formData} onInputChange={handleInputChange} />;
      case 3:
        return <ProfilingStep formData={formData} onInputChange={handleInputChange} />;
      case 4:
        return <CertificationsStep formData={formData} onInputChange={handleInputChange} />;
      case 5:
        return <PreferencesStep formData={formData} onInputChange={handleInputChange} />;
      case 6:
        return <ComplianceStep formData={formData} onInputChange={handleInputChange} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    return currentStepData.isCompleted || !currentStepData.isRequired;
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏥 Configuración Profesional AiDuxCare
          </h1>
          <p className="text-lg text-gray-600">
            Configura tu perfil profesional para una experiencia personalizada
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <button
            onClick={isLastStep ? handleSubmit : handleNextStep}
            disabled={!canProceed() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Procesando...
              </div>
            ) : isLastStep ? (
              'Completar Configuración'
            ) : (
              'Siguiente'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componentes de pasos individuales
const PersonalInfoStep: React.FC<{
  formData: any;
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre *
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Apellido *
        </label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Teléfono
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de Licencia *
        </label>
        <input
          type="text"
          value={formData.licenseNumber}
          onChange={(e) => onInputChange('licenseNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha de Vencimiento de Licencia *
        </label>
        <input
          type="date"
          value={formData.licenseExpiry}
          onChange={(e) => onInputChange('licenseExpiry', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          País *
        </label>
        <select
          value={formData.country}
          onChange={(e) => onInputChange('country', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Seleccionar país</option>
          <option value="Chile">Chile</option>
          <option value="España">España</option>
          <option value="México">México</option>
          <option value="Estados Unidos">Estados Unidos</option>
          <option value="Canadá">Canadá</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ciudad *
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => onInputChange('city', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
    </div>
  </div>
);

const ProfessionalInfoStep: React.FC<{
  formData: any;
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Profesional</h3>
    
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Especialización *
        </label>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="specializationType"
              value="predefined"
              checked={formData.specializationType === 'predefined'}
              onChange={(e) => onInputChange('specializationType', e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Seleccionar de la lista predefinida</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="specializationType"
              value="custom"
              checked={formData.specializationType === 'custom'}
              onChange={(e) => onInputChange('specializationType', e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Definir especialización personalizada</span>
          </label>
        </div>
      </div>

      {formData.specializationType === 'predefined' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Especialización Principal *
          </label>
          <select
            value={formData.specializationId}
            onChange={(e) => onInputChange('specializationId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar especialización</option>
            {PHYSIOTHERAPY_SPECIALIZATIONS.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.name} - {spec.description}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de Especialización Personalizada *
            </label>
            <input
              type="text"
              value={formData.customSpecialization.name}
              onChange={(e) => onInputChange('customSpecialization', {
                ...formData.customSpecialization,
                name: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Fisioterapia en Oncología"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la Especialización *
            </label>
            <textarea
              value={formData.customSpecialization.description}
              onChange={(e) => onInputChange('customSpecialization', {
                ...formData.customSpecialization,
                description: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe tu especialización y enfoque clínico..."
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Años de Experiencia *
        </label>
        <input
          type="number"
          min="0"
          max="50"
          value={formData.yearsOfExperience}
          onChange={(e) => onInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Práctica *
        </label>
        <select
          value={formData.practiceType}
          onChange={(e) => onInputChange('practiceType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="CLINIC">Clínica</option>
          <option value="HOSPITAL">Hospital</option>
          <option value="PRIVATE">Práctica Privada</option>
          <option value="RESEARCH">Investigación</option>
          <option value="TEACHING">Docencia</option>
        </select>
      </div>
    </div>
  </div>
);

const CertificationsStep: React.FC<{
  formData: any;
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificaciones Técnicas</h3>
    <p className="text-gray-600 mb-4">
      Selecciona las técnicas y modalidades en las que estás certificado. Esto nos ayudará a personalizar tus evaluaciones y tratamientos.
    </p>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="text-sm font-medium text-blue-900 mb-2">🎯 Personalización de Evaluaciones</h4>
      <p className="text-sm text-blue-700">
        Las certificaciones seleccionadas se incluirán automáticamente en tus opciones de evaluación y tratamiento.
      </p>
    </div>

    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Técnicas y Modalidades Certificadas
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TECHNICAL_SPECIALIZATIONS.map((technique: any) => (
            <div key={technique.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id={technique.id}
                  checked={formData.technicalCertifications?.includes(technique.id) || false}
                  onChange={(e) => {
                    const currentCerts = formData.technicalCertifications || [];
                    if (e.target.checked) {
                      onInputChange('technicalCertifications', [...currentCerts, technique.id]);
                    } else {
                      onInputChange('technicalCertifications', currentCerts.filter((id: string) => id !== technique.id));
                    }
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <label htmlFor={technique.id} className="block">
                    <span className="text-sm font-medium text-gray-900">{technique.name}</span>
                    <p className="text-xs text-gray-500 mt-1">{technique.description}</p>
                    <div className="flex items-center mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        technique.evidenceLevel === 'HIGH' ? 'bg-green-100 text-green-800' :
                        technique.evidenceLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {technique.evidenceLevel === 'HIGH' ? 'Alta Evidencia' :
                         technique.evidenceLevel === 'MEDIUM' ? 'Evidencia Media' : 'Evidencia Limitada'}
                      </span>
                      {technique.certificationRequired && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Certificación Requerida
                        </span>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Importante</h4>
        <p className="text-sm text-yellow-700">
          Solo selecciona las técnicas en las que realmente estás certificado y tienes experiencia práctica. 
          Esta información se utilizará para personalizar tus evaluaciones y tratamientos.
        </p>
      </div>
    </div>
  </div>
);

const PreferencesStep: React.FC<{
  formData: any;
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferencias Clínicas</h3>
    
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estilo de Evaluación *
        </label>
        <select
          value={formData.assessmentStyle}
          onChange={(e) => onInputChange('assessmentStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="COMPREHENSIVE">Comprehensiva (Evaluación completa)</option>
          <option value="FOCUSED">Enfocada (Evaluación específica)</option>
          <option value="QUICK">Rápida (Evaluación básica)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estilo de Documentación *
        </label>
        <select
          value={formData.documentationStyle}
          onChange={(e) => onInputChange('documentationStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="STRUCTURED">Estructurada (SOAP detallado)</option>
          <option value="DETAILED">Detallada (Narrativa completa)</option>
          <option value="CONCISE">Concisa (Puntos clave)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nivel de Asistencia IA *
        </label>
        <select
          value={formData.aiAssistanceLevel}
          onChange={(e) => onInputChange('aiAssistanceLevel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="MINIMAL">Mínima (Solo transcripción)</option>
          <option value="MODERATE">Moderada (Sugerencias básicas)</option>
          <option value="EXTENSIVE">Extensiva (Asistencia completa)</option>
        </select>
      </div>
    </div>
  </div>
);

const CredentialsStep: React.FC<{
  formData: any;
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Colegiado</h3>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="text-sm font-medium text-blue-900 mb-2">🏛️ Identificación Oficial</h4>
      <p className="text-sm text-blue-700">
        Esta información es utilizada para verificación profesional y cumplimiento regulatorio.
      </p>
    </div>
    
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Colegiado
          </label>
          <input
            type="text"
            value={formData.colegiateNumber}
            onChange={(e) => onInputChange('colegiateNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 12345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Profesional Estatal
          </label>
          <input
            type="text"
            value={formData.professionalId}
            onChange={(e) => onInputChange('professionalId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: PT-2024-001"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Autoridad de Registro *
        </label>
        <input
          type="text"
          value={formData.registrationAuthority}
          onChange={(e) => onInputChange('registrationAuthority', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Colegio de Fisioterapeutas de Chile"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Registro *
          </label>
          <input
            type="date"
            value={formData.registrationDate}
            onChange={(e) => onInputChange('registrationDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Vencimiento de Registro
          </label>
          <input
            type="date"
            value={formData.registrationExpiry}
            onChange={(e) => onInputChange('registrationExpiry', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  </div>
);

const ProfilingStep: React.FC<{
  formData: any;
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Perfilamiento Detallado</h3>
    
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <h4 className="text-sm font-medium text-green-900 mb-2">🎯 Personalización de Experiencia</h4>
      <p className="text-sm text-green-700">
        Esta información nos ayuda a personalizar tu experiencia en AiDuxCare según tus necesidades específicas.
      </p>
    </div>
    
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Población de Pacientes Principal *
        </label>
        <select
          value={formData.patientPopulation}
          onChange={(e) => onInputChange('patientPopulation', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="general">Población General</option>
          <option value="pediatric">Pediátrica</option>
          <option value="geriatric">Geriátrica</option>
          <option value="sports">Deportiva</option>
          <option value="neurological">Neurológica</option>
          <option value="mixed">Mixta</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Áreas de Interés (máximo 5)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Dolor Crónico', 'Lesiones Deportivas', 'Neurología', 'Cardiorrespiratorio',
            'Pediatría', 'Geriátrico', 'Terapia Manual', 'Ejercicio Terapéutico',
            'Salud de la Mujer', 'Rehabilitación', 'Prevención', 'Investigación'
          ].map((area) => (
            <label key={area} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.areasOfInterest.includes(area)}
                onChange={(e) => {
                  const currentAreas = formData.areasOfInterest;
                  if (e.target.checked && currentAreas.length < 5) {
                    onInputChange('areasOfInterest', [...currentAreas, area]);
                                     } else if (!e.target.checked) {
                     onInputChange('areasOfInterest', currentAreas.filter((a: string) => a !== area));
                   }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{area}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Entornos de Práctica
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Clínica Privada', 'Hospital', 'Centro de Rehabilitación', 'Centro Deportivo',
            'Consultorio', 'Domicilio', 'Centro de Investigación', 'Universidad'
          ].map((setting) => (
            <label key={setting} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.practiceSettings.includes(setting)}
                onChange={(e) => {
                  const currentSettings = formData.practiceSettings;
                  if (e.target.checked) {
                    onInputChange('practiceSettings', [...currentSettings, setting]);
                                     } else {
                     onInputChange('practiceSettings', currentSettings.filter((s: string) => s !== setting));
                   }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{setting}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horas de Educación Continua (último año)
          </label>
          <input
            type="number"
            min="0"
            max="1000"
            value={formData.continuingEducation.hoursCompleted}
            onChange={(e) => onInputChange('continuingEducation', {
              ...formData.continuingEducation,
              hoursCompleted: parseInt(e.target.value) || 0
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Áreas de Educación Continua
          </label>
          <input
            type="text"
            value={formData.continuingEducation.areas.join(', ')}
            onChange={(e) => onInputChange('continuingEducation', {
              ...formData.continuingEducation,
              areas: e.target.value.split(',').map(area => area.trim()).filter(area => area)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Terapia Manual, Neurología, Deportes"
          />
        </div>
      </div>
    </div>
  </div>
);

const ComplianceStep: React.FC<{
  formData: any;
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance y Seguridad</h3>
    
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">🔒 Protección de Datos Médicos</h4>
        <p className="text-sm text-blue-700 mb-4">
          AiDuxCare cumple con los más altos estándares de seguridad médica (HIPAA/GDPR) 
          para proteger la información de tus pacientes.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="hipaaConsent"
            checked={formData.hipaaConsent}
            onChange={(e) => onInputChange('hipaaConsent', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="hipaaConsent" className="ml-3 text-sm text-gray-700">
            <span className="font-medium">Consentimiento HIPAA *</span>
            <p className="text-gray-500">
              Acepto el procesamiento de datos médicos según los estándares HIPAA (Health Insurance Portability and Accountability Act).
            </p>
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="gdprConsent"
            checked={formData.gdprConsent}
            onChange={(e) => onInputChange('gdprConsent', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="gdprConsent" className="ml-3 text-sm text-gray-700">
            <span className="font-medium">Consentimiento GDPR *</span>
            <p className="text-gray-500">
              Acepto el procesamiento de datos personales según el Reglamento General de Protección de Datos (GDPR).
            </p>
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="dataProcessingConsent"
            checked={formData.dataProcessingConsent}
            onChange={(e) => onInputChange('dataProcessingConsent', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="dataProcessingConsent" className="ml-3 text-sm text-gray-700">
            <span className="font-medium">Procesamiento de Datos *</span>
            <p className="text-gray-500">
              Autorizo el procesamiento de datos clínicos para mejorar la asistencia médica y la experiencia del usuario.
            </p>
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="auditTrailEnabled"
            checked={formData.auditTrailEnabled}
            onChange={(e) => onInputChange('auditTrailEnabled', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="auditTrailEnabled" className="ml-3 text-sm text-gray-700">
            <span className="font-medium">Auditoría Automática</span>
            <p className="text-gray-500">
              Habilitar registro de auditoría para cumplimiento y trazabilidad de acciones en el sistema.
            </p>
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="mfaEnabled"
            checked={formData.mfaEnabled}
            onChange={(e) => onInputChange('mfaEnabled', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="mfaEnabled" className="ml-3 text-sm text-gray-700">
            <span className="font-medium">Autenticación Multifactor (MFA)</span>
            <p className="text-gray-500">
              Habilitar autenticación de dos factores para mayor seguridad de la cuenta.
            </p>
          </label>
        </div>
      </div>
    </div>
  </div>
);

export default ProfessionalOnboardingPage; 