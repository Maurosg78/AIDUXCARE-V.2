export type CountryMeta = {
  code: string;
  name: string;
  gdpr?: boolean;
  hipaa?: boolean;
  dataRetention?: number;
};

export type SelectedCountryData = {
  location: { city?: string; region?: string; country?: string };
  explanation?: string;
};

export type FiduciaryData = {
  location: { city?: string; region?: string; country?: string };
};
