/**
 * ✅ CANONICAL PERSONAL DATA STEP - WIZARD 1
 * 
 * CTO SPEC: WIZARD 1 — Identidad profesional
 * 
 * Campos exactos según especificación CTO (WIZARD 1 — Identidad profesional):
 * - firstName * (Required)
 * - lastName * (Required)
 * - preferredName (Optional)
 * - email * (Required, readonly si viene de auth)
 * - phone (Optional, E.164 format)
 * - country * (Required)
 * - province * (Required, province/state)
 * - city * (Required)
 * - profession * (Required, physiotherapist, etc.)
 * - licenseNumber * (Required)
 * - licenseCountry * (Required, issuingBody)
 * 
 * IMPORTANTE: NO incluir password/confirmPassword aquí
 * - Onboarding ≠ Registro
 * - Registro = Auth (createUserWithEmailAndPassword) - va en otro lugar
 * - Onboarding = Perfil profesional - solo estos campos
 * 
 * DoD técnico:
 * - Persistir EXCLUSIVAMENTE en users/{uid}
 * - Campos normalizados (no duplicados en otros servicios)
 * - registrationStatus pasa de incomplete → sigue incomplete
 * - Accesibles desde useProfessionalProfile() y PromptFactory (solo lectura)
 * 
 * DESIGN SYSTEM: Apple-style typography, legible y amigable
 * - font-apple en todo
 * - text-[15px] para body, text-sm para labels
 * - h-11 para inputs (44px - Apple standard)
 * - Grid de 3 columnas para aprovechar ancho
 * - Todo visible en pantalla 13" sin scroll
 */

// @ts-nocheck
import React, { useCallback } from 'react';

import styles from '@/styles/wizard.module.css';
import LocationAwarenessModal from './LocationAwarenessModal';

const CANADIAN_PROVINCES = [
  { value: 'ab', label: 'Alberta' },
  { value: 'bc', label: 'British Columbia' },
  { value: 'mb', label: 'Manitoba' },
  { value: 'nb', label: 'New Brunswick' },
  { value: 'nl', label: 'Newfoundland and Labrador' },
  { value: 'ns', label: 'Nova Scotia' },
  { value: 'nt', label: 'Northwest Territories' },
  { value: 'nu', label: 'Nunavut' },
  { value: 'on', label: 'Ontario' },
  { value: 'pe', label: 'Prince Edward Island' },
  { value: 'qc', label: 'Quebec' },
  { value: 'sk', label: 'Saskatchewan' },
  { value: 'yt', label: 'Yukon' },
];

const SUPPORTED_COUNTRIES = [
  { value: 'ca', label: 'Canada' },
  { value: 'us', label: 'United States' },
  { value: 'mx', label: 'Mexico' },
  { value: 'other', label: 'Other' },
];

// CTO SPEC: WIZARD 1 — Identidad profesional
// IMPORTANTE: Onboarding ≠ Registro
// - Registro = Auth (createUserWithEmailAndPassword) - NO va aquí
// - Onboarding = Perfil profesional - Solo estos campos
export type PersonalFormData = {
  firstName?: string; // Required
  lastName?: string; // Required
  preferredName?: string; // Opcional
  email?: string; // Required, readonly si viene de auth
  phone?: string; // Opcional
  phoneCountryCode?: string; // E.164 format
  country?: string; // Required
  province?: string; // Required (province/state)
  city?: string; // Required
  profession?: string; // Required (physiotherapist, etc.)
  licenseNumber?: string; // Required
  licenseCountry?: string; // Required (issuingBody)
  // NO password/confirmPassword - eso es para REGISTRO, no para ONBOARDING
};

type Props = {
  data: PersonalFormData;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof PersonalFormData, value: string) => void;
  onLocationDetected?: (loc: { country?: string; province?: string; city?: string }) => void;
};

