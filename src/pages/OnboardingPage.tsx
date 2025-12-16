// ✅ CANONICAL ONBOARDING PAGE
// This is the ONE canonical onboarding page for AiduxCare
// - Language: English
// - Structure: 3-step wizard (Personal → Professional → Location)
// - Compliance: PHIPA/PIPEDA compliant
// - Brand: AiduxCare (not AiDuxCare)
// See docs/CANONICAL_ONBOARDING_IDENTIFICATION.md for verification
// DO NOT REPLACE WITH ProfessionalOnboardingPage.tsx (deprecated Spanish version)

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const validate = (step: WizardStep): ValidationResult => {
    const errs: Record<string, string> = {};

    if (step === "personal") {
      const p = data.personal;
      if (!p.firstName?.trim()) errs.firstName = "Required";
      if (!p.lastName?.trim()) errs.lastName = "Required";
      if (!p.email?.trim()) errs.email = "Required";
      // Phone validation: check if phoneCountryCode and phone are both filled
      const phoneCountryCode = (p as any).phoneCountryCode?.trim() || '';
      const phoneNumber = p.phone?.trim() || '';
      if (!phoneCountryCode || !phoneNumber) {
        errs.phone = "Phone number is required";
      }
      if (!p.password?.trim()) errs.password = "Create a password";
      if (!p.confirmPassword?.trim()) {
        errs.confirmPassword = "Confirm your password";
      } else if (p.password !== p.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
      if (!p.country?.trim()) errs.country = "Required";
      if (!p.province?.trim()) errs.province = "Required";
      if (!p.city?.trim()) errs.city = "Required";
    }

    if (step === "professional") {
      const pr = data.professional;
      if (!pr.professionalTitle?.trim()) errs.professionalTitle = "Required";
      if (!pr.specialty?.trim()) errs.specialty = "Required";
      if (!pr.university?.trim()) errs.university = "Required";
      if (!pr.licenseNumber?.trim()) errs.licenseNumber = "Required";
      if (!pr.workplace?.trim()) errs.workplace = "Required";
      if (!pr.experienceYears || Number(pr.experienceYears) <= 0) errs.experienceYears = "Enter your years of experience";
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
      const p = data.personal;
      if (!p.firstName?.trim()) errs.firstName = "Required";
      if (!p.lastName?.trim()) errs.lastName = "Required";
      if (!p.email?.trim()) errs.email = "Required";
      // Phone validation: check if phoneCountryCode and phone are both filled
      const phoneCountryCode = (p as any).phoneCountryCode?.trim() || '';
      const phoneNumber = p.phone?.trim() || '';
      if (!phoneCountryCode || !phoneNumber) {
        errs.phone = "Phone number is required";
      }
      if (!p.password?.trim()) errs.password = "Create a password";
      if (!p.confirmPassword?.trim()) errs.confirmPassword = "Confirm your password";
      if (p.password && p.confirmPassword && p.password !== p.confirmPassword) errs.confirmPassword = "Passwords do not match";
      if (!p.country?.trim()) errs.country = "Required";
      if (!p.province?.trim()) errs.province = "Required";
      if (!p.city?.trim()) errs.city = "Required";
    }

    if (currentStep === "professional") {
      const pr = data.professional;
      if (!pr.professionalTitle?.trim()) errs.professionalTitle = "Required";
      if (!pr.specialty?.trim()) errs.specialty = "Required";
      if (!pr.university?.trim()) errs.university = "Required";
      if (!pr.licenseNumber?.trim()) errs.licenseNumber = "Required";
      if (!pr.workplace?.trim()) errs.workplace = "Required";
      if (!pr.experienceYears || Number(pr.experienceYears) <= 0) errs.experienceYears = "Enter your years of experience";
    }

    if (currentStep === "location") {
      const l = data.location;
      if (!l.country?.trim()) errs.country = "Required";
      if (!l.province?.trim()) errs.province = "Required";
      if (!l.city?.trim()) errs.city = "Required";
      if (!l.phipaConsent) errs.phipaConsent = "Accept PHIPA";
      if (!l.pipedaConsent) errs.pipedaConsent = "Accept PIPEDA";
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

      const payload = {
        email: data.personal.email ?? "",
        password: data.personal.password ?? "",
        firstName: data.personal.firstName ?? "",
        lastName: data.personal.lastName ?? "",
        phone: fullPhone,
        professionalTitle: data.professional.professionalTitle ?? "",
        specialty: data.professional.specialty ?? "",
        licenseNumber: data.professional.licenseNumber ?? "",
        workplace: data.professional.workplace ?? "",
        university: data.professional.university ?? "",
        experienceYears: data.professional.experienceYears ?? 0,
        mskSkills: (data.professional as any).mskSkills ?? "",
        mskSkillsOther: (data.professional as any).mskSkillsOther ?? "",
        country: data.location.country ?? "",
        province: data.location.province ?? "",
        city: data.location.city ?? "",
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
                personalData={data.personal}
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
