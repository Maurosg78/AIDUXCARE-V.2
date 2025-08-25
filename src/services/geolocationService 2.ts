/**
 * Geolocation service – API estable para el wizard y pruebas.
 * Sin any/unknown. Tipado estricto.
 */

export type PhoneCountryCode = {
  code: string;   // ej: +34
  iso2: string;   // ej: ES
  name: string;   // ej: Spain
};

export type GeolocationData = {
  country: string;          // nombre país (ej: Spain)
  city?: string | null;
  region?: string | null;   // estado/provincia si aplica
  countryCode?: string | null; // ISO-2 (ej: ES)
  timestamp: Date;
  source: 'browser' | 'ip' | 'manual';
};

export type LegalRequirement = {
  name: string;
  description?: string;
};

export type LegalCompliance = {
  jurisdiction: string; // ej: EU / US / CA / ES
  specialRequirements: LegalRequirement[];
};

export type ComplianceConfig = {
  regulations: Array<{ name: string; ref?: string }>;
  legal: LegalCompliance[];
};

class GeolocationService {
  // Singleton
  private static _instance: GeolocationService | null = null;
  static getInstance(): GeolocationService {
    if (!this._instance) this._instance = new GeolocationService();
    return this._instance;
  }

  // Lista mínima y tipada de códigos de país para el selector
  private readonly phoneCodes: PhoneCountryCode[] = [
    { code: '+34', iso2: 'ES', name: 'Spain' },
    { code: '+1',  iso2: 'US', name: 'United States' },
    { code: '+1',  iso2: 'CA', name: 'Canada' },
    { code: '+52', iso2: 'MX', name: 'Mexico' },
    { code: '+56', iso2: 'CL', name: 'Chile' },
  ];

  getAllPhoneCountryCodes(): PhoneCountryCode[] {
    return [...this.phoneCodes];
  }

  isGeolocationSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.geolocation;
  }

  async checkGeolocationPermission(): Promise<'granted'|'denied'|'prompt'> {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) return 'prompt';
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state as 'granted'|'denied'|'prompt';
  }

  async getLocation(): Promise<GeolocationData> {
    if (!this.isGeolocationSupported()) {
      // Degradación amable
      return {
        country: '',
        city: null,
        region: null,
        countryCode: null,
        timestamp: new Date(),
        source: 'manual',
      };
    }
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 });
    });

    // No resolvemos a dirección inversa aquí (evita dependencias externas).
    // Dejamos country/region vacíos; el consumidor puede usar detección por IP si necesita.
    return {
      country: '',
      city: null,
      region: null,
      countryCode: null,
      timestamp: new Date(position.timestamp),
      source: 'browser',
    };
    }

  // Alias para compatibilidad retro
  async detectLocation(): Promise<GeolocationData> {
    return this.getLocation();
  }

  async detectLocationByIP(): Promise<GeolocationData> {
    // Implementación de fallback sin llamada externa: devolvemos estructura válida.
    return {
      country: '',
      city: null,
      region: null,
      countryCode: null,
      timestamp: new Date(),
      source: 'ip',
    };
  }

  async getRelevantRegulations(): Promise<ComplianceConfig> {
    // Mínimo viable para el wizard y páginas de prueba
    return {
      regulations: [
        { name: 'GDPR' },
        { name: 'HIPAA' },
        { name: 'PIPEDA' }
      ],
      legal: [
        {
          jurisdiction: 'EU',
          specialRequirements: [{ name: 'Consentimiento explícito' }]
        },
        {
          jurisdiction: 'US',
          specialRequirements: [{ name: 'HIPAA BAAs' }]
        },
        {
          jurisdiction: 'CA',
          specialRequirements: [{ name: 'PIPEDA safeguards' }]
        }
      ]
    };
  }
}

// Export canónico: singleton + tipo de clase (para quien lo necesite)
export const geolocationService = GeolocationService.getInstance();
export { GeolocationService };
