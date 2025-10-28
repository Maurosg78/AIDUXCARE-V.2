import React, { useMemo, useState } from "react";

import type { PersonalData, ProfessionalData, LocationData, WizardStep, ValidationResult } from "../types/wizard";
import { PersonalDataStep } from "../components/wizard/PersonalDataStep";
import { ProfessionalDataStep } from "../components/wizard/ProfessionalDataStep";
import { LocationDataStep } from "../components/wizard/LocationDataStep";

import logger from '@/shared/utils/logger';

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

const stepsOrder = ["personal", "professional", "location"];

export default function OnboardingPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentStep = stepsOrder[currentStepIndex];

  // ==== Validaciones mínimas por paso (alineadas con tus steps legales) ====
  const validate = (step: WizardStep): ValidationResult => {
    const errs: Record<string, string> = {};

    if (String(step) === "personal") {
      const p = data.personal;
      if (!p.firstName?.trim()) errs.firstName = "Requerido";
      if (!p.lastName?.trim()) errs.lastName = "Requerido";
      if (!p.email?.trim()) errs.email = "Requerido";
      // Teléfono no siempre obligatorio, se permite vacío.
    }

    if (String(step) === "professional") {
      const pr = data.professional;
      if (!pr.professionalTitle?.trim()) errs.professionalTitle = "Requerido";
      if (!pr.specialty?.trim()) errs.specialty = "Requerido";
      if (!pr.university?.trim()) errs.university = "Requerido";
      if (!pr.licenseNumber?.trim()) errs.licenseNumber = "Requerido";
      if (!pr.workplace?.trim()) errs.workplace = "Requerido";
      if (!pr.experienceYears || Number(pr.experienceYears) <= 0) errs.experienceYears = "Requerido";
    }

    if (String(step) === "location") {
      const l = data.location;
      if (!l.country?.trim()) errs.country = "Requerido";
      if (!l.province?.trim()) errs.province = "Requerido";
      if (!l.city?.trim()) errs.city = "Requerido";
      // Consentimientos mínimos: GDPR + HIPAA; dataProcessing si tu step lo usa.
    }

    setErrors(errs);
    return { isValid: Object.keys(errs).length === 0, errors: errs };
  };

  // Validación on-the-fly para habilitar el botón Siguiente
  const canGoNext = useMemo(() => validate(currentStep as WizardStep).isValid, [data, currentStep]);

  // ==== Handlers de campos (mantienen shape LEGACY) ====
  const onFieldChange = (field: string, value: any) => {
    setData(prev => {
      if (String(currentStep) === "personal") return { ...prev, personal: { ...prev.personal, [field]: value } };
      if (String(currentStep) === "professional") return { ...prev, professional: { ...prev.professional, [field]: value } };
      return { ...prev, location: { ...prev.location, [field]: value } };
    });
  };

  // ==== Navegación ====
  const goNext = () => {
    const result = validate(currentStep as WizardStep);
    if (!result.isValid) return;
    setCurrentStepIndex(i => Math.min(i + 1, stepsOrder.length - 1));
  };

  const goBack = () => setCurrentStepIndex(i => Math.max(i - 1, 0));

  const finish = () => {
    const lastValidation = validate("location");
    if (!lastValidation.isValid) return;
    // Aquí va tu persistencia/auditoría real (Firestore/REST/etc).
    // Por ahora solo dejamos un log claro:
    // eslint-disable-next-line no-console
    logger.info("✅ Wizard COMPLETO (legacy):", data);
    alert("¡Registro completado!");
  };

  // ==== Render de paso ====
  return (
    <div className="min-h-screen bg-white md:bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        {String(currentStep) === "personal" && (
          <PersonalDataStep
            data={data.personal as PersonalData}
            errors={errors}
            onFieldChange={onFieldChange}
          />
        )}

        {String(currentStep) === "professional" && (
          <ProfessionalDataStep
            data={data.professional as ProfessionalData}
            errors={errors}
            onFieldChange={onFieldChange}
          />
        )}

        {String(currentStep) === "location" && (
          <LocationDataStep
            data={data.location as LocationData}
            errors={errors}
            onFieldChange={onFieldChange}
            // Tus steps legacy aceptan onValidation; le pasamos nuestra función

            locationData={undefined}
          />
        )}

        {/* Footer de navegación consistente con el LEGACY */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Anterior
          </button>

          {currentStepIndex < stepsOrder.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-fuchsia-500 to-blue-500 disabled:opacity-50"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={!canGoNext}
              className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-fuchsia-500 to-blue-500 disabled:opacity-50"
            >
              Completar Registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
