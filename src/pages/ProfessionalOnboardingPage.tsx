/* eslint-disable no-restricted-imports */
/* eslint-disable no-restricted-imports */
import logger from '@/shared/utils/logger';
type Regulation = { id: string; name: string; description?: string; countries: string[]; officialUrl?: string };
type ComplianceConfig = { regulations: Regulation[]; showAllRegulations?: boolean };


/**
 * 🏥 Professional Onboarding Page - Formulario Limpio de Captura Profesional
 * Cumple HIPAA/GDPR: Consentimiento explícito, auditoría completa, cifrado de datos sensibles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, sendEmailVerification } from 'firebase/auth';

import { app } from '../core/firebase/firebaseClient';
import { geolocationService } from '../services/geolocationService';
import { professionalServicesService, ServiceAvailability } from '../services/ProfessionalServicesService';
import { ProfessionalProfileService } from '../services/ProfessionalProfileService';
import AiduxcareLogo from '../assets/logo/aiduxcare-logo.svg';

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
  (async () => {
    try {
      const config: ComplianceConfig = { regulations: [], showAllRegulations: true };
      setComplianceConfig(config as ComplianceConfig);
      logger.info("📋 Regulaciones relevantes:", (config as ComplianceConfig).regulations.map((r: Regulation) => r.name));
    } catch (error) {
      logger.error("Error cargando configuración de cumplimiento:", error);
    }
  })();
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

      // Mapear los datos del formulario a la estructura esperada por ProfessionalProfileService
      const mappedProfileData = {
        license: formData.licenseNumber,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        specialties: formData.specialty ? [formData.specialty] : [],
        certifications: formData.certifications ? formData.certifications.split(',').map((c: string) => c.trim()) : [],
        practiceType: 'clínica' as 'clínica' | 'hospital' | 'consultorio' | 'domicilio',
        licenseExpiry: new Date(), // O ajustar según lógica de negocio
        isActive: true,
        complianceSettings: {
          country: formData.country,
          regulations: [],
          allowedTechniques: [],
          forbiddenTechniques: [],
          medicationRestrictions: [],
          referralRequirements: [],
          documentationStandards: [],
          dataRetentionPolicy: ''
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await ProfessionalProfileService.getInstance().createProfile(mappedProfileData);
      
      logger.info('Perfil profesional guardado exitosamente en Firebase Firestore');

      // Tras crear el perfil profesional, enviar email de verificación nativo
      await sendEmailVerification(user);
      // Redirigir a la página de verificación
      navigate('/verify-email');

    } catch (error) {
      logger.error('Error creando perfil:', error);
      setError('Error al crear el perfil profesional. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
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

  const healthProfessions: string[] = [
    'Fisioterapia',
    'Medicina General',
    'Enfermería',
    'Psicología',
    'Odontología',
    'Nutrición',
    'Terapia Ocupacional',
    'Logopedia',
    'Podología',
    'Farmacia',
    'Trabajo Social',
    'Otro'
  ];


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fdfc] px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-10 mt-12 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <img src={AiduxcareLogo} alt="AiDuxCare Logo" className="h-14 w-14 mb-4" />
          <h1 className="text-3xl font-bold text-[#5DA5A3] mb-2 text-center">
            Registro Profesional AiDuxCare
          </h1>
          <p className="text-lg text-slate-700 text-center">
            Completa tu perfil profesional para acceder a la plataforma líder en documentación clínica segura y personalizada.
          </p>
        </div>
        {/* Sección: Datos Personales */}
        <div className="bg-[#f8fdfc] rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold text-[#5DA5A3] mb-4">Datos Personales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombres */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Primer Nombre *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
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
                onChange={(e) => handleInputChange('secondName', e.target.value)}
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
                onChange={(e) => handleInputChange('lastName', e.target.value)}
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
                onChange={(e) => handleInputChange('secondLastName', e.target.value)}
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
                onChange={(e) => handleInputChange('email', e.target.value)}
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
                onChange={(e) => handleInputChange('phone', e.target.value)}
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
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
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
                onChange={(e) => handleInputChange('country', e.target.value)}
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
                onChange={(e) => handleInputChange('licenseRenewalType', e.target.value)}
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
                  onChange={(e) => handleInputChange('licenseExpiryNotification', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="licenseExpiryNotification" className="ml-2 block text-sm text-gray-700">
                  Recibir notificaciones cuando mi licencia esté próxima a vencer
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Datos Profesionales */}
        <div className="bg-[#f8fdfc] rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-[#5DA5A3] mr-2" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M7 12l5 5 5-5H7z" fill="currentColor"/>
            </svg>
            <h3 className="text-xl font-semibold text-[#5DA5A3]">Datos Profesionales</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
                Profesión de la Salud *
              </label>
              <select
                id="profession"
                value={formData.profession}
                onChange={(e) => handleInputChange('profession', e.target.value)}
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
                onChange={(e) => handleInputChange('specialty', e.target.value)}
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
                onChange={(e) => handleInputChange('certifications', e.target.value)}
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
                onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 5 años, 10+ años, 2 años en pediatría..."
                required
              />
            </div>


          </div>
        </div>

        {/* Sección: Compliance y Seguridad */}
        <div className="bg-[#f8fdfc] rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold text-[#5DA5A3] mb-4">Consentimientos y Seguridad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información de ubicación detectada */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm">🌍</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">
                    </h4>
                    <p className="text-xs text-blue-700">
                    </p>
                  </div>
                </div>
              </div>

            {/* Regulaciones relevantes */}
            {complianceConfig?.regulations.map((regulation: Regulation) => (
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
                    onChange={(e) => handleInputChange(`${regulation.id}Consent`, e.target.checked)}
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
            {complianceConfig?.showAllRegulations && (
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
                      onChange={(e) => handleInputChange('hipaaConsent', e.target.checked)}
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
                      onChange={(e) => handleInputChange('gdprConsent', e.target.checked)}
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
                      onChange={(e) => handleInputChange('pipedaConsent', e.target.checked)}
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
                  onChange={(e) => handleInputChange('dataProcessingConsent', e.target.checked)}
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
                  onChange={(e) => handleInputChange('mfaEnabled', e.target.checked)}
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
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline text-sm font-medium hover:text-blue-900"
              >
                📄 Leer la Política de Privacidad de AiDuxCare (España)
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Al continuar, aceptas nuestra <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidad</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            className="bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded hover:bg-gray-300 transition-colors"
          >
            Anterior
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
              className="bg-[#5DA5A3] text-white font-semibold py-2 px-6 rounded hover:bg-[#48918f] transition-colors"
            >
              {isLoading ? 'Completando...' : 'Completar Configuración'}
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="bg-[#5DA5A3] text-white font-semibold py-2 px-6 rounded hover:bg-[#48918f] transition-colors"
            >
              Siguiente
            </button>
          )}
        </div>

        {/* Mensajes de error y éxito */}
        {error && <div className="text-red-600 text-sm mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default ProfessionalOnboardingPage; 
