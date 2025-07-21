/**
 * 🗺️ Servicio de Geolocalización Inteligente
 * Detecta automáticamente la ubicación del usuario para mostrar regulaciones relevantes
 */

export interface UserLocation {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  ip: string;
  timezone?: string;
  isDetected: boolean;
}

export interface ComplianceRegulation {
  id: string;
  name: string;
  description: string;
  countries: string[];
  regions?: string[];
  officialUrl: string;
  isRequired: boolean;
}

export interface ComplianceConfig {
  regulations: ComplianceRegulation[];
  showAllRegulations: boolean;
  detectedLocation: UserLocation | null;
}

// Regulaciones por país/región
const COMPLIANCE_REGULATIONS: ComplianceRegulation[] = [
  {
    id: 'hipaa',
    name: 'HIPAA - Estados Unidos',
    description: 'Health Insurance Portability and Accountability Act - Regulación federal estadounidense',
    countries: ['US'],
    officialUrl: 'https://www.hhs.gov/hipaa/index.html',
    isRequired: true
  },
  {
    id: 'pipeda',
    name: 'PIPEDA - Canadá (Federal)',
    description: 'Personal Information Protection and Electronic Documents Act - Regulación federal canadiense',
    countries: ['CA'],
    officialUrl: 'https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/',
    isRequired: true
  },
  {
    id: 'phipa',
    name: 'PHIPA - Ontario, Canadá',
    description: 'Personal Health Information Protection Act - Regulación específica de Ontario',
    countries: ['CA'],
    regions: ['ON'],
    officialUrl: 'https://www.ontario.ca/laws/statute/04p03',
    isRequired: true
  },
  {
    id: 'gdpr',
    name: 'GDPR - Unión Europea',
    description: 'General Data Protection Regulation - Regulación europea de protección de datos',
    countries: ['ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'IE', 'FI', 'SE', 'DK', 'NO', 'CH'],
    officialUrl: 'https://gdpr.eu/',
    isRequired: true
  },
  {
    id: 'lgpd',
    name: 'LGPD - Brasil',
    description: 'Lei Geral de Proteção de Dados - Regulación brasileña de protección de datos',
    countries: ['BR'],
    officialUrl: 'https://www.gov.br/cnpd/pt-br',
    isRequired: true
  },
  {
    id: 'lfpdppp',
    name: 'LFPDPPP - México',
    description: 'Ley Federal de Protección de Datos Personales en Posesión de Particulares',
    countries: ['MX'],
    officialUrl: 'https://www.inai.org.mx/',
    isRequired: true
  },
  {
    id: 'ley1581',
    name: 'Ley 1581 - Colombia',
    description: 'Ley de Protección de Datos Personales de Colombia',
    countries: ['CO'],
    officialUrl: 'https://www.sic.gov.co/',
    isRequired: true
  },
  {
    id: 'ley25326',
    name: 'Ley 25.326 - Argentina',
    description: 'Ley de Protección de Datos Personales de Argentina',
    countries: ['AR'],
    officialUrl: 'https://www.argentina.gob.ar/aaip',
    isRequired: true
  },
  {
    id: 'ley19628',
    name: 'Ley 19.628 - Chile',
    description: 'Ley de Protección de la Vida Privada de Chile',
    countries: ['CL'],
    officialUrl: 'https://www.consejotransparencia.cl/',
    isRequired: true
  },
  {
    id: 'ley29733',
    name: 'Ley 29733 - Perú',
    description: 'Ley de Protección de Datos Personales de Perú',
    countries: ['PE'],
    officialUrl: 'https://www.minjusdh.gob.pe/',
    isRequired: true
  }
];

export class GeolocationService {
  private static instance: GeolocationService;
  private cachedLocation: UserLocation | null = null;
  private detectionPromise: Promise<UserLocation> | null = null;

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Detecta la ubicación del usuario usando múltiples métodos
   */
  async detectUserLocation(): Promise<UserLocation> {
    // Si ya tenemos una ubicación cacheada, la devolvemos
    if (this.cachedLocation) {
      return this.cachedLocation;
    }

    // Si ya hay una detección en progreso, esperamos
    if (this.detectionPromise) {
      return this.detectionPromise;
    }

    // Iniciamos nueva detección
    this.detectionPromise = this.performLocationDetection();
    
    try {
      const location = await this.detectionPromise;
      this.cachedLocation = location;
      return location;
    } finally {
      this.detectionPromise = null;
    }
  }

  /**
   * Realiza la detección de ubicación usando múltiples APIs
   */
  private async performLocationDetection(): Promise<UserLocation> {
    const fallbackLocation: UserLocation = {
      country: 'Unknown',
      countryCode: 'XX',
      ip: 'unknown',
      isDetected: false
    };

    try {
      // Método 1: IP-API (gratuita, sin API key)
      const location = await this.detectViaIPAPI();
      if (location.isDetected) {
        console.log('🌍 Ubicación detectada via IP-API:', location);
        return location;
      }

      // Método 2: ipapi.co (gratuita, con límites)
      const location2 = await this.detectViaIPAPICo();
      if (location2.isDetected) {
        console.log('🌍 Ubicación detectada via ipapi.co:', location2);
        return location2;
      }

      // Método 3: ipinfo.io (gratuita, con límites)
      const location3 = await this.detectViaIPInfo();
      if (location3.isDetected) {
        console.log('🌍 Ubicación detectada via ipinfo.io:', location3);
        return location3;
      }

      console.warn('⚠️ No se pudo detectar la ubicación del usuario');
      return fallbackLocation;

    } catch (error) {
      console.error('❌ Error detectando ubicación:', error);
      return fallbackLocation;
    }
  }

  /**
   * Detecta ubicación usando IP-API (gratuita)
   */
  private async detectViaIPAPI(): Promise<UserLocation> {
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,query,timezone');
      const data = await response.json();

      if (data.status === 'success') {
        return {
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          ip: data.query,
          timezone: data.timezone,
          isDetected: true
        };
      }
    } catch (error) {
      console.warn('IP-API falló:', error);
    }

    return { country: '', countryCode: '', ip: '', isDetected: false };
  }

  /**
   * Detecta ubicación usando ipapi.co
   */
  private async detectViaIPAPICo(): Promise<UserLocation> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data.country_code) {
        return {
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region,
          city: data.city,
          ip: data.ip,
          timezone: data.timezone,
          isDetected: true
        };
      }
    } catch (error) {
      console.warn('ipapi.co falló:', error);
    }

    return { country: '', countryCode: '', ip: '', isDetected: false };
  }

  /**
   * Detecta ubicación usando ipinfo.io
   */
  private async detectViaIPInfo(): Promise<UserLocation> {
    try {
      const response = await fetch('https://ipinfo.io/json');
      const data = await response.json();

      if (data.country) {
        return {
          country: data.country_name || data.country,
          countryCode: data.country,
          region: data.region,
          city: data.city,
          ip: data.ip,
          timezone: data.timezone,
          isDetected: true
        };
      }
    } catch (error) {
      console.warn('ipinfo.io falló:', error);
    }

    return { country: '', countryCode: '', ip: '', isDetected: false };
  }

  /**
   * Obtiene las regulaciones relevantes para la ubicación del usuario
   */
  async getRelevantRegulations(): Promise<ComplianceConfig> {
    const location = await this.detectUserLocation();
    
    if (!location.isDetected) {
      // Si no se puede detectar, mostrar todas las regulaciones
      return {
        regulations: COMPLIANCE_REGULATIONS,
        showAllRegulations: true,
        detectedLocation: location
      };
    }

    // Filtrar regulaciones relevantes para la ubicación
    const relevantRegulations = COMPLIANCE_REGULATIONS.filter(regulation => {
      // Verificar si aplica al país
      const countryMatch = regulation.countries.includes(location.countryCode);
      
      // Si tiene regiones específicas, verificar también
      if (regulation.regions && location.region) {
        return countryMatch && regulation.regions.includes(location.region);
      }
      
      return countryMatch;
    });

    // Si no hay regulaciones específicas, incluir las más comunes
    if (relevantRegulations.length === 0) {
      const commonRegulations = COMPLIANCE_REGULATIONS.filter(r => 
        ['gdpr', 'hipaa', 'pipeda'].includes(r.id)
      );
      relevantRegulations.push(...commonRegulations);
    }

    return {
      regulations: relevantRegulations,
      showAllRegulations: false,
      detectedLocation: location
    };
  }

  /**
   * Obtiene información específica de una regulación
   */
  getRegulationInfo(regulationId: string): ComplianceRegulation | null {
    return COMPLIANCE_REGULATIONS.find(r => r.id === regulationId) || null;
  }

  /**
   * Limpia la caché de ubicación (útil para testing)
   */
  clearCache(): void {
    this.cachedLocation = null;
    this.detectionPromise = null;
  }

  /**
   * Simula una ubicación específica (útil para testing)
   */
  setMockLocation(location: UserLocation): void {
    this.cachedLocation = location;
  }
}

// Exportar instancia singleton
export const geolocationService = GeolocationService.getInstance(); 