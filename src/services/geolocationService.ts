/**
 * GeolocationService - Servicio de geolocalización inteligente
 * Combina detección automática con fallback manual para compliance legal
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

export interface GeolocationData {
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  timezone?: string;
  ipAddress?: string;
  source: 'geolocation' | 'ip' | 'manual';
  timestamp: Date;
}

export interface LegalCompliance {
  country: string;
  gdpr: boolean;
  hipaa: boolean;
  localPrivacyLaws: string[];
  dataRetention: number; // días
  consentRequired: boolean;
  specialRequirements: string[];
}

export interface PhoneCountryCode {
  country: string;
  code: string;
  flag: string;
  format: string;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private cachedData: GeolocationData | null = null;

  // Códigos de país para teléfonos
  private phoneCountryCodes: PhoneCountryCode[] = [
    { country: 'España', code: '+34', flag: '🇪🇸', format: '+34 XXX XXX XXX' },
    { country: 'México', code: '+52', flag: '🇲🇽', format: '+52 XXX XXX XXXX' },
    { country: 'Argentina', code: '+54', flag: '🇦🇷', format: '+54 XXX XXX XXXX' },
    { country: 'Colombia', code: '+57', flag: '🇨🇴', format: '+57 XXX XXX XXXX' },
    { country: 'Chile', code: '+56', flag: '🇨🇱', format: '+56 X XXX XXX XXX' },
    { country: 'Perú', code: '+51', flag: '🇵🇪', format: '+51 XXX XXX XXX' },
    { country: 'Estados Unidos', code: '+1', flag: '🇺🇸', format: '+1 (XXX) XXX-XXXX' },
    { country: 'Reino Unido', code: '+44', flag: '🇬🇧', format: '+44 XXXX XXXXXX' },
    { country: 'Alemania', code: '+49', flag: '🇩🇪', format: '+49 XXX XXXXXXX' },
    { country: 'Francia', code: '+33', flag: '🇫🇷', format: '+33 X XX XX XX XX' }
  ];

  // Compliance legal por país
  private legalComplianceMap: Record<string, LegalCompliance> = {
    'ES': {
      country: 'España',
      gdpr: true,
      hipaa: false,
      localPrivacyLaws: ['LOPDGDD', 'RGPD'],
      dataRetention: 2555, // 7 años médicos
      consentRequired: true,
      specialRequirements: ['Consentimiento explícito', 'Derecho de portabilidad']
    },
    'MX': {
      country: 'México',
      gdpr: false,
      hipaa: false,
      localPrivacyLaws: ['LFPDPPP'],
      dataRetention: 1825, // 5 años
      consentRequired: true,
      specialRequirements: ['Aviso de privacidad', 'Derechos ARCO']
    },
    'AR': {
      country: 'Argentina',
      gdpr: false,
      hipaa: false,
      localPrivacyLaws: ['LPDP'],
      dataRetention: 1825, // 5 años
      consentRequired: true,
      specialRequirements: ['Registro de bases de datos', 'Derecho de acceso']
    },
    'US': {
      country: 'Estados Unidos',
      gdpr: false,
      hipaa: true,
      localPrivacyLaws: ['HIPAA', 'CCPA'],
      dataRetention: 2555, // 7 años
      consentRequired: true,
      specialRequirements: ['Autorización específica', 'Notificación de violaciones']
    },
    'GB': {
      country: 'Reino Unido',
      gdpr: true,
      hipaa: false,
      localPrivacyLaws: ['UK GDPR', 'DPA 2018'],
      dataRetention: 2555, // 7 años
      consentRequired: true,
      specialRequirements: ['Consentimiento granular', 'Derecho al olvido']
    }
  };

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Detecta ubicación automáticamente usando geolocalización del navegador
   */
  public async detectLocation(): Promise<GeolocationData | null> {
    if (!navigator.geolocation) {
      console.log('Geolocalización no soportada por el navegador');
      return null;
    }

    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Usar servicio de reverse geocoding
      const locationData = await this.reverseGeocode(latitude, longitude);
      
      this.cachedData = {
        ...locationData,
        source: 'geolocation',
        timestamp: new Date()
      };

      return this.cachedData;
    } catch (error) {
      console.log('Error en geolocalización:', error);
      return null;
    }
  }

  /**
   * Detecta ubicación por IP como fallback
   */
  public async detectLocationByIP(): Promise<GeolocationData | null> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      this.cachedData = {
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        regionCode: data.region_code,
        city: data.city,
        timezone: data.timezone,
        ipAddress: data.ip,
        source: 'ip',
        timestamp: new Date()
      };

      return this.cachedData;
    } catch (error) {
      console.log('Error en detección por IP:', error);
      return null;
    }
  }

  /**
   * Obtiene el código de país para teléfono
   */
  public getPhoneCountryCode(countryCode: string): PhoneCountryCode | null {
    const country = this.phoneCountryCodes.find(c => 
      c.country.toLowerCase().includes(countryCode.toLowerCase()) ||
      c.code === countryCode
    );
    return country || null;
  }

  /**
   * Obtiene compliance legal para un país
   */
  public getLegalCompliance(countryCode: string): LegalCompliance | null {
    return this.legalComplianceMap[countryCode.toUpperCase()] || null;
  }

  /**
   * Obtiene todos los códigos de país disponibles
   */
  public getAllPhoneCountryCodes(): PhoneCountryCode[] {
    return this.phoneCountryCodes;
  }

  /**
   * Obtiene datos de ubicación desde caché
   */
  public getCachedLocation(): GeolocationData | null {
    return this.cachedData;
  }

  /**
   * Establece ubicación manualmente
   */
  public setManualLocation(country: string, countryCode: string, region?: string): GeolocationData {
    this.cachedData = {
      country,
      countryCode,
      region,
      source: 'manual',
      timestamp: new Date()
    };
    return this.cachedData;
  }

  /**
   * Verifica si la geolocalización está disponible
   */
  public isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Verifica si el usuario ha denegado permisos
   */
  public async checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isGeolocationSupported()) {
      return 'denied';
    }

    try {
      // Intentar obtener posición con timeout muy corto
      await this.getCurrentPosition(100);
      return 'granted';
    } catch (error: unknown) {
      const geolocationError = error as GeolocationPositionError;
      if (geolocationError.code === 1) return 'denied';
      if (geolocationError.code === 2) return 'denied';
      return 'prompt';
    }
  }

  private getCurrentPosition(timeout = 10000): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout,
          maximumAge: 300000 // 5 minutos
        }
      );
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<Partial<GeolocationData>> {
    try {
      // Usar servicio gratuito de reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      
      return {
        country: data.address.country,
        countryCode: this.getCountryCode(data.address.country),
        region: data.address.state,
        city: data.address.city || data.address.town,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } catch (error) {
      console.log('Error en reverse geocoding:', error);
      return {};
    }
  }

  private getCountryCode(countryName: string): string {
    const countryMap: Record<string, string> = {
      'Spain': 'ES',
      'España': 'ES',
      'Mexico': 'MX',
      'México': 'MX',
      'Argentina': 'AR',
      'Colombia': 'CO',
      'Chile': 'CL',
      'Peru': 'PE',
      'Perú': 'PE',
      'United States': 'US',
      'United Kingdom': 'GB',
      'Germany': 'DE',
      'Deutschland': 'DE',
      'France': 'FR'
    };
    
    return countryMap[countryName] || countryName.substring(0, 2).toUpperCase();
  }
}

export const geolocationService = GeolocationService.getInstance(); 