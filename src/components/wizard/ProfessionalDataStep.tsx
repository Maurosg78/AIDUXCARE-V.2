/**
 * ✅ CANONICAL PROFESSIONAL DATA STEP - WIZARD 2
 * 
 * CTO SPEC: WIZARD 2 — Práctica clínica y estilo de trabajo
 * 
 * Campos exactos según especificación CTO:
 * - yearsOfExperience * (Required)
 * - specialty / focus * (Required) - Select con opciones predefinidas (MSK focus)
 * - practiceSetting * (Required: clinic, hospital, home-care, mixed)
 * - practicePreferences.noteVerbosity (Required: concise, standard, detailed)
 * - practicePreferences.tone (Required: formal, friendly, educational)
 * - practicePreferences.preferredTreatments[] (Optional: checkboxes from MSK_SKILLS)
 * - practicePreferences.doNotSuggest[] (Optional: checkboxes from MSK_SKILLS)
 * 
 * DoD técnico:
 * - Guardar dentro de users/{uid}.practicePreferences
 * - NO derivar defaults si están vacíos
 * - En PromptFactory: inyectar solo si existen, omitir si no hay consentimiento
 * 
 * DESIGN SYSTEM: Apple-style typography, legible y amigable
 * - Grid de 3 columnas para aprovechar ancho
 * - Todo visible en pantalla 13" sin scroll
 */

// @ts-nocheck
import React, { useState } from "react";
import styles from '@/styles/wizard.module.css';
import type { ProfessionalData } from "../../types/wizard";
import { PRIMARY_SPECIALTIES, MSK_SKILLS } from './onboardingConstants';
import { Select } from '../ui/Select';

interface ProfessionalDataStepProps {
  data: ProfessionalData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | number | string[] | object) => void;
}

const PRACTICE_SETTINGS = [
  { value: 'clinic', label: 'Clinic' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'home-care', label: 'Home Care' },
  { value: 'mixed', label: 'Mixed' },
];

const NOTE_VERBOSITY_OPTIONS = [
  { value: 'concise', label: 'Concise' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' },
];

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'educational', label: 'Educational' },
];

