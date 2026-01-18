/**
 * 🏥 Professional Onboarding Page - CTO Canonical Structure (3 Wizards)
 * 
 * CTO SPEC: Exact structure as specified in CTO documentation
 * - WIZARD 1: Professional Identity
 * - WIZARD 2: Clinical Practice & Style
 * - WIZARD 3: Data Use & Consent
 * 
 * DoD: All fields persist in users/{uid} only
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

import { app } from '../core/firebase/firebaseClient';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { useAuth } from '../hooks/useAuth';

import { useProfessionalProfile } from '../context/ProfessionalProfileContext';
import { isProfileComplete } from '../utils/professionalProfileValidation';
import Button from '../components/ui/button';
import { Select } from '../components/ui/Select';
import { PRIMARY_SPECIALTIES, MSK_SKILLS } from '../components/wizard/onboardingConstants';
import { getPilotConsentContent, getLanguageFromCountry } from '../utils/pilotConsent';

import logger from '@/shared/utils/logger';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

export const ProfessionalOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateProfile, profile, loading: profileLoading } = useProfessionalProfile();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string; checking: boolean }>({ isValid: true, message: '', checking: false });

  // WO-13: Si usuario ya está autenticado y tiene perfil completo (según criterio WO-13), redirigir a command-center
  // NO usar emailVerified para routing en modo piloto
  // WO-ONB-SIGNUP-01: NO redirigir si estamos mostrando la pantalla de éxito
  useEffect(() => {
    // No redirigir si estamos en estado de éxito (mostrando pantalla de éxito)
    if (isSuccess) {
      return;
    }

    if (user && !profileLoading) {
      // WO-13: Usar isProfileComplete como fuente única de verdad (NO usar registrationStatus directamente)
      if (isProfileComplete(profile)) {
        logger.info("[PROFESSIONAL_ONBOARDING] User already has complete profile (WO-13 criteria), redirecting to command-center", {
          uid: user.uid,
          registrationStatus: profile?.registrationStatus
        });
        navigate('/command-center', { replace: true });
        return;
      }
      // WO-13: NO usar emailVerified para routing en modo piloto
      // Cloudflare Access valida identidad, perfil manda, no el email
      // Removido: verificación de emailVerified para routing
    }
  }, [user, profile, profileLoading, navigate, isSuccess]);

  // CTO SPEC: Exact form structure as specified
  const [formData, setFormData] = useState({
    // WIZARD 1 — Identidad profesional (CTO Spec)
    firstName: '',
    lastName: '',
    preferredName: '', // Opcional
    email: user?.email || '', // Readonly si viene de auth
    password: '', // Para nuevos usuarios (solo si no está autenticado)
    confirmPassword: '', // Para nuevos usuarios (solo si no está autenticado)
    phone: '',
    phoneCountryCode: '+1', // E.164 format
    country: '',
    province: '', // province/state
    city: '',
    profession: '', // physiotherapist, etc.
    licenseNumber: '',
    licenseCountry: '', // issuingBody

    // WIZARD 2 — Práctica clínica y estilo (CTO Spec)
    yearsOfExperience: 0,
    specialty: '', // specialty/focus (legacy, single value)
    specialties: [] as string[], // Multi-select specialties
    specialtyOther: '', // Free-text for 'other' specialty
    practiceSetting: '' as '' | 'clinic' | 'hospital' | 'home-care' | 'mixed', // Legacy, single value
    practiceSettings: [] as string[], // Multi-select practice settings
    practiceCountry: '', // País donde se ejercerá como profesional
    practicePreferences: {
      noteVerbosity: 'standard' as 'concise' | 'standard' | 'detailed',
      tone: 'formal' as 'formal' | 'friendly' | 'educational',
      preferredTreatments: [] as string[],
      doNotSuggest: [] as string[],
    },

    // WIZARD 3 — Uso de datos y consentimiento (CTO Spec)
    dataUseConsent: {
      personalizationFromClinicianInputs: true, // default true
      personalizationFromPatientData: false, // default false
      allowAssistantMemoryAcrossSessions: true, // default true
      useDeidentifiedDataForProductImprovement: false, // default false
      phipaConsent: false, // PHIPA consent - default false (must be explicitly granted)
      pipedaConsent: false, // PIPEDA consent - default false (must be explicitly granted)
    },
    pilotConsent: false, // WO-12: Pilot consent - required for all countries
  });

  // CTO SPEC: 3 wizards canónicos
  const steps: OnboardingStep[] = [
    {
      id: 'identity',
      title: 'Professional Identity',
      description: 'Who you are within AiDuxCare',
    },
    {
      id: 'practice',
      title: 'Clinical Practice & Style',
      description: 'How you work and how AiDuxCare helps you',
    },
    {
      id: 'consent',
      title: 'Data Use & Consent',
      description: 'What you allow your assistant to do',
    }
  ];

  // CTO SPEC: Email readonly si viene de auth
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user?.email]);

  const handleInputChange = (field: string, value: any) => {
    // CTO SPEC: Manejar nested objects (practicePreferences, dataUseConsent)
    if (field.startsWith('practicePreferences.')) {
      const subField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        practicePreferences: {
          ...prev.practicePreferences,
          [subField]: value
        }
      }));
    } else if (field.startsWith('dataUseConsent.')) {
      const subField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dataUseConsent: {
          ...prev.dataUseConsent,
          [subField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Validación inmediata de email
    if (field === 'email' && value) {
      validateEmailImmediate(value);
    }

    // Validación inmediata de teléfono
    if (field === 'phone' || field === 'phoneCountryCode') {
      const phone = field === 'phone' ? value : formData.phone;
      const countryCode = field === 'phoneCountryCode' ? value : formData.phoneCountryCode;
      if (phone && countryCode) {
        validatePhoneImmediate(countryCode + phone);
      }
    }
  };

  // Handle specialty toggle (multi-select checkboxes)
  const handleSpecialtyToggle = (specialtyValue: string) => {
    const currentSpecialties = Array.isArray(formData.specialties) ? formData.specialties : [];
    const newSpecialties = currentSpecialties.includes(specialtyValue)
      ? currentSpecialties.filter((s: string) => s !== specialtyValue)
      : [...currentSpecialties, specialtyValue];

    setFormData(prev => ({
      ...prev,
      specialties: newSpecialties,
      specialty: newSpecialties.length > 0 ? newSpecialties[0] : '', // Legacy compatibility
    }));
  };

  // Handle practice setting toggle (multi-select checkboxes)
  const handlePracticeSettingToggle = (settingValue: string) => {
    const currentSettings = Array.isArray(formData.practiceSettings) ? formData.practiceSettings : [];
    const newSettings = currentSettings.includes(settingValue)
      ? currentSettings.filter((s: string) => s !== settingValue)
      : [...currentSettings, settingValue];

    setFormData(prev => ({
      ...prev,
      practiceSettings: newSettings,
      practiceSetting: newSettings.length > 0 ? newSettings[0] as any : '', // Legacy compatibility
    }));
  };

  // Handle treatment toggle (for preferredTreatments and doNotSuggest)
  const handleTreatmentToggle = (treatmentValue: string, field: 'preferredTreatments' | 'doNotSuggest') => {
    const currentArray = Array.isArray(formData.practicePreferences[field])
      ? formData.practicePreferences[field]
      : [];

    const newArray = currentArray.includes(treatmentValue)
      ? currentArray.filter((item: string) => item !== treatmentValue)
      : [...currentArray, treatmentValue];

    setFormData(prev => ({
      ...prev,
      practicePreferences: {
        ...prev.practicePreferences,
        [field]: newArray,
      },
    }));
  };

  // WO-AUTH-ONB-FLOW-FIX-04 A: Validación inmediata de email (solo formato local si no hay auth)
  const validateEmailImmediate = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({ isValid: true, message: '', checking: false });
      return;
    }

    // WO-AUTH-ONB-FLOW-FIX-04 A: Si NO hay auth, solo validar formato localmente
    // NO consultar Firestore sin auth (evita permissions error)
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      // Usuario no autenticado - solo validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(email);

      setEmailValidation({
        isValid: isValidFormat,
        message: isValidFormat ? '' : 'Please enter a valid email address',
        checking: false
      });
      return;
    }

    // Si hay auth, verificar duplicados por uid (no por email)
    // Pero en onboarding, el usuario puede estar creando cuenta nueva
    // Firebase Auth manejará duplicados automáticamente al crear cuenta
    // Por ahora, solo validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    setEmailValidation({
      isValid: isValidFormat,
      message: isValidFormat ? '' : 'Please enter a valid email address',
      checking: false
    });

    // WO-AUTH-ONB-FLOW-FIX-04: NO llamar getProfessional(email) sin auth
    // Firebase Auth validará duplicados cuando se cree la cuenta
  };

  // Validación inmediata de teléfono (formato E.164)
  const validatePhoneImmediate = async (fullPhone: string) => {
    if (!fullPhone || !fullPhone.startsWith('+')) {
      return;
    }

    // Validar formato E.164
    if (!/^\+[1-9]\d{1,14}$/.test(fullPhone)) {
      // Invalid format - handled by UI
      return;
    }
  };

  // CTO SPEC: Validación visual en tiempo real
  const getFieldValidationClass = (value: any, isRequired: boolean = true): string => {
    const baseClass = "w-full h-9 px-3 border rounded-lg focus:ring-2 transition-all text-sm bg-white font-apple font-light";

    if (!isRequired) {
      return `${baseClass} border-gray-300 focus:ring-primary-blue focus:border-primary-blue`;
    }

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/30`;
    }

    return `${baseClass} border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50/20`;
  };

  const getFieldValidationIcon = (value: any, isRequired: boolean = true): React.ReactNode => {
    if (!isRequired) return null;

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500 text-xs font-bold">*</span>;
    }

    return (
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
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

  // CTO SPEC: Validación de campos obligatorios según estructura canónica
  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'identity': {
        // WIZARD 1: Identidad profesional - campos obligatorios según CTO
        const hasBasicFields = !!(
          formData.firstName?.trim() &&
          formData.lastName?.trim() &&
          formData.email?.trim() &&
          emailValidation.isValid &&
          !emailValidation.checking &&
          formData.country &&
          formData.province &&
          formData.city &&
          formData.profession &&
          formData.licenseNumber?.trim() &&
          formData.licenseCountry
        );
        // Si el usuario NO está autenticado, también requiere password
        if (!user) {
          return hasBasicFields && !!(
            formData.password?.trim() &&
            formData.password.length >= 6 &&
            formData.password === formData.confirmPassword
          );
        }
        return hasBasicFields;
      }
      case 'practice': {
        // WIZARD 2: Práctica clínica - campos obligatorios según CTO
        return !!(
          formData.yearsOfExperience &&
          formData.yearsOfExperience > 0 &&
          formData.specialty?.trim() &&
          formData.practiceSetting &&
          formData.practiceCountry?.trim()
        );
      }
      case 'consent': {
        // WIZARD 3: Consentimiento
        // WO-12: Pilot consent is required for all countries
        const hasPilotConsent = formData.pilotConsent === true;

        // PHIPA y PIPEDA son obligatorios SOLO para Canadá
        const practiceCountry = formData.practiceCountry || formData.country || '';
        const isCanada = practiceCountry.toUpperCase() === 'CA';

        if (isCanada) {
          return hasPilotConsent && !!(
            formData.dataUseConsent.phipaConsent === true &&
            formData.dataUseConsent.pipedaConsent === true
          );
        }

        // Para otros países, solo se requiere pilot consent
        return hasPilotConsent;
      }
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsLoading(true);
    setError('');

    try {
      let authUser = getAuth(app).currentUser;

      // WO-ONB-SIGNUP-01: Si el usuario NO está autenticado, crear cuenta primero
      if (!authUser) {
        if (!formData.password || formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        // Crear usuario en Firebase Auth
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(
          getAuth(app),
          formData.email.trim().toLowerCase(),
          formData.password
        );

        authUser = userCredential.user;
        logger.info('[ONBOARDING] New user account created', { uid: authUser.uid, email: authUser.email });

        // Enviar email de verificación (no bloquea)
        const { sendEmailVerification } = await import('firebase/auth');
        sendEmailVerification(authUser).catch((err) => {
          logger.warn('[ONBOARDING] Failed to send verification email', err);
        });
      }

      if (!authUser) {
        setError('Unable to authenticate user. Please try again.');
        setIsLoading(false);
        return;
      }

      // CTO SPEC: Construir practicePreferences según estructura
      // preferredTreatments y doNotSuggest ya son arrays desde el handleInputChange
      const practicePreferences = {
        noteVerbosity: formData.practicePreferences.noteVerbosity,
        tone: formData.practicePreferences.tone,
        preferredTreatments: Array.isArray(formData.practicePreferences.preferredTreatments)
          ? formData.practicePreferences.preferredTreatments
          : [],
        doNotSuggest: Array.isArray(formData.practicePreferences.doNotSuggest)
          ? formData.practicePreferences.doNotSuggest
          : [],
      };

      // CTO SPEC: Combinar código de país + teléfono en formato E.164
      const fullPhone = formData.phone && formData.phoneCountryCode
        ? `${formData.phoneCountryCode}${formData.phone.replace(/\D/g, '')}`
        : undefined;

      // CTO SPEC: Persistir EXCLUSIVAMENTE en users/{uid}
      // CTO SPEC: Todos los campos del onboarding deben cumplir una de estas 3:
      // - Afecta UI (firstName, lastName, preferredName → displayName, fullName)
      // - Afecta prompting (specialty, practicePreferences, dataUseConsent)
      // - Afecta compliance/legal (licenseNumber, country, province, city)
      await updateProfile({
        // WIZARD 1: Identidad profesional
        // UI: Saludo, firma automática, identidad clínica en prompts
        displayName: formData.preferredName || formData.firstName, // Para saludo en UI
        fullName: `${formData.firstName} ${formData.lastName}`, // Para firma automática
        preferredSalutation: formData.preferredName || undefined, // Para saludo personalizado
        lastNamePreferred: formData.lastName, // Para identidad clínica
        email: formData.email, // Readonly desde auth - identidad técnica
        phone: fullPhone, // E.164 format - para SMS
        country: formData.country, // Compliance: selección automática de regulación
        province: formData.province, // Compliance: guardrails clínico-legales
        city: formData.city, // Compliance: copy dinámico
        profession: formData.profession, // Prompting: lenguaje clínico específico
        professionalTitle: formData.profession, // Alias para compatibilidad
        licenseNumber: formData.licenseNumber, // Compliance: guardrails clínico-legales
        // licenseCountry: formData.licenseCountry, // Se puede almacenar como metadata si es necesario

        // WIZARD 2: Práctica clínica
        // Prompting: seniority, nivel de explicación, lenguaje clínico, prioridad en hipótesis
        specialty: formData.specialty, // Prompting: lenguaje clínico específico
        experienceYears: formData.yearsOfExperience.toString(), // Prompting: seniority
        practiceCountry: formData.practiceCountry || formData.country, // Compliance: país donde se ejercerá (fallback a country si no existe)
        practicePreferences, // Prompting: reduce fricción cognitiva, evita sugerencias no usadas

        // WIZARD 3: Consentimiento
        // Prompting: filtrado de datos antes de construir prompt
        // Compliance: PHIPA y PIPEDA son obligatorios para cumplir con regulaciones canadienses
        dataUseConsent: {
          ...formData.dataUseConsent,
          phipaConsent: formData.dataUseConsent.phipaConsent, // Required for PHIPA compliance (Canada only)
          pipedaConsent: formData.dataUseConsent.pipedaConsent, // Required for PIPEDA compliance (Canada only)
        },
        // WO-12: Pilot consent - required for all countries
        pilotConsent: {
          accepted: formData.pilotConsent,
          acceptedAt: new Date(),
          version: 'pilot-v1',
          practiceCountry: formData.practiceCountry || formData.country || '',
        },

        // CTO SPEC: registrationStatus pasa a 'complete' cuando se completa todo
        registrationStatus: 'complete',
      });

      logger.info('Professional profile saved successfully in users/{uid}');

      // Enviar verificación de email
      const verifyRes = await firebaseAuthService.sendEmailVerification(authUser);
      if (!verifyRes.success) {
        logger.warn("[ONBOARDING] sendEmailVerification failed", { message: verifyRes.message });
      }

      // WO-ONB-SIGNUP-01: Mostrar estado de éxito antes de redirigir
      setIsSuccess(true);
      setIsLoading(false);

      // Esperar 3 segundos para que el usuario vea el mensaje de éxito
      setTimeout(async () => {
        // Forzar re-login post verification (solo si el usuario fue creado en este flujo)
        if (!user) {
          await signOut(getAuth());
        }

        // Redirigir a login con mensaje de éxito
        navigate("/login", {
          replace: true,
          state: {
            message: 'Registration completed successfully! Please check your email to verify your account.',
            type: 'success'
          }
        });
      }, 3000);

    } catch (error) {
      logger.error('Error saving profile:', error);
      setError('Error saving professional profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const healthProfessions: string[] = [
    'Physiotherapist',
    'Physical Therapist',
    'Occupational Therapist',
    'Speech Therapist',
    'Registered Nurse',
    'Nurse Practitioner',
    'Physician',
    'Psychologist',
    'Social Worker',
    'Other'
  ];

  // CTO SPEC: Layout optimizado para pantalla 13" sin scroll
  // WO-ONB-SIGNUP-01: Mostrar pantalla de éxito si el proceso se completó
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-3 py-2">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 font-apple">
              Registration Successful!
            </h2>
            <p className="text-sm text-gray-600 mb-4 font-apple font-light">
              Your professional profile has been created successfully.
            </p>
            <p className="text-xs text-gray-500 mb-4 font-apple font-light">
              Please check your email ({formData.email}) to verify your account. You will be redirected to the login page shortly.
            </p>
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-400 font-apple">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Redirecting to login...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-3 py-2">
      <div className="w-full max-w-4xl">
        {/* Header - Ultra compacto */}
        <div className="text-center mb-2">
          <p className="text-[9px] font-light text-gray-500 uppercase tracking-[0.02em] mb-1 font-apple">
            SECURE PROFESSIONAL ACCESS • PHIPA COMPLIANT
          </p>
          <h1 className="text-xl sm:text-2xl font-light mb-1 tracking-[-0.02em] leading-tight font-apple">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent font-medium">
              AiduxCare
            </span>
            <span className="ml-1 text-lg">🍁</span>
          </h1>
          <p className="text-sm text-gray-600 font-light font-apple">
            Complete Your Professional Profile
          </p>
        </div>

        {/* Card principal - Compacto */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-2">
          <h2 className="text-base font-medium text-gray-900 mb-3 text-center font-apple">
            Professional Onboarding
          </h2>

          {/* Progress Indicator - Compacto */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${index === currentStep
                        ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white'
                        : index < currentStep
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <span
                      className={`ml-1.5 text-xs font-apple ${index === currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1.5 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* WIZARD 1 — Identidad profesional (CTO Spec) */}
          {currentStep === 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/20 rounded-lg border border-blue-200/60 p-4 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 font-apple">
                Professional Identity
              </h3>
              <p className="text-[10px] text-gray-600 mb-3 font-apple font-light">
                Who you are within AiDuxCare
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* First Name - Required */}
                <div className="relative">
                  <label htmlFor="firstName" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={getFieldValidationClass(formData.firstName, true)}
                    required
                  />
                  {getFieldValidationIcon(formData.firstName, true)}
                </div>

                {/* Last Name - Required */}
                <div className="relative">
                  <label htmlFor="lastName" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={getFieldValidationClass(formData.lastName, true)}
                    required
                  />
                  {getFieldValidationIcon(formData.lastName, true)}
                </div>

                {/* Preferred Name - Optional */}
                <div className="relative">
                  <label htmlFor="preferredName" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Preferred Name
                  </label>
                  <input
                    type="text"
                    id="preferredName"
                    value={formData.preferredName}
                    onChange={(e) => handleInputChange('preferredName', e.target.value)}
                    className={getFieldValidationClass(formData.preferredName, false)}
                  />
                </div>

                {/* Email - Required, Readonly */}
                <div className="relative">
                  <label htmlFor="email" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    readOnly={!!user?.email}
                    className={`${getFieldValidationClass(formData.email, true)} ${user?.email ? 'bg-gray-50 cursor-not-allowed' : ''} ${!emailValidation.isValid ? 'border-red-400 bg-red-50/40' : ''}`}
                    required
                  />
                  {emailValidation.checking ? (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <svg className="w-3 h-3 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  ) : emailValidation.isValid && formData.email ? (
                    getFieldValidationIcon(formData.email, true)
                  ) : !emailValidation.isValid ? (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  ) : null}
                  {emailValidation.message && (
                    <p className={`text-[10px] mt-0.5 font-apple font-light ${!emailValidation.isValid ? 'text-red-600' : 'text-amber-600'}`}>
                      {emailValidation.message}
                    </p>
                  )}
                </div>

                {/* Password - Required only for new users (not authenticated) */}
                {!user && (
                  <>
                    <div className="relative">
                      <label htmlFor="password" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={getFieldValidationClass(formData.password, true)}
                        required
                        minLength={6}
                      />
                      {formData.password && formData.password.length >= 6 && getFieldValidationIcon(formData.password, true)}
                    </div>

                    <div className="relative">
                      <label htmlFor="confirmPassword" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`${getFieldValidationClass(formData.confirmPassword, true)} ${formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-400 bg-red-50/40' : ''}`}
                        required
                        minLength={6}
                      />
                      {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && getFieldValidationIcon(formData.confirmPassword, true)}
                      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Phone with Country Code - Optional */}
                <div className="relative col-span-2">
                  <label htmlFor="phone" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Phone <span className="text-gray-400 text-[10px]">(for SMS notifications)</span>
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      id="phoneCountryCode"
                      value={formData.phoneCountryCode}
                      onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                      className="w-20 h-9 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-xs bg-white font-apple font-light"
                    >
                      <option value="+1">🇨🇦 +1</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+64">🇳🇿 +64</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+56">🇨🇱 +56</option>
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      className={`flex-1 ${getFieldValidationClass(formData.phone, false)}`}
                      placeholder="5551234567"
                    />
                  </div>
                </div>

                {/* Country - Required */}
                <div className="relative">
                  <label htmlFor="country" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className={getFieldValidationClass(formData.country, true)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                    <option value="MX">Mexico</option>
                    <option value="ES">Spain</option>
                    <option value="AR">Argentina</option>
                    <option value="CO">Colombia</option>
                    <option value="PE">Peru</option>
                    <option value="CL">Chile</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {getFieldValidationIcon(formData.country, true)}
                </div>

                {/* Province/State - Required */}
                <div className="relative">
                  <label htmlFor="province" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Province/State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className={getFieldValidationClass(formData.province, true)}
                    required
                  />
                  {getFieldValidationIcon(formData.province, true)}
                </div>

                {/* City - Required */}
                <div className="relative">
                  <label htmlFor="city" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={getFieldValidationClass(formData.city, true)}
                    required
                  />
                  {getFieldValidationIcon(formData.city, true)}
                </div>

                {/* Profession - Required */}
                <div className="relative">
                  <label htmlFor="profession" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Profession <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    className={getFieldValidationClass(formData.profession, true)}
                    required
                  >
                    <option value="">Select</option>
                    {healthProfessions.map((profession) => (
                      <option key={profession} value={profession}>
                        {profession}
                      </option>
                    ))}
                  </select>
                  {getFieldValidationIcon(formData.profession, true)}
                </div>

                {/* License Number - Required */}
                <div className="relative">
                  <label htmlFor="licenseNumber" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    className={getFieldValidationClass(formData.licenseNumber, true)}
                    required
                  />
                  {getFieldValidationIcon(formData.licenseNumber, true)}
                </div>

                {/* License Country - Required */}
                <div className="relative">
                  <label htmlFor="licenseCountry" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    License Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="licenseCountry"
                    value={formData.licenseCountry}
                    onChange={(e) => handleInputChange('licenseCountry', e.target.value)}
                    className={getFieldValidationClass(formData.licenseCountry, true)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                    <option value="MX">Mexico</option>
                    <option value="ES">Spain</option>
                    <option value="AR">Argentina</option>
                    <option value="CO">Colombia</option>
                    <option value="PE">Peru</option>
                    <option value="CL">Chile</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {getFieldValidationIcon(formData.licenseCountry, true)}
                </div>
              </div>
            </div>
          )}

          {/* WIZARD 2 — Práctica clínica y estilo (CTO Spec) */}
          {currentStep === 1 && (
            <div className="bg-gradient-to-br from-gray-50 to-purple-50/20 rounded-lg border border-purple-200/60 p-4 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 font-apple">
                Clinical Practice & Style
              </h3>
              <p className="text-[10px] text-gray-600 mb-3 font-apple font-light">
                How you work and how AiDuxCare helps you
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* Years of Experience - Required */}
                <div className="relative">
                  <label htmlFor="yearsOfExperience" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="yearsOfExperience"
                    value={formData.yearsOfExperience || ''}
                    onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                    className={getFieldValidationClass(formData.yearsOfExperience, true)}
                    required
                    min="0"
                  />
                  {getFieldValidationIcon(formData.yearsOfExperience, true)}
                </div>

                {/* Specialty - Multi-select checkboxes */}
                <div className="relative col-span-2">
                  <label className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Specialty / Focus <span className="text-red-500">*</span>
                    <span className="text-gray-400 text-[10px] ml-1">(select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-2 border border-gray-300 rounded-lg bg-gray-50">
                    {PRIMARY_SPECIALTIES.map((specialty) => {
                      const selectedSpecialties = Array.isArray(formData.specialties) ? formData.specialties : [];
                      const isSelected = selectedSpecialties.includes(specialty.value);
                      return (
                        <label
                          key={specialty.value}
                          className={`flex items-center gap-1.5 p-1.5 cursor-pointer rounded transition-colors text-xs ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSpecialtyToggle(specialty.value)}
                            className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                          />
                          <span className={`${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {specialty.label}
                          </span>
                        </label>
                      );
                    })}
                    <label
                      className={`flex items-center gap-1.5 p-1.5 cursor-pointer rounded transition-colors text-xs ${Array.isArray(formData.specialties) && formData.specialties.includes('other')
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.specialties) && formData.specialties.includes('other')}
                        onChange={() => handleSpecialtyToggle('other')}
                        className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                      />
                      <span className={`${Array.isArray(formData.specialties) && formData.specialties.includes('other')
                        ? 'font-medium text-gray-900'
                        : 'text-gray-700'
                        }`}>
                        Other (specify below)
                      </span>
                    </label>
                  </div>
                  {Array.isArray(formData.specialties) && formData.specialties.length > 0 && (
                    <p className="text-[10px] text-green-600 mt-0.5 font-apple">
                      {formData.specialties.length} specialt{formData.specialties.length !== 1 ? 'ies' : 'y'} selected
                    </p>
                  )}
                  {Array.isArray(formData.specialties) && formData.specialties.includes('other') && (
                    <input
                      type="text"
                      value={formData.specialtyOther || ''}
                      onChange={(e) => handleInputChange('specialtyOther', e.target.value)}
                      className="w-full h-9 px-3 mt-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-xs bg-white font-apple font-light"
                      placeholder="e.g., Sports Medicine, Pain Management..."
                    />
                  )}
                </div>

                {/* Practice Setting - Multi-select checkboxes */}
                <div className="relative col-span-2">
                  <label className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Practice Setting <span className="text-red-500">*</span>
                    <span className="text-gray-400 text-[10px] ml-1">(select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-2 border border-gray-300 rounded-lg bg-gray-50">
                    {[
                      { value: 'clinic', label: 'Clinic' },
                      { value: 'hospital', label: 'Hospital' },
                      { value: 'home-care', label: 'Home Care' },
                      { value: 'mixed', label: 'Mixed' },
                    ].map((setting) => {
                      const selectedSettings = Array.isArray(formData.practiceSettings) ? formData.practiceSettings : [];
                      const isSelected = selectedSettings.includes(setting.value);
                      return (
                        <label
                          key={setting.value}
                          className={`flex items-center gap-1.5 p-1.5 cursor-pointer rounded transition-colors text-xs ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePracticeSettingToggle(setting.value)}
                            className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                          />
                          <span className={`${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {setting.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {Array.isArray(formData.practiceSettings) && formData.practiceSettings.length > 0 && (
                    <p className="text-[10px] text-green-600 mt-0.5 font-apple">
                      {formData.practiceSettings.length} setting{formData.practiceSettings.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Practice Country - Required */}
                <div className="relative">
                  <label htmlFor="practiceCountry" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                    Country of Practice <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="practiceCountry"
                    value={formData.practiceCountry}
                    onChange={(e) => handleInputChange('practiceCountry', e.target.value)}
                    className={getFieldValidationClass(formData.practiceCountry, true)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="CA">Canadá</option>
                    <option value="CL">Chile</option>
                    <option value="ES">España</option>
                  </select>
                  {getFieldValidationIcon(formData.practiceCountry, true)}
                </div>

                {/* Practice Preferences */}
                <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2 font-apple">Practice Preferences</h4>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Note Verbosity */}
                    <div>
                      <label htmlFor="noteVerbosity" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                        Note Verbosity
                      </label>
                      <select
                        id="noteVerbosity"
                        value={formData.practicePreferences.noteVerbosity}
                        onChange={(e) => handleInputChange('practicePreferences.noteVerbosity', e.target.value)}
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-xs bg-white font-apple font-light"
                      >
                        <option value="concise">Concise</option>
                        <option value="standard">Standard</option>
                        <option value="detailed">Detailed</option>
                      </select>
                    </div>

                    {/* Tone */}
                    <div>
                      <label htmlFor="tone" className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                        Tone
                      </label>
                      <select
                        id="tone"
                        value={formData.practicePreferences.tone}
                        onChange={(e) => handleInputChange('practicePreferences.tone', e.target.value)}
                        className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-xs bg-white font-apple font-light"
                      >
                        <option value="formal">Formal</option>
                        <option value="friendly">Friendly</option>
                        <option value="educational">Educational</option>
                      </select>
                    </div>

                    {/* MSK Treatment Preferences - Only show when MSK is selected */}
                    {Array.isArray(formData.specialties) && formData.specialties.includes('msk') && (
                      <>
                        {/* Preferred Treatments (MSK) */}
                        <div>
                          <label className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                            Preferred Treatments (MSK) <span className="text-gray-400 text-[10px]">(optional)</span>
                          </label>
                          <div className="max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-lg bg-gray-50">
                            {MSK_SKILLS.map((skill) => {
                              const preferredTreatments = Array.isArray(formData.practicePreferences.preferredTreatments)
                                ? formData.practicePreferences.preferredTreatments
                                : [];
                              const isSelected = preferredTreatments.includes(skill.value);
                              return (
                                <label
                                  key={skill.value}
                                  className="flex items-center gap-1.5 p-1 cursor-pointer rounded transition-colors text-xs hover:bg-gray-100"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleTreatmentToggle(skill.value, 'preferredTreatments')}
                                    className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                                  />
                                  <span className="text-gray-700">{skill.label}</span>
                                </label>
                              );
                            })}
                          </div>
                          {Array.isArray(formData.practicePreferences.preferredTreatments) && formData.practicePreferences.preferredTreatments.length > 0 && (
                            <p className="text-[10px] text-green-600 mt-0.5 font-apple">
                              {formData.practicePreferences.preferredTreatments.length} selected
                            </p>
                          )}
                        </div>

                        {/* Do Not Suggest (MSK) */}
                        <div>
                          <label className="block text-xs font-normal text-gray-700 mb-1 font-apple">
                            Do Not Suggest (MSK) <span className="text-gray-400 text-[10px]">(optional)</span>
                          </label>
                          <div className="max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-lg bg-gray-50">
                            {MSK_SKILLS.map((skill) => {
                              const doNotSuggest = Array.isArray(formData.practicePreferences.doNotSuggest)
                                ? formData.practicePreferences.doNotSuggest
                                : [];
                              const isSelected = doNotSuggest.includes(skill.value);
                              return (
                                <label
                                  key={skill.value}
                                  className="flex items-center gap-1.5 p-1 cursor-pointer rounded transition-colors text-xs hover:bg-gray-100"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleTreatmentToggle(skill.value, 'doNotSuggest')}
                                    className="w-3.5 h-3.5 cursor-pointer accent-red-600"
                                  />
                                  <span className="text-gray-700">{skill.label}</span>
                                </label>
                              );
                            })}
                          </div>
                          {Array.isArray(formData.practicePreferences.doNotSuggest) && formData.practicePreferences.doNotSuggest.length > 0 && (
                            <p className="text-[10px] text-red-600 mt-0.5 font-apple">
                              {formData.practicePreferences.doNotSuggest.length} excluded
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WIZARD 3 — Uso de datos y consentimiento (CTO Spec) */}
          {currentStep === 2 && (() => {
            // WO-12: Get practice country with fallback
            const practiceCountry = formData.practiceCountry || formData.country || '';
            const isCanada = practiceCountry.toUpperCase() === 'CA';
            const consentContent = getPilotConsentContent(practiceCountry);

            return (
              <div className="bg-gradient-to-br from-gray-50 to-indigo-50/20 rounded-lg border border-indigo-200/60 p-4 mb-2 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-1 font-apple">
                  Data Use & Privacy Consent
                </h3>
                <p className="text-[10px] text-gray-600 mb-3 font-apple font-light">
                  Your informed consent for data use and compliance with privacy legislation
                </p>

                <div className="space-y-3">
                  {/* WO-12: SECTION 1: Pilot Consent (Required for all countries) */}
                  <div className="border-t border-indigo-200 pt-2">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2 font-apple">
                      {consentContent.title} <span className="text-red-500">*</span>
                    </h4>

                    {/* Scrollable consent text */}
                    <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3 text-[10px] text-gray-700 font-apple font-light leading-relaxed">
                      <div className="whitespace-pre-line">{consentContent.body}</div>
                    </div>

                    {/* Pilot Consent Checkbox */}
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="pilotConsent"
                          checked={formData.pilotConsent}
                          onChange={(e) => handleInputChange('pilotConsent', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                          required
                        />
                        <div className="ml-2.5 flex-1">
                          <label htmlFor="pilotConsent" className="text-xs font-semibold text-gray-900 cursor-pointer font-apple">
                            {consentContent.checkboxLabel}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Canadian Privacy Legislation Compliance (Required only for Canada) */}
                  {isCanada && (
                    <div className="border-t border-indigo-200 pt-2">
                      <h4 className="text-xs font-semibold text-gray-900 mb-2 font-apple">
                        Canadian Privacy Legislation Compliance <span className="text-red-500">*</span>
                      </h4>
                      <p className="text-[10px] text-gray-600 mb-2 font-apple font-light">
                        As a healthcare professional in Canada, you must consent to our privacy practices in accordance with applicable legislation.
                      </p>

                      {/* PHIPA Consent */}
                      <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200 mb-2">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="phipaConsent"
                            checked={formData.dataUseConsent.phipaConsent}
                            onChange={(e) => handleInputChange('dataUseConsent.phipaConsent', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                            required
                          />
                          <div className="ml-2.5 flex-1">
                            <label htmlFor="phipaConsent" className="text-xs font-semibold text-gray-900 cursor-pointer font-apple">
                              Personal Health Information Protection Act (PHIPA) Consent
                            </label>
                            <p className="text-[10px] text-gray-700 mt-1 font-apple font-light leading-relaxed">
                              I acknowledge that I have read and understood the{' '}
                              <Link to="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800 underline font-medium">
                                Privacy Policy
                              </Link>
                              {' '}and consent to the collection, use, and disclosure of my personal health information in accordance with the Personal Health Information Protection Act, 2004 (PHIPA). I understand that my information will be used solely for the purposes of providing and improving healthcare services, and that I may withdraw this consent at any time.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PIPEDA Consent */}
                      <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="pipedaConsent"
                            checked={formData.dataUseConsent.pipedaConsent}
                            onChange={(e) => handleInputChange('dataUseConsent.pipedaConsent', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                            required
                          />
                          <div className="ml-2.5 flex-1">
                            <label htmlFor="pipedaConsent" className="text-xs font-semibold text-gray-900 cursor-pointer font-apple">
                              Personal Information Protection and Electronic Documents Act (PIPEDA) Consent
                            </label>
                            <p className="text-[10px] text-gray-700 mt-1 font-apple font-light leading-relaxed">
                              I acknowledge that I have read and understood the{' '}
                              <Link to="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800 underline font-medium">
                                Privacy Policy
                              </Link>
                              {' '}and consent to the collection, use, and disclosure of my personal information in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA). I understand that my information will be protected by appropriate safeguards and that I have the right to access, correct, or request deletion of my personal information.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: AI Assistant Personalization Preferences (Optional) */}
                  <div className="border-t border-indigo-200 pt-2">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2 font-apple">
                      AI Assistant Personalization Preferences
                      <span className="text-gray-400 text-[10px] ml-1 font-normal">(optional)</span>
                    </h4>
                    <p className="text-[10px] text-gray-600 mb-2 font-apple font-light">
                      Customize how your AI assistant uses information to provide personalized clinical support.
                    </p>

                    {/* 1. Personalize with your professional style */}
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="personalizationFromClinicianInputs"
                          checked={formData.dataUseConsent.personalizationFromClinicianInputs}
                          onChange={(e) => handleInputChange('dataUseConsent.personalizationFromClinicianInputs', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                        />
                        <div className="ml-2 flex-1">
                          <label htmlFor="personalizationFromClinicianInputs" className="text-xs font-medium text-gray-700 cursor-pointer font-apple">
                            Personalize with your professional style
                          </label>
                          <p className="text-[10px] text-gray-600 mt-0.5 font-apple font-light">
                            Allow the AI assistant to use your professional information (specialty, experience, practice preferences) to tailor clinical notes and treatment suggestions to your practice style.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Personalize with patient data */}
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="personalizationFromPatientData"
                          checked={formData.dataUseConsent.personalizationFromPatientData}
                          onChange={(e) => handleInputChange('dataUseConsent.personalizationFromPatientData', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                        />
                        <div className="ml-2 flex-1">
                          <label htmlFor="personalizationFromPatientData" className="text-xs font-medium text-gray-700 cursor-pointer font-apple">
                            Personalize with patient data
                          </label>
                          <p className="text-[10px] text-gray-600 mt-0.5 font-apple font-light">
                            Allow the AI assistant to use patient clinical data (current and historical) to enrich clinical reasoning and treatment planning. This enables more contextually relevant suggestions based on patient history.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Assistant memory across sessions */}
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="allowAssistantMemoryAcrossSessions"
                          checked={formData.dataUseConsent.allowAssistantMemoryAcrossSessions}
                          onChange={(e) => handleInputChange('dataUseConsent.allowAssistantMemoryAcrossSessions', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                        />
                        <div className="ml-2 flex-1">
                          <label htmlFor="allowAssistantMemoryAcrossSessions" className="text-xs font-medium text-gray-700 cursor-pointer font-apple">
                            Assistant memory across sessions
                          </label>
                          <p className="text-[10px] text-gray-600 mt-0.5 font-apple font-light">
                            Enable the AI assistant to remember your preferences and clinical context between sessions, providing continuity and reducing repetitive input.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4. Product improvement with deidentified data */}
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="useDeidentifiedDataForProductImprovement"
                          checked={formData.dataUseConsent.useDeidentifiedDataForProductImprovement}
                          onChange={(e) => handleInputChange('dataUseConsent.useDeidentifiedDataForProductImprovement', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                        />
                        <div className="ml-2 flex-1">
                          <label htmlFor="useDeidentifiedDataForProductImprovement" className="text-xs font-medium text-gray-700 cursor-pointer font-apple">
                            Product improvement with deidentified data
                          </label>
                          <p className="text-[10px] text-gray-600 mt-0.5 font-apple font-light">
                            Allow AiduxCare to use deidentified and aggregated data (with all personal identifiers removed) to improve system quality, accuracy, and clinical outcomes. This data cannot be linked back to you or your patients.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Information Notice */}
                  <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-[10px] text-amber-800 font-apple font-light leading-relaxed">
                      <strong className="font-semibold">Important:</strong> You may withdraw any of these consents at any time by updating your preferences in your account settings. Withdrawing consent may limit certain features of the service. For detailed information about how we collect, use, and protect your information, please review our{' '}
                      <Link to="/privacy" target="_blank" className="text-amber-700 hover:text-amber-900 underline font-medium">
                        Privacy Policy
                      </Link>
                      {' '}and{' '}
                      <Link to="/terms" target="_blank" className="text-amber-700 hover:text-amber-900 underline font-medium">
                        Terms of Service
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Botones - Siempre visibles */}
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
            <Button
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              variant="outline"
              className="h-9 text-xs font-medium transition-all duration-200 font-apple"
            >
              Back
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                variant="gradient"
                loading={isLoading}
                className="h-9 text-xs font-medium shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200 font-apple"
              >
                {isLoading ? 'Completing...' : 'Complete Setup'}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                disabled={!canProceed()}
                variant="gradient"
                className="h-9 text-xs font-medium shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200 font-apple"
              >
                Next
              </Button>
            )}
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer - Compacto */}
        <div className="text-center mt-1">
          <p className="text-[10px] text-gray-500 font-apple font-light flex items-center justify-center gap-1">
            <span>🍁</span>
            <span>PHIPA Compliant • SSL Secured • 100% Canadian Data</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalOnboardingPage; 
