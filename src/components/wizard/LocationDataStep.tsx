// @ts-nocheck
import React, { useState, useEffect } from "react";

import styles from '@/styles/wizard.module.css';
import { LegalChecklist, type LegalChecklistItem } from "../LegalChecklist";

const COUNTRY_OPTIONS = [
  { value: 'ca', label: 'Canada' },
  { value: 'us', label: 'United States' },
  { value: 'mx', label: 'Mexico' },
];

const PROVINCE_MAP: Record<string, { value: string; label: string }[]> = {
  ca: [
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
  ],
  us: [
    { value: 'ny', label: 'New York' },
    { value: 'ca', label: 'California' },
    { value: 'tx', label: 'Texas' },
    { value: 'wa', label: 'Washington' },
    { value: 'ma', label: 'Massachusetts' },
  ],
  mx: [
    { value: 'cmx', label: 'Ciudad de México' },
    { value: 'jal', label: 'Jalisco' },
    { value: 'nl', label: 'Nuevo León' },
    { value: 'bc', label: 'Baja California' },
  ],
};

// Provincias/estados que deben usar input de texto libre (tienen muchas ciudades)
const PROVINCES_WITH_MANY_CITIES = ['on', 'bc', 'qc', 'ny', 'ca', 'tx'];

const CITY_MAP: Record<string, string[]> = {
  ab: ['Calgary', 'Edmonton', 'Red Deer'],
  mb: ['Winnipeg', 'Brandon'],
  nb: ['Moncton', 'Fredericton'],
  ns: ['Halifax', 'Sydney'],
  nt: ['Yellowknife'],
  nu: ['Iqaluit'],
  pe: ['Charlottetown', 'Summerside'],
  sk: ['Saskatoon', 'Regina'],
  yt: ['Whitehorse'],
  wa: ['Seattle', 'Spokane'],
  ma: ['Boston', 'Cambridge'],
  cmx: ['Ciudad de México'],
  jal: ['Guadalajara'],
  nl: ['Monterrey'],
  bc: ['Tijuana'],
  // Nota: Ontario (on), BC (bc), Quebec (qc), NY (ny), CA (ca), TX (tx) 
  // ahora usan input de texto libre porque tienen muchas ciudades
};

export type LocationData = {
  country?: string;
  province?: string;
  city?: string;
  phipaConsent?: boolean;
  pipedaConsent?: boolean;
  // Password va aquí (registro), NO en PersonalData (onboarding profesional)
  password?: string; // Required for registration (createUserWithEmailAndPassword)
  confirmPassword?: string; // Required for registration
};

type Props = {
  data: LocationData;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof LocationData, value: string | boolean) => void;
  locationData?: { countryCode?: string; region?: string; city?: string };
  personalData?: Partial<{ country?: string; province?: string; city?: string }>;
};

