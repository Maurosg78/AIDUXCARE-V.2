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

export type PersonalFormData = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  gender?: string;
  country?: string;
  province?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
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
        <h2 className={styles.sectionTitle}>Personal information</h2>
        <p className={styles.sectionDescription}>
          Provide the identity and contact details required for your AiduxCare intake and email verification.
        </p>
      </header>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>First name</label>
          <input
            value={data.firstName ?? ''}
            onChange={handleField('firstName')}
            className={styles.textInput}
            placeholder="Alexandra"
            required
          />
          {errors?.firstName && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.firstName}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Last name</label>
          <input
            value={data.lastName ?? ''}
            onChange={handleField('lastName')}
            className={styles.textInput}
            placeholder="Bennett"
            required
          />
          {errors?.lastName && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.lastName}</p>}
        </div>
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Email address</label>
          <input
            type="email"
            value={data.email ?? ''}
            onChange={handleField('email')}
            className={styles.textInput}
            placeholder="you@clinic.ca"
            required
          />
          {errors?.email && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.email}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Contact phone</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={data.phoneCountryCode ?? '+1'}
              onChange={handleField('phoneCountryCode')}
              className={styles.textInput}
              style={{ maxWidth: '96px' }}
              placeholder="+1"
            />
            <input
              value={data.phone ?? ''}
              onChange={handleField('phone')}
              className={styles.textInput}
              placeholder="(555) 123-4567"
            />
          </div>
          {(errors?.phoneCountryCode || errors?.phone) && (
            <p className={styles.helperText} style={{ color: '#b91c1c' }}>
              {errors?.phoneCountryCode ?? errors?.phone}
            </p>
          )}
        </div>
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Country (ISO-2)</label>
          <select
            value={data.country ?? ''}
            onChange={handleField('country')}
            className={styles.selectInput}
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
          {errors?.country && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.country}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Province / Territory</label>
          <select
            value={data.province ?? ''}
            onChange={handleField('province')}
            className={styles.selectInput}
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
          {errors?.province && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.province}</p>}
        </div>
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>City</label>
          <input
            value={data.city ?? ''}
            onChange={handleField('city')}
            className={styles.textInput}
            placeholder="Toronto"
            required
          />
          {errors?.city && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.city}</p>}
        </div>
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Password</label>
          <input
            type="password"
            value={data.password ?? ''}
            onChange={handleField('password')}
            className={styles.textInput}
            placeholder="Create a secure password"
            required
          />
          {errors?.password && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.password}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Confirm password</label>
          <input
            type="password"
            value={data.confirmPassword ?? ''}
            onChange={handleField('confirmPassword')}
            className={styles.textInput}
            placeholder="Repeat your password"
            required
          />
          {errors?.confirmPassword && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.confirmPassword}</p>}
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
