// @ts-nocheck
import React from "react";

import styles from '@/styles/wizard.module.css';

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

const CITY_MAP: Record<string, string[]> = {
  ab: ['Calgary', 'Edmonton', 'Red Deer'],
// DUPLICATE_REMOVED:   bc: ['Vancouver', 'Victoria', 'Kelowna'],
  mb: ['Winnipeg', 'Brandon'],
  nb: ['Moncton', 'Fredericton'],
// DUPLICATE_REMOVED:   nl: ['St. John’s', 'Corner Brook'],
  ns: ['Halifax', 'Sydney'],
  nt: ['Yellowknife'],
  nu: ['Iqaluit'],
  on: ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton'],
  pe: ['Charlottetown', 'Summerside'],
  qc: ['Montréal', 'Québec City', 'Laval'],
  sk: ['Saskatoon', 'Regina'],
  yt: ['Whitehorse'],
  ny: ['New York City', 'Buffalo'],
  ca: ['Los Angeles', 'San Francisco'],
  tx: ['Houston', 'Dallas'],
  wa: ['Seattle', 'Spokane'],
  ma: ['Boston', 'Cambridge'],
  cmx: ['Ciudad de México'],
  jal: ['Guadalajara'],
  nl: ['Monterrey'],
  bc: ['Tijuana'],
};

export type LocationData = {
  country?: string;
  province?: string;
  city?: string;
  phipaConsent?: boolean;
  pipedaConsent?: boolean;
};

type Props = {
  data: LocationData;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof LocationData, value: string | boolean) => void;
  locationData?: { countryCode?: string; region?: string; city?: string };
};

export const LocationDataStep: React.FC<Props> = ({
  data,
  errors,
  onFieldChange,
  locationData,
}) => {
  React.useEffect(() => {
    if (!locationData) return;
    if (!data.country && locationData.countryCode) {
      onFieldChange('country', locationData.countryCode.toLowerCase());
    }
    if (!data.province && locationData.region) {
      onFieldChange('province', locationData.region);
    }
    if (!data.city && locationData.city) {
      onFieldChange('city', locationData.city);
    }
  }, [locationData, data.country, data.province, data.city, onFieldChange]);

  const provinceOptions = data.country ? PROVINCE_MAP[data.country] ?? [] : [];
  const cityOptions = data.province ? CITY_MAP[(data.province.toLowerCase())] ?? [] : [];

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
          {errors?.city && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.city}</p>}
        </div>
      </div>

      <div className={styles.checkboxCard}>
        <input
          type="checkbox"
          className={styles.checkboxInput}
          checked={Boolean(data.phipaConsent)}
          onChange={(event) => onFieldChange('phipaConsent', event.target.checked)}
        />
        <span className={styles.checkboxLabel}>
          I acknowledge AiduxCare operates under PHIPA in Canada and authorise secure handling of my professional data.
        </span>
      </div>
      {errors?.phipaConsent && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.phipaConsent}</p>}

      <div className={styles.checkboxCard}>
        <input
          type="checkbox"
          className={styles.checkboxInput}
          checked={Boolean(data.pipedaConsent)}
          onChange={(event) => onFieldChange('pipedaConsent', event.target.checked)}
        />
        <span className={styles.checkboxLabel}>
          I consent to AiduxCare processing my information according to PIPEDA and maintaining audit logs.
        </span>
      </div>
      {errors?.pipedaConsent && <p className={styles.helperText} style={{ color: '#b91c1c' }}>{errors.pipedaConsent}</p>}
    </section>
  );
};

export default LocationDataStep;

