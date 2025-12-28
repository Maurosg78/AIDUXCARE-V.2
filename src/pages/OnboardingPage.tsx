// ⚠️ DEPRECATED: This page is being phased out in favor of ProfessionalOnboardingPage.tsx
// WO-ONB-UNIFY-01: OnboardingPage.tsx is deprecated. All onboarding now uses ProfessionalOnboardingPage.tsx
// The route /onboarding now redirects to /professional-onboarding in router.tsx
// This file is kept for backward compatibility but should not be used for new registrations.
// See ProfessionalOnboardingPage.tsx for the canonical onboarding experience.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

import type { PersonalData, ProfessionalData, LocationData, WizardStep, ValidationResult } from "../types/wizard";
import { PersonalDataStep } from "../components/wizard/PersonalDataStep";
import { ProfessionalDataStep } from "../components/wizard/ProfessionalDataStep";
import { LocationDataStep } from "../components/wizard/LocationDataStep";

import logger from '@/shared/utils/logger';
import { emailActivationService } from "../services/emailActivationService";
import styles from '@/styles/wizard.module.css';

type WizardData = {
  personal: Partial<PersonalData>;
  professional: Partial<ProfessionalData>;
  location: Partial<LocationData>;
};

const initialData: WizardData = {
  personal: {},
  professional: {},
  location: {},
};

const stepsOrder: WizardStep[] = ["personal", "professional", "location"];