export const LocationDataStep: React.FC<Props> = ({
  data,
  errors,
  onFieldChange,
  locationData,
  personalData,
}) => {
  const [legalItems, setLegalItems] = useState<LegalChecklistItem[]>([
    {
      id: 'phipa-pipeda-accepted',
      title: 'PHIPA / PIPEDA Acknowledgement',
      description: '',
      required: true,
      category: 'phipa-pipeda',
      checked: Boolean(data.phipaConsent),
    },
    {
      id: 'privacy-accepted',
      title: 'Privacy Policy',
      description: '',
      required: true,
      category: 'privacy',
      checked: Boolean(data.pipedaConsent),
    },
  ]);

  // Sync legal items with data changes
  useEffect(() => {
    setLegalItems((prev) =>
      prev.map((item) => {
        if (item.id === 'phipa-pipeda-accepted') {
          return { ...item, checked: Boolean(data.phipaConsent) };
        } else if (item.id === 'privacy-accepted') {
          return { ...item, checked: Boolean(data.pipedaConsent) };
        }
        return item;
      })
    );
  }, [data.phipaConsent, data.pipedaConsent]);

  // Auto-fill from personal data (if available) or locationData
  React.useEffect(() => {
    // Helper to validate city (not an email or invalid)
    const isValidCity = (city: string | undefined): boolean => {
      if (!city || city.trim() === '') return false;
      // Reject if it looks like an email
      if (city.includes('@')) return false;
      // Reject if it's too short (likely not a city name)
      if (city.trim().length < 2) return false;
      return true;
    };

    // Priority: personalData > locationData > existing data
    if (!data.country) {
      if (personalData?.country && personalData.country.trim() !== '') {
        onFieldChange('country', personalData.country);
      } else if (locationData?.countryCode) {
        onFieldChange('country', locationData.countryCode.toLowerCase());
      }
    }
    if (!data.province) {
      if (personalData?.province && personalData.province.trim() !== '') {
        // Convert province label to code if needed
        const provinceCode = personalData.province.toLowerCase().replace(/\s+/g, '-');
        onFieldChange('province', provinceCode);
      } else if (locationData?.region) {
        onFieldChange('province', locationData.region);
      }
    }
    if (!data.city) {
      // Only use personalData.city if it's a valid city (not an email)
      if (personalData?.city && isValidCity(personalData.city)) {
        onFieldChange('city', personalData.city.trim());
      } else if (locationData?.city && isValidCity(locationData.city)) {
        onFieldChange('city', locationData.city.trim());
      }
    }
  }, [locationData, personalData, data.country, data.province, data.city, onFieldChange]);

  const handleLegalItemChange = (itemId: string, checked: boolean) => {
    setLegalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, checked } : item))
    );

    // Map to LocationData fields
    if (itemId === 'phipa-pipeda-accepted') {
      onFieldChange('phipaConsent', checked);
    } else if (itemId === 'privacy-accepted') {
      onFieldChange('pipedaConsent', checked);
    }
  };

  const handleLegalComplete = (allChecked: boolean) => {
    // Optional: can add validation logic here
  };

  const provinceOptions = data.country ? PROVINCE_MAP[data.country] ?? [] : [];
  const cityOptions = data.province ? CITY_MAP[(data.province.toLowerCase())] ?? [] : [];
  
  // Determinar si la provincia seleccionada debe usar input de texto libre
  const provinceCode = data.province?.toLowerCase() || '';
  const useTextInput = PROVINCES_WITH_MANY_CITIES.includes(provinceCode) || cityOptions.length === 0;

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Location & compliance</h2>
        <p className={styles.sectionDescription}>
          Confirm where you practise so we can apply PHIPA / PIPEDA safeguards and maintain the clinical audit trail.
        </p>
      </header>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Country (ISO-2) *</label>
          <select
            value={data.country ?? ''}
            onChange={(event) => onFieldChange('country', event.target.value)}
            className={styles.selectInput}
            required
          >
            <option value="" disabled>
              Select your country
            </option>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          {errors?.country && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.country}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Province / Territory *</label>
          <select
            value={data.province ?? ''}
            onChange={(event) => onFieldChange('province', event.target.value)}
            className={styles.selectInput}
            required
            disabled={provinceOptions.length === 0}
          >
            <option value="" disabled>
              Select your province
            </option>
            {provinceOptions.map((province) => (
              <option key={province.value} value={province.value}>
                {province.label}
              </option>
            ))}
          </select>
          {errors?.province && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.province}</p>}
        </div>
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>City *</label>
          {useTextInput ? (
            <input
              type="text"
              value={data.city && !data.city.includes('@') ? data.city : ''}
              onChange={(event) => {
                const value = event.target.value;
                // Prevent email addresses from being entered
                if (!value.includes('@')) {
                  onFieldChange('city', value);
                }
              }}
              className={styles.textInput}
              placeholder="Enter your city"
              required
            />
          ) : (
            <select
              value={data.city ?? ''}
              onChange={(event) => onFieldChange('city', event.target.value)}
              className={styles.selectInput}
              required
              disabled={cityOptions.length === 0}
            >
              <option value="" disabled>
                Select your city
              </option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}
          {errors?.city && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.city}</p>}
        </div>
      </div>

      {/* Password fields - requerido para registro (permite login con email + password) */}
      <div className={`${styles.fieldGrid} ${styles.fieldGridTwo}`} style={{ marginTop: '1.5rem' }}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Password <span style={{ color: '#b91c1c', fontWeight: 500 }}>*</span>
          </label>
          <input
            type="password"
            value={(data as any).password ?? ''}
            onChange={(event) => onFieldChange('password' as keyof LocationData, event.target.value)}
            className={styles.textInput}
            placeholder="Create a secure password"
            required
          />
          {errors?.password && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.password}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Confirm Password <span style={{ color: '#b91c1c', fontWeight: 500 }}>*</span>
          </label>
          <input
            type="password"
            value={(data as any).confirmPassword ?? ''}
            onChange={(event) => onFieldChange('confirmPassword' as keyof LocationData, event.target.value)}
            className={styles.textInput}
            placeholder="Repeat your password"
            required
          />
          {errors?.confirmPassword && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.confirmPassword}</p>}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <LegalChecklist
          items={legalItems}
          onItemChange={handleLegalItemChange}
          onComplete={handleLegalComplete}
          showDetails={true}
        />
        {(errors?.phipaConsent || errors?.pipedaConsent) && (
          <p className={styles.helperText} style={{ color: '#b91c1c', marginTop: '0.5rem' }}>
            {errors.phipaConsent || errors.pipedaConsent}
          </p>
        )}
      </div>
    </section>
  );
};

export default LocationDataStep;

