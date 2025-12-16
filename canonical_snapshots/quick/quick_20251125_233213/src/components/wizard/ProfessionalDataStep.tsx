// @ts-nocheck
import React from "react";

import styles from '@/styles/wizard.module.css';
import type { ProfessionalData } from "../../types/wizard";

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
  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'experienceYears' ? Number(event.target.value) : event.target.value;
    onFieldChange(field, value);
  };

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Professional credentials</h2>
        <p className={styles.sectionDescription}>
          Confirm your regulated licence and scope of practice. We validate this information with your college before enabling the workflow.
        </p>
      </header>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Professional title *</label>
          <input
            value={data.professionalTitle ?? ""}
            onChange={handleChange("professionalTitle")}
            className={styles.textInput}
            placeholder="Physiotherapist, MD, Psychologist…"
            required
          />
          {errors?.professionalTitle && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.professionalTitle}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Primary specialty *</label>
          <input
            value={data.specialty ?? ""}
            onChange={handleChange("specialty")}
            className={styles.textInput}
            placeholder="Pelvic health, Neurology, Sports…"
            required
          />
          {errors?.specialty && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.specialty}</p>}
        </div>
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
        We cross-check licences with the relevant college and log every action under PHIPA / PIPEDA. You can update these details in your professional profile after onboarding.
      </div>
    </section>
  );
};

export default ProfessionalDataStep;

