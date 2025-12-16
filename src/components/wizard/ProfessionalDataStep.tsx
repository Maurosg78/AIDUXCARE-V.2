// @ts-nocheck
import React, { useState, useEffect } from "react";

import styles from '@/styles/wizard.module.css';
import type { ProfessionalData } from "../../types/wizard";
import { PROFESSIONAL_TITLES, PRIMARY_SPECIALTIES } from './onboardingConstants';

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

  useEffect(() => {
    setShowOtherTitle(data.professionalTitle === 'other');
    setShowOtherSpecialty(data.specialty === 'other');
  }, [data.professionalTitle, data.specialty]);

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