export const PersonalDataStep: React.FC<Props> = ({
  data,
  errors,
  onFieldChange,
  onLocationDetected,
}) => {
  const handleField = useCallback(
    (field: keyof PersonalFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onFieldChange(field, e.target.value),
    [onFieldChange]
  );

  const handleManualCountrySelection = (code: string) => {
    onFieldChange('country', code);
    if (onLocationDetected) onLocationDetected({ country: code });
  };

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2 className="text-xl font-medium text-gray-900 mb-2 font-apple">
          Professional Identity
        </h2>
        <p className="text-[15px] text-gray-600 font-light leading-[1.5] font-apple">
          Who you are within AiDuxCare
        </p>
      </header>

      {/* DESIGN SYSTEM: Grid de 3 columnas para aprovechar ancho, Apple-style inputs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '16px',
      }}>
        {/* First Name - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            First Name <span className="text-red-500 font-medium">*</span>
          </label>
          <input
            value={data.firstName ?? ''}
            onChange={handleField('firstName')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            placeholder="Alexandra"
            required
          />
          {errors?.firstName && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.firstName}</p>}
        </div>

        {/* Last Name - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            Last Name <span className="text-red-500 font-medium">*</span>
          </label>
          <input
            value={data.lastName ?? ''}
            onChange={handleField('lastName')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            placeholder="Bennett"
            required
          />
          {errors?.lastName && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.lastName}</p>}
        </div>

        {/* Preferred Name - Optional */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            Preferred Name <span className="text-gray-400 text-[12px] font-light">(optional)</span>
          </label>
          <input
            value={data.preferredName ?? ''}
            onChange={handleField('preferredName')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            placeholder="Alex"
          />
        </div>

        {/* Email - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            Email <span className="text-red-500 font-medium">*</span>
          </label>
          <input
            type="email"
            value={data.email ?? ''}
            onChange={handleField('email')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            placeholder="you@clinic.ca"
            required
          />
          {errors?.email && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.email}</p>}
        </div>

        {/* Phone - Optional, spans 2 columns */}
        <div className={styles.fieldGroup} style={{ gridColumn: 'span 2' }}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            Phone <span className="text-gray-400 text-[12px] font-light">(optional)</span>
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={data.phoneCountryCode ?? '+1'}
              onChange={handleField('phoneCountryCode')}
              className="h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
              style={{ width: '140px', flexShrink: 0 }}
            >
              <option value="+1">🇨🇦 +1</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+52">🇲🇽 +52</option>
              <option value="+34">🇪🇸 +34</option>
              <option value="+44">🇬🇧 +44</option>
            </select>
            <input
              value={data.phone ?? ''}
              onChange={handleField('phone')}
              className="flex-1 h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
              placeholder="5551234567"
            />
          </div>
          {(errors?.phoneCountryCode || errors?.phone) && (
            <p className="text-[12px] text-red-600 mt-1 font-apple font-light">
              {errors?.phoneCountryCode ?? errors?.phone}
            </p>
          )}
        </div>

        {/* Country - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            Country <span className="text-red-500 font-medium">*</span>
          </label>
          <select
            value={data.country ?? ''}
            onChange={handleField('country')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            required
          >
            <option value="" disabled>
              Select your country
            </option>
            {SUPPORTED_COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          {errors?.country && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.country}</p>}
        </div>

        {/* Province - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            Province / State <span className="text-red-500 font-medium">*</span>
          </label>
          <select
            value={data.province ?? ''}
            onChange={handleField('province')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            required
          >
            <option value="" disabled>
              Select your province
            </option>
            {CANADIAN_PROVINCES.map((province) => (
              <option key={province.value} value={province.label}>
                {province.label}
              </option>
            ))}
          </select>
          {errors?.province && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.province}</p>}
        </div>

        {/* City - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            City <span className="text-red-500 font-medium">*</span>
          </label>
          <input
            value={data.city ?? ''}
            onChange={handleField('city')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            placeholder="Toronto"
            required
          />
          {errors?.city && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.city}</p>}
        </div>

        {/* Profession - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            Profession <span className="text-red-500 font-medium">*</span>
          </label>
          <select
            value={data.profession ?? ''}
            onChange={handleField('profession')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            required
          >
            <option value="" disabled>
              Select your profession
            </option>
            <option value="Physiotherapist">Physiotherapist</option>
            <option value="Physical Therapist">Physical Therapist</option>
            <option value="Occupational Therapist">Occupational Therapist</option>
            <option value="Speech Therapist">Speech Therapist</option>
            <option value="Registered Nurse">Registered Nurse</option>
            <option value="Nurse Practitioner">Nurse Practitioner</option>
            <option value="Physician">Physician</option>
            <option value="Psychologist">Psychologist</option>
            <option value="Social Worker">Social Worker</option>
            <option value="Other">Other</option>
          </select>
          {errors?.profession && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.profession}</p>}
        </div>

        {/* License Number - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            License Number <span className="text-red-500 font-medium">*</span>
          </label>
          <input
            value={data.licenseNumber ?? ''}
            onChange={handleField('licenseNumber')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            placeholder="CPO-000000"
            required
          />
          {errors?.licenseNumber && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.licenseNumber}</p>}
        </div>

        {/* License Country - Required */}
        <div className={styles.fieldGroup}>
          <label className="block text-sm font-normal text-gray-700 mb-2 font-apple">
            License Country <span className="text-red-500 font-medium">*</span>
          </label>
          <select
            value={data.licenseCountry ?? ''}
            onChange={handleField('licenseCountry')}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
            required
          >
            <option value="" disabled>
              Select license country
            </option>
            {SUPPORTED_COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          {errors?.licenseCountry && <p className="text-[12px] text-red-600 mt-1 font-apple font-light">{errors.licenseCountry}</p>}
        </div>

      </div>

      <LocationAwarenessModal
        isOpen={false}
        onClose={() => {}}
        onLocationSelected={handleManualCountrySelection}
        onUseCurrentLocation={() => {}}
      />
    </section>
  );
};

export default PersonalDataStep;