export const ProfessionalDataStep: React.FC<ProfessionalDataStepProps> = ({
  data,
  errors,
  onFieldChange,
}) => {
  const practicePreferences = (data as any).practicePreferences || {};
  // Asegurar que noteVerbosity y tone tengan valores por defecto si no existen
  if (!practicePreferences.noteVerbosity) {
    practicePreferences.noteVerbosity = 'standard';
  }
  if (!practicePreferences.tone) {
    practicePreferences.tone = 'formal';
  }
  const preferredTreatments = Array.isArray(practicePreferences.preferredTreatments)
    ? practicePreferences.preferredTreatments
    : [];
  const doNotSuggest = Array.isArray(practicePreferences.doNotSuggest)
    ? practicePreferences.doNotSuggest
    : [];

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value: string | number = event.target.value;
    if (field === 'yearsOfExperience' || field === 'experienceYears') {
      // Permitir borrar el campo (vacío) y luego convertir a número
      if (value === '') {
        onFieldChange('yearsOfExperience', '');
        return;
      }
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0) {
        value = numValue;
      } else {
        return; // No actualizar si no es un número válido
      }
    }
    onFieldChange(field, value);
  };

  // Manejar selección múltiple de especialidades
  const handleSpecialtyToggle = (specialtyValue: string) => {
    const currentSpecialties = Array.isArray((data as any).specialties) 
      ? (data as any).specialties 
      : ((data as any).specialty ? [(data as any).specialty] : []);
    
    const newSpecialties = currentSpecialties.includes(specialtyValue)
      ? currentSpecialties.filter((s: string) => s !== specialtyValue)
      : [...currentSpecialties, specialtyValue];
    
    // Mantener compatibilidad: si solo hay una especialidad, también guardar en 'specialty'
    if (newSpecialties.length === 1) {
      onFieldChange('specialty', newSpecialties[0]);
    } else {
      onFieldChange('specialty', ''); // Limpiar si hay múltiples
    }
    onFieldChange('specialties', newSpecialties);
  };

  // Manejar selección múltiple de practice settings
  const handlePracticeSettingToggle = (settingValue: string) => {
    const currentSettings = Array.isArray((data as any).practiceSettings)
      ? (data as any).practiceSettings
      : ((data as any).practiceSetting ? [(data as any).practiceSetting] : []);
    
    const newSettings = currentSettings.includes(settingValue)
      ? currentSettings.filter((s: string) => s !== settingValue)
      : [...currentSettings, settingValue];
    
    // Mantener compatibilidad: si solo hay un setting, también guardar en 'practiceSetting'
    if (newSettings.length === 1) {
      onFieldChange('practiceSetting', newSettings[0]);
    } else {
      onFieldChange('practiceSetting', ''); // Limpiar si hay múltiples
    }
    onFieldChange('practiceSettings', newSettings);
  };

  const handlePracticePreferenceChange = (prefField: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    const currentPrefs = (data as any).practicePreferences || {};
    onFieldChange('practicePreferences', {
      ...currentPrefs,
      [prefField]: value,
    });
  };

  const handleTreatmentToggle = (treatmentValue: string, isPreferred: boolean) => {
    const currentPrefs = (data as any).practicePreferences || {};
    const field = isPreferred ? 'preferredTreatments' : 'doNotSuggest';
    const currentArray = Array.isArray(currentPrefs[field]) ? currentPrefs[field] : [];
    
    const newArray = currentArray.includes(treatmentValue)
      ? currentArray.filter((item: string) => item !== treatmentValue)
      : [...currentArray, treatmentValue];
    
    onFieldChange('practicePreferences', {
      ...currentPrefs,
      [field]: newArray,
    });
  };

  const handleOtherSpecialtyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onFieldChange('specialtyOther', value);
  };

  // Soporte para múltiples especialidades
  const selectedSpecialties = Array.isArray((data as any).specialties) 
    ? (data as any).specialties 
    : ((data as any).specialty ? [(data as any).specialty] : []);
  const hasMSK = selectedSpecialties.includes('msk');
  const showOtherSpecialty = selectedSpecialties.includes('other') || 
    (selectedSpecialties.length === 0 && (data as any).specialtyOther);

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader} style={{ marginBottom: '1rem' }}>
        <h2 className={styles.sectionTitle}>Clinical Practice & Work Style</h2>
        <p className={styles.sectionDescription} style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          How you work and how you want AiduxCare to help you. This information personalizes your assistant's output.
        </p>
      </header>

      {/* Row 1: Years of Experience, Specialty */}
      <div className={`${styles.fieldGrid} ${styles.fieldGridThree}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Years of Experience <span style={{ color: '#b91c1c', fontWeight: 500 }}>*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={(data as any).yearsOfExperience ?? data.experienceYears ?? ''}
            onChange={handleChange("yearsOfExperience")}
            className={styles.textInput}
            placeholder="5"
            required
            style={{ height: '36px' }}
          />
          {errors?.experienceYears && <p className={styles.helperText} style={{ color: '#b91c1c', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.experienceYears}</p>}
        </div>

        <div className={styles.fieldGroup} style={{ gridColumn: 'span 2' }}>
          <label className={styles.fieldLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>
            Specialty / Focus <span style={{ color: '#b91c1c', fontWeight: 500 }}>*</span>
            <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              (select all that apply)
            </span>
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.5rem',
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: '#f9fafb',
          }}>
            {PRIMARY_SPECIALTIES.map((specialty) => (
              <label
                key={specialty.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '0.25rem',
                  transition: 'background-color 0.15s',
                  fontSize: '0.875rem',
                  backgroundColor: selectedSpecialties.includes(specialty.value) ? '#dbeafe' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!selectedSpecialties.includes(specialty.value)) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedSpecialties.includes(specialty.value)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSpecialties.includes(specialty.value)}
                  onChange={() => handleSpecialtyToggle(specialty.value)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#2563eb',
                  }}
                />
                <span style={{ color: '#374151', userSelect: 'none', fontWeight: selectedSpecialties.includes(specialty.value) ? 500 : 400 }}>
                  {specialty.label}
                </span>
              </label>
            ))}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                cursor: 'pointer',
                borderRadius: '0.25rem',
                transition: 'background-color 0.15s',
                fontSize: '0.875rem',
                backgroundColor: selectedSpecialties.includes('other') ? '#dbeafe' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!selectedSpecialties.includes('other')) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSpecialties.includes('other')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <input
                type="checkbox"
                checked={selectedSpecialties.includes('other')}
                onChange={() => handleSpecialtyToggle('other')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#2563eb',
                }}
              />
              <span style={{ color: '#374151', userSelect: 'none', fontWeight: selectedSpecialties.includes('other') ? 500 : 400 }}>
                Other (specify below)
              </span>
            </label>
          </div>
          {selectedSpecialties.length > 0 && (
            <p className={styles.helperText} style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#059669' }}>
              {selectedSpecialties.length} specialt{selectedSpecialties.length !== 1 ? 'ies' : 'y'} selected
            </p>
          )}
        </div>
      </div>

      {/* Other Specialty Input (if "Other" selected) */}
      {showOtherSpecialty && (
        <div className={styles.fieldGroup} style={{ marginTop: '0.5rem' }}>
          <label className={styles.fieldLabel}>
            Specify Specialty <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.875rem' }}>(if not listed)</span>
          </label>
          <input
            type="text"
            value={(data as any).specialtyOther || ''}
            onChange={handleOtherSpecialtyChange}
            className={styles.textInput}
            placeholder="e.g., Sports Medicine, Pain Management..."
            style={{ height: '36px' }}
          />
        </div>
      )}

      {/* MSK Treatment Preferences - Combined section (only show when MSK is selected) */}
      {hasMSK && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}>
            {/* Preferred Treatments */}
            <div>
              <label className={styles.fieldLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>
                Preferred Treatments <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.875rem' }}>(optional)</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '0.375rem',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#f9fafb',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {MSK_SKILLS.map((skill) => (
                  <label
                    key={skill.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.5rem',
                      cursor: 'pointer',
                      borderRadius: '0.25rem',
                      transition: 'background-color 0.15s',
                      fontSize: '0.875rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={preferredTreatments.includes(skill.value)}
                      onChange={() => handleTreatmentToggle(skill.value, true)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#2563eb',
                      }}
                    />
                    <span style={{ color: '#374151', userSelect: 'none' }}>
                      {skill.label}
                    </span>
                  </label>
                ))}
              </div>
              {preferredTreatments.length > 0 && (
                <p className={styles.helperText} style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#059669' }}>
                  {preferredTreatments.length} selected
                </p>
              )}
            </div>

            {/* Do Not Suggest */}
            <div>
              <label className={styles.fieldLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>
                Do Not Suggest <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.875rem' }}>(optional)</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '0.375rem',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#f9fafb',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {MSK_SKILLS.map((skill) => (
                  <label
                    key={skill.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.5rem',
                      cursor: 'pointer',
                      borderRadius: '0.25rem',
                      transition: 'background-color 0.15s',
                      fontSize: '0.875rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={doNotSuggest.includes(skill.value)}
                      onChange={() => handleTreatmentToggle(skill.value, false)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#dc2626',
                      }}
                    />
                    <span style={{ color: '#374151', userSelect: 'none' }}>
                      {skill.label}
                    </span>
                  </label>
                ))}
              </div>
              {doNotSuggest.length > 0 && (
                <p className={styles.helperText} style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#dc2626' }}>
                  {doNotSuggest.length} excluded
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Note Verbosity, Tone */}
      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`} style={{ marginTop: '0.75rem' }}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Note Verbosity <span style={{ color: '#b91c1c', fontWeight: 500 }}>*</span>
          </label>
          <Select
            value={practicePreferences.noteVerbosity || 'standard'}
            onChange={(val) => {
              const currentPrefs = (data as any).practicePreferences || {};
              const updatedPrefs = {
                ...currentPrefs,
                noteVerbosity: val || 'standard',
              };
              // Asegurar que tone también esté presente
              if (!updatedPrefs.tone) {
                updatedPrefs.tone = 'formal';
              }
              onFieldChange('practicePreferences', updatedPrefs);
            }}
            options={NOTE_VERBOSITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            placeholder="Select verbosity"
            required
            className={styles.textInput}
            style={{ height: '36px' }}
            error={errors?.noteVerbosity}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Tone <span style={{ color: '#b91c1c', fontWeight: 500 }}>*</span>
          </label>
          <Select
            value={practicePreferences.tone || 'formal'}
            onChange={(val) => {
              const currentPrefs = (data as any).practicePreferences || {};
              const updatedPrefs = {
                ...currentPrefs,
                tone: val || 'formal',
              };
              // Asegurar que noteVerbosity también esté presente
              if (!updatedPrefs.noteVerbosity) {
                updatedPrefs.noteVerbosity = 'standard';
              }
              onFieldChange('practicePreferences', updatedPrefs);
            }}
            options={TONE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            placeholder="Select tone"
            required
            className={styles.textInput}
            style={{ height: '36px' }}
            error={errors?.tone}
          />
        </div>
      </div>

      {/* Practice Setting - Multi-select (fisios pueden trabajar en múltiples lugares) */}
      <div className={styles.fieldGroup} style={{ marginTop: '0.75rem' }}>
        <label className={styles.fieldLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>
          Practice Setting <span style={{ color: '#b91c1c', fontWeight: 500 }}>*</span>
          <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.875rem', marginLeft: '0.5rem' }}>
            (select all that apply)
          </span>
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.5rem',
          padding: '0.75rem',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          backgroundColor: '#f9fafb',
        }}>
          {PRACTICE_SETTINGS.map((setting) => {
            const selectedSettings = Array.isArray((data as any).practiceSettings)
              ? (data as any).practiceSettings
              : ((data as any).practiceSetting ? [(data as any).practiceSetting] : []);
            const isSelected = selectedSettings.includes(setting.value);
            
            return (
              <label
                key={setting.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '0.25rem',
                  transition: 'background-color 0.15s',
                  fontSize: '0.875rem',
                  backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handlePracticeSettingToggle(setting.value)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#2563eb',
                  }}
                />
                <span style={{ color: '#374151', userSelect: 'none', fontWeight: isSelected ? 500 : 400 }}>
                  {setting.label}
                </span>
              </label>
            );
          })}
        </div>
        {(() => {
          const selectedSettings = Array.isArray((data as any).practiceSettings)
            ? (data as any).practiceSettings
            : ((data as any).practiceSetting ? [(data as any).practiceSetting] : []);
          return selectedSettings.length > 0 && (
            <p className={styles.helperText} style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#059669' }}>
              {selectedSettings.length} setting{selectedSettings.length !== 1 ? 's' : ''} selected
            </p>
          );
        })()}
      </div>

    </section>
  );
};

export default ProfessionalDataStep;