export default function OnboardingPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [completionState, setCompletionState] = useState<'idle' | 'success'>('idle');

  const navigate = useNavigate();
  const currentStep = stepsOrder[currentStepIndex];

  // WO-AUTH-ONB-UNIFY-03 A1: Bloquear onboarding legacy si hay sesión activa
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser?.uid) {
      // Usuario ya autenticado - redirigir a professional onboarding
      logger.info("[ONBOARDING] User already authenticated, redirecting to professional onboarding", {
        uid: currentUser.uid,
        email: currentUser.email
      });
      navigate('/professional-onboarding', { replace: true });
      return;
    }
  }, [navigate]);

  // Inicializar valores por defecto para practicePreferences cuando se entra al step professional
  useEffect(() => {
    if (currentStep === 'professional') {
      const currentPrefs = (data.professional as any).practicePreferences || {};
      if (!currentPrefs.noteVerbosity || !currentPrefs.tone) {
        setData(prev => ({
          ...prev,
          professional: {
            ...prev.professional,
            practicePreferences: {
              ...currentPrefs,
              noteVerbosity: currentPrefs.noteVerbosity || 'standard',
              tone: currentPrefs.tone || 'formal',
            },
          },
        }));
      }
    }
  }, [currentStep]);

  const validate = (step: WizardStep): ValidationResult => {
    const errs: Record<string, string> = {};

    if (step === "personal") {
      // CTO SPEC: WIZARD 1 — Identidad profesional - campos obligatorios
      // IMPORTANTE: Onboarding ≠ Registro - NO validar password aquí
      const p = data.personal;
      if (!p.firstName?.trim()) errs.firstName = "Required";
      if (!p.lastName?.trim()) errs.lastName = "Required";
      if (!p.email?.trim()) errs.email = "Required";
      // Phone is optional per CTO spec
      if (!p.country?.trim()) errs.country = "Required";
      if (!p.province?.trim()) errs.province = "Required";
      if (!p.city?.trim()) errs.city = "Required";
      if (!(p as any).profession?.trim()) errs.profession = "Required";
      if (!(p as any).licenseNumber?.trim()) errs.licenseNumber = "Required";
      if (!(p as any).licenseCountry?.trim()) errs.licenseCountry = "Required";
      // Password/confirmPassword NO van aquí - son para REGISTRO, no para ONBOARDING
    }

    if (step === "professional") {
      // CTO SPEC: WIZARD 2 — Práctica clínica y estilo de trabajo - campos obligatorios
      const pr = data.professional;
      const yearsOfExp = (pr as any).yearsOfExperience ?? pr.experienceYears ?? '';
      if (!yearsOfExp || yearsOfExp === '' || Number(yearsOfExp) <= 0) errs.experienceYears = "Enter your years of experience";
      if (!pr.specialty?.trim()) errs.specialty = "Required";
      // Si specialty es "other", specialtyOther es requerido
      if (pr.specialty === 'other' && !(pr as any).specialtyOther?.trim()) {
        errs.specialtyOther = "Please specify your specialty";
      }
      if (!(pr as any).practiceSetting) errs.practiceSetting = "Required";
      const prefs = (pr as any).practicePreferences || {};
      if (!prefs.noteVerbosity) errs.noteVerbosity = "Required";
      if (!prefs.tone) errs.tone = "Required";
      // preferredTreatments y doNotSuggest son opcionales
    }

    if (step === "location") {
      const l = data.location;
      if (!l.country?.trim()) errs.country = "Required";
      if (!l.province?.trim()) errs.province = "Required";
      if (!l.city?.trim()) errs.city = "Required";
      if (!l.phipaConsent) errs.phipaConsent = "Accept PHIPA";
      if (!l.pipedaConsent) errs.pipedaConsent = "Accept PIPEDA";
    }

    setErrors(errs);
    return { isValid: Object.keys(errs).length === 0, errors: errs };
  };

  useEffect(() => {
    // Evitar que validate cause setState extra cuando sólo evaluamos canGoNext
    setErrors({});

  }, []);

  const canGoNext = useMemo(() => {
    const errs: Record<string, string> = {};

    if (currentStep === "personal") {
      // CTO SPEC: WIZARD 1 — Identidad profesional - campos obligatorios
      // IMPORTANTE: Onboarding ≠ Registro - NO validar password aquí
      const p = data.personal;
      if (!p.firstName?.trim()) errs.firstName = "Required";
      if (!p.lastName?.trim()) errs.lastName = "Required";
      if (!p.email?.trim()) errs.email = "Required";
      // Phone is optional per CTO spec
      if (!p.country?.trim()) errs.country = "Required";
      if (!p.province?.trim()) errs.province = "Required";
      if (!p.city?.trim()) errs.city = "Required";
      if (!(p as any).profession?.trim()) errs.profession = "Required";
      if (!(p as any).licenseNumber?.trim()) errs.licenseNumber = "Required";
      if (!(p as any).licenseCountry?.trim()) errs.licenseCountry = "Required";
      // Password/confirmPassword NO van aquí - son para REGISTRO, no para ONBOARDING
    }

    if (currentStep === "professional") {
      // CTO SPEC: WIZARD 2 — Práctica clínica y estilo de trabajo - campos obligatorios
      const pr = data.professional;
      const yearsOfExp = (pr as any).yearsOfExperience ?? pr.experienceYears ?? '';
      if (!yearsOfExp || yearsOfExp === '' || Number(yearsOfExp) <= 0) errs.experienceYears = "Enter your years of experience";
      
      // Validar especialidades (multi-select)
      const specialties = Array.isArray((pr as any).specialties) ? (pr as any).specialties : [];
      const legacySpecialty = pr.specialty?.trim();
      if (specialties.length === 0 && !legacySpecialty) {
        errs.specialty = "Select at least one specialty";
      }
      // Si "other" está seleccionado, specialtyOther es requerido
      if ((specialties.includes('other') || legacySpecialty === 'other') && !(pr as any).specialtyOther?.trim()) {
        errs.specialtyOther = "Please specify your specialty";
      }
      
      // Validar practice settings (multi-select)
      const practiceSettings = Array.isArray((pr as any).practiceSettings) ? (pr as any).practiceSettings : [];
      const legacyPracticeSetting = (pr as any).practiceSetting;
      if (practiceSettings.length === 0 && !legacyPracticeSetting) {
        errs.practiceSetting = "Select at least one practice setting";
      }
      const prefs = (pr as any).practicePreferences || {};
      if (!prefs.noteVerbosity) errs.noteVerbosity = "Required";
      if (!prefs.tone) errs.tone = "Required";
      // preferredTreatments y doNotSuggest son opcionales
    }

    if (currentStep === "location") {
      const l = data.location;
      if (!l.country?.trim()) errs.country = "Required";
      if (!l.province?.trim()) errs.province = "Required";
      if (!l.city?.trim()) errs.city = "Required";
      if (!l.phipaConsent) errs.phipaConsent = "Accept PHIPA";
      if (!l.pipedaConsent) errs.pipedaConsent = "Accept PIPEDA";
      // Password requerido para registro (permite login con email + password)
      if (!(l as any).password?.trim()) errs.password = "Create a password";
      if (!(l as any).confirmPassword?.trim()) {
        errs.confirmPassword = "Confirm your password";
      } else if ((l as any).password && (l as any).confirmPassword && (l as any).password !== (l as any).confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    }

    return Object.keys(errs).length === 0;
  }, [currentStep, data]);

  const onFieldChange = (field: string, value: any) => {
    setData((prev) => {
      if (currentStep === "personal") return { ...prev, personal: { ...prev.personal, [field]: value } };
      if (currentStep === "professional") return { ...prev, professional: { ...prev.professional, [field]: value } };
      return { ...prev, location: { ...prev.location, [field]: value } };
    });
  };

  const goNext = () => {
    const result = validate(currentStep);
    if (!result.isValid) return;
    setCurrentStepIndex((i) => Math.min(i + 1, stepsOrder.length - 1));
    setErrors({});
  };

  const goBack = () => {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
    setErrors({});
  };

  const finish = async () => {
    const lastValidation = validate("location");
    if (!lastValidation.isValid) return;

    // WO-AUTH-ONB-UNIFY-03 A1: NO llamar registerProfessional si ya hay sesión activa
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser?.uid) {
      logger.warn("[ONBOARDING] Attempted registration with active session, redirecting", {
        uid: currentUser.uid
      });
      navigate('/professional-onboarding', { replace: true });
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    try {
      // Combine phoneCountryCode and phone into full phone number
      // Ensure proper format: +[country code][area code][number] (no spaces, no dashes)
      const phoneCountryCode = (data.personal as any).phoneCountryCode?.trim() || '+1';
      const phoneNumber = data.personal.phone?.trim() || '';
      // Remove all non-digit characters from phone number, then combine
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const fullPhone = phoneCountryCode && cleanPhoneNumber
        ? `${phoneCountryCode}${cleanPhoneNumber}`
        : '';

      // CTO SPEC: Construir payload según estructura canónica
      // IMPORTANTE: password viene de location (registro), no de personal (onboarding)
      const payload = {
        email: data.personal.email ?? "",
        password: (data.location as any).password ?? "", // Password va en location (registro)
        firstName: data.personal.firstName ?? "",
        lastName: data.personal.lastName ?? "",
        preferredName: (data.personal as any).preferredName ?? undefined,
        phone: fullPhone,
        country: data.personal.country ?? data.location.country ?? "",
        province: data.personal.province ?? data.location.province ?? "",
        city: data.personal.city ?? data.location.city ?? "",
        profession: (data.personal as any).profession ?? "",
        professionalTitle: (data.personal as any).profession ?? "",
        licenseNumber: (data.personal as any).licenseNumber ?? "",
        licenseCountry: (data.personal as any).licenseCountry ?? "",
        // CTO SPEC: Soporte para múltiples especialidades
        specialty: Array.isArray((data.professional as any).specialties) && (data.professional as any).specialties.length > 0
          ? (data.professional as any).specialties[0] // Primera especialidad para compatibilidad
          : (data.professional.specialty ?? ""),
        specialties: Array.isArray((data.professional as any).specialties) 
          ? (data.professional as any).specialties 
          : (data.professional.specialty ? [data.professional.specialty] : []),
        specialtyOther: (data.professional as any).specialtyOther ?? undefined,
        // CTO SPEC: Wizard 2 fields
        yearsOfExperience: (data.professional as any).yearsOfExperience ?? data.professional.experienceYears ?? 0,
        practiceSetting: (data.professional as any).practiceSetting ?? '',
        practicePreferences: (data.professional as any).practicePreferences ?? {},
        // Legacy fields for backward compatibility with registerProfessional service
        workplace: data.professional.workplace ?? "",
        university: data.professional.university ?? "",
        experienceYears: (data.professional as any).yearsOfExperience ?? data.professional.experienceYears ?? 0,
        mskSkills: (data.professional as any).mskSkills ?? "",
        mskSkillsOther: (data.professional as any).mskSkillsOther ?? "",
      };

      const result = await emailActivationService.registerProfessional({
        email: payload.email,
        displayName: `${payload.firstName} ${payload.lastName}`.trim(),
        professionalTitle: payload.professionalTitle || 'Healthcare Professional',
        specialty: payload.specialty || 'General Practice',
        university: payload.university || undefined,
        experienceYears: Number.isFinite(payload.experienceYears) ? payload.experienceYears : undefined,
        workplace: payload.workplace || undefined,
        mskSkills: payload.mskSkills || undefined,
        mskSkillsOther: payload.mskSkillsOther || undefined,
        country: payload.country || 'Canada',
        city: payload.city || undefined,
        province: payload.province || undefined,
        phone: payload.phone || undefined,
        licenseNumber: payload.licenseNumber || undefined,
        registrationDate: new Date(),
      }, payload.password);

      if (result.success) {
        logger.info("[ONBOARDING] Professional registered", { email: payload.email });
        setCompletionState('success');
      } else {
        logger.error("[ONBOARDING] Registration failed", { message: result.message });
        setSubmissionError(result.message || "We could not complete your registration. Please try again.");
      }
    } catch (error) {
      logger.error("[ONBOARDING] Registration error", error);
      setSubmissionError("We could not complete your registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (completionState !== 'success') return;

    // Dar tiempo suficiente para que el usuario lea el mensaje (7 segundos)
    const timeout = window.setTimeout(() => {
      navigate('/', {
        replace: true,
        state: {
          type: 'success',
          message: 'Registration completed. Check your email to activate your account.',
        },
      });
    }, 7000);

    return () => window.clearTimeout(timeout);
  }, [completionState, navigate]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Professional Registration</span>
          <h1 className={styles.headline}>
            Welcome to <span className={styles.headlineAccent}>AiduxCare</span>
            <span className="ml-2 text-2xl">🍁</span>
          </h1>
          <p className={styles.subheadline}>
            Your intelligent medico-legal support in Canada—protecting your clinical practice while operating under PHIPA & PIPEDA.
          </p>
        </header>

        <ol className={styles.progressList}>
          {stepsOrder.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex || completionState === 'success';
            const badgeClass = isCompleted
              ? `${styles.progressBadge} ${styles.progressBadgeCompleted}`
              : isActive
                ? `${styles.progressBadge} ${styles.progressBadgeActive}`
                : `${styles.progressBadge} ${styles.progressBadgeIdle}`;

            return (
              <React.Fragment key={step}>
                <li className={styles.progressItem}>
                  <span className={badgeClass}>{isCompleted ? '✓' : index + 1}</span>
                  <span className={styles.progressText}>
                    <span className={styles.progressTitle}>
                      {step === 'personal' && 'Personal details'}
                      {step === 'professional' && 'Professional profile'}
                      {step === 'location' && 'Compliance review'}
                    </span>
                    <span className={styles.progressDescription}>
                      {step === 'personal' && 'Identity and contact verification'}
                      {step === 'professional' && 'Regulated credentials & experience'}
                      {step === 'location' && 'PHIPA / PIPEDA acknowledgements'}
                    </span>
                  </span>
                </li>
                {index < stepsOrder.length - 1 && (
                  <span
                    className={
                      isCompleted
                        ? `${styles.progressConnector} ${styles.progressConnectorActive}`
                        : styles.progressConnector
                    }
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>

        {completionState === 'success' ? (
          <div className={styles.successCard}>
            <span className={styles.successIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <p className={styles.successTitle}>Registration received</p>
            <p className={styles.successSubtitle}>
              Check your inbox to verify the account. We will redirect you to the login screen shortly.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate('/', {
                  replace: true,
                  state: {
                    type: 'success',
                    message: 'Registration completed. Check your email to activate your account.',
                  },
                })
              }
              className={styles.successButton}
            >
              Go to login now
            </button>
          </div>
        ) : (
          <>
            {currentStep === 'personal' && (
              <PersonalDataStep
                data={data.personal as PersonalData}
                errors={errors}
                onFieldChange={onFieldChange}
              />
            )}
            {currentStep === 'professional' && (
              <ProfessionalDataStep
                data={data.professional as ProfessionalData}
                errors={errors}
                onFieldChange={onFieldChange}
              />
            )}
            {currentStep === 'location' && (
              <LocationDataStep
                data={data.location as LocationData}
                errors={errors}
                onFieldChange={onFieldChange}
                personalData={{
                  country: data.personal.country,
                  province: data.personal.province,
                  city: data.personal.city,
                }}
              />
            )}
          </>
        )}

        {submissionError && completionState !== 'success' && (
          <div className={styles.alertError}>{submissionError}</div>
        )}

        {completionState !== 'success' && (
          <div className={styles.buttonRow}>
            <button
              onClick={goBack}
              disabled={currentStepIndex === 0 || submitting}
              className={styles.buttonSecondary}
              type="button"
            >
              Back
            </button>

            {currentStepIndex < stepsOrder.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!canGoNext || submitting}
                className={styles.buttonPrimary}
                type="button"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={!canGoNext || submitting}
                className={styles.buttonPrimary}
                type="button"
              >
                {submitting ? 'Submitting…' : 'Complete registration'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
