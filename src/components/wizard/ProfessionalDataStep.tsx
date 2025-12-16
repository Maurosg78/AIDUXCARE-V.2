// @ts-nocheck
import React, { useState, useEffect } from "react";

import styles from '@/styles/wizard.module.css';
import type { ProfessionalData } from "../../types/wizard";
import { PROFESSIONAL_TITLES, PRIMARY_SPECIALTIES, MSK_SKILLS } from './onboardingConstants';

interface ProfessionalDataStepProps {
  data: ProfessionalData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | number) => void;
}

export const ProfessionalDataStep: React.FC<ProfessionalDataStepProps> = ({
  data,
  errors,
  onFieldChange,
}) => {
  const [showOtherTitle, setShowOtherTitle] = useState(false);
  const [showOtherSpecialty, setShowOtherSpecialty] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    (data as any).mskSkills ? (data as any).mskSkills.split(',').filter(Boolean) : []
  );

  useEffect(() => {
    setShowOtherTitle(data.professionalTitle === 'other');
    setShowOtherSpecialty(data.specialty === 'other');
  }, [data.professionalTitle, data.specialty]);

  useEffect(() => {
    // Sync selectedSkills with data.mskSkills
    if ((data as any).mskSkills) {
      const skills = (data as any).mskSkills.split(',').filter(Boolean);
      setSelectedSkills(skills);
    } else {
      setSelectedSkills([]);
    }
  }, [(data as any).mskSkills]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === 'experienceYears' ? Number(event.target.value) : event.target.value;
    onFieldChange(field, value);
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onFieldChange('professionalTitle', value);
  };

  const handleSpecialtyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onFieldChange('specialty', value);
    // Clear MSK skills if specialty changes away from MSK
    if (value !== 'msk') {
      onFieldChange('mskSkills', '');
      setSelectedSkills([]);
    }
  };

  const handleSkillToggle = (skillValue: string) => {
    const newSkills = selectedSkills.includes(skillValue)
      ? selectedSkills.filter(s => s !== skillValue)
      : [...selectedSkills, skillValue];
    setSelectedSkills(newSkills);
    onFieldChange('mskSkills', newSkills.join(','));
  };

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Professional credentials</h2>
        <p className={styles.sectionDescription}>
          Provide your regulated licence and scope of practice information. You are responsible for the accuracy and truthfulness of all information provided.
        </p>
      </header>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Professional title *</label>
          <select
            value={data.professionalTitle ?? ""}
            onChange={handleTitleChange}
            className={styles.textInput}
            required
          >
            <option value="">Select your professional title</option>
            {PROFESSIONAL_TITLES.map((title) => (
              <option key={title.value} value={title.value}>
                {title.label}
              </option>
            ))}
          </select>
          {errors?.professionalTitle && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.professionalTitle}</p>}
        </div>

        {showOtherTitle && (
          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Specify your professional title *</label>
            <input
              value={(data as any).professionalTitleOther ?? ""}
              onChange={handleChange("professionalTitleOther")}
              className={styles.textInput}
              placeholder="e.g., Athletic Therapist, Kinesiologist..."
              required
            />
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Primary specialty *</label>
          <select
            value={data.specialty ?? ""}
            onChange={handleSpecialtyChange}
            className={styles.textInput}
            required
            disabled={!data.professionalTitle || data.professionalTitle === 'other'}
          >
            <option value="">Select your primary specialty</option>
            {PRIMARY_SPECIALTIES.map((specialty) => (
              <option key={specialty.value} value={specialty.value}>
                {specialty.label}
              </option>
            ))}
          </select>
          {errors?.specialty && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.specialty}</p>}
        </div>

        {showOtherSpecialty && (
          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Specify your specialty *</label>
            <input
              value={(data as any).specialtyOther ?? ""}
              onChange={handleChange("specialtyOther")}
              className={styles.textInput}
              placeholder="e.g., Manual Therapy, Dry Needling, Motor Control..."
              required
            />
          </div>
        )}

        {/* MSK Skills Selection - Only shown when MSK is selected */}
        {data.specialty === 'msk' && (
          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
            <label className={styles.fieldLabel} style={{ marginBottom: '0.75rem' }}>
              MSK Skills & Continuing Education (Optional)
            </label>
            <p className={styles.helperText} style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Select your certifications and training courses. This helps us personalize treatment plans based on your capabilities.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#f9fafb',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              {MSK_SKILLS.map((skill) => (
                <label
                  key={skill.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    borderRadius: '0.25rem',
                    transition: 'background-color 0.2s',
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
                    checked={selectedSkills.includes(skill.value)}
                    onChange={() => handleSkillToggle(skill.value)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#2563eb',
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    {skill.label}
                  </span>
                </label>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className={styles.helperText} style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#059669' }}>
                {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
              </p>
            )}
            
            {/* "Other" skill input */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <label className={styles.fieldLabel} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Other MSK Skills / Certifications (Optional)
              </label>
              <input
                type="text"
                value={(data as any).mskSkillsOther ?? ""}
                onChange={handleChange("mskSkillsOther")}
                className={styles.textInput}
                placeholder="e.g., Advanced Manual Therapy, IASTM, Cupping Therapy..."
                style={{ fontSize: '0.875rem' }}
              />
              <p className={styles.helperText} style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Enter any additional certifications or training courses not listed above
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>University / Institution *</label>
          <input
            value={data.university ?? ""}
            onChange={handleChange("university")}
            className={styles.textInput}
            placeholder="University of Toronto"
            required
          />
          {errors?.university && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.university}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Licence number *</label>
          <input
            value={data.licenseNumber ?? ""}
            onChange={handleChange("licenseNumber")}
            className={styles.textInput}
            placeholder="CPO-000000"
            required
          />
          {errors?.licenseNumber && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.licenseNumber}</p>}
        </div>
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Years of experience *</label>
          <input
            type="number"
            min={0}
            value={data.experienceYears ?? 0}
            onChange={handleChange("experienceYears")}
            className={styles.textInput}
            placeholder="5"
            required
          />
          {errors?.experienceYears && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.experienceYears}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Primary clinic *</label>
          <input
            value={data.workplace ?? ""}
            onChange={handleChange("workplace")}
            className={styles.textInput}
            placeholder="AiduxCare Niagara"
            required
          />
          {errors?.workplace && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.workplace}</p>}
        </div>
      </div>

      <div className={styles.complianceCard}>
        <strong>Legal Notice:</strong> By providing this information, you certify that all details are accurate and truthful. Providing false or misleading information may result in account suspension or termination. All actions are logged under PHIPA / PIPEDA compliance. You can update these details in your professional profile after onboarding.
      </div>
    </section>
  );
};

export default ProfessionalDataStep;

