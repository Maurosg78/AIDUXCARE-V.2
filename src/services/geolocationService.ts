/**
 * geolocationService - Servicio de geolocalización inteligente
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
  source: 'geolocation' | 'ip' | 'manual' | 'fiduciary';
  timestamp: Date;
  needsPermissionReset?: boolean;
  permissionStatus?: 'granted' | 'denied' | 'prompt';
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

class GeolocationServiceImpl {
  private static instance: GeolocationServiceImpl;
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

  public static getInstance(): GeolocationServiceImpl {
    if (!GeolocationServiceImpl.instance) {
      GeolocationServiceImpl.instance = new GeolocationServiceImpl();
    }
    return GeolocationServiceImpl.instance;
  }

  /**
   * Detecta ubicación automáticamente usando geolocalización del navegador
   * Garantiza que siempre se capture provincia o solicita manualmente
   */
  public async detectLocation(): Promise<GeolocationData | null> {
    if (!navigator.geolocation) {
      console.log('Geolocalización no soportada por el navegador');
      return await this.detectLocationByIP();
    }

    try {
      console.log('Iniciando detección de ubicación...');
      
      // Verificar estado actual de permisos ANTES de intentar geolocalización
      const permissionStatus = await this.checkGeolocationPermission();
      console.log('Estado de permisos de geolocalización:', permissionStatus);
      
      if (permissionStatus === 'denied') {
        console.log('Permisos denegados: el navegador no mostrará el prompt');
        console.log('Solución: el usuario debe resetear permisos manualmente');
        
        // Retornar datos especiales para indicar que se necesitan permisos
        return {
          country: undefined,
          countryCode: undefined,
          region: undefined,
          regionCode: undefined,
          city: undefined,
          timezone: undefined,
          ipAddress: undefined,
          source: 'manual',
          timestamp: new Date(),
          needsPermissionReset: true,
          permissionStatus: 'denied'
        };
      }
      
      // Solo intentar geolocalización si los permisos no están denegados
      if (permissionStatus === 'granted' || permissionStatus === 'prompt') {
        console.log('✅ Permisos disponibles, intentando geolocalización...');
        
        try {
          const position = await this.getCurrentPosition();
          const { latitude, longitude } = position.coords;

          // Usar servicio de reverse geocoding
          const locationData = await this.reverseGeocode(latitude, longitude);
          
          // Verificar que se obtuvo provincia
          if (!locationData.region && locationData.country) {
            console.log('Provincia no detectada automáticamente, solicitando manualmente');
            this.cachedData = {
              ...locationData,
              source: 'geolocation',
              timestamp: new Date()
            };
            return this.cachedData;
          }
          
          this.cachedData = {
            ...locationData,
            source: 'geolocation',
            timestamp: new Date()
          };

          console.log('[Geolocation] location_resolved:', Boolean(this.cachedData));
          return this.cachedData;
        } catch (geoError) {
          const geolocationError = geoError as GeolocationPositionError;
          console.log('Error en geolocalización:', {
            code: geolocationError.code,
            message: geolocationError.message
          });
          
          // Si el usuario denegó permisos, usar IP
          if (geolocationError.code === 1) {
            console.log('Usuario denegó permisos de geolocalización, usando IP...');
            return await this.detectLocationByIP();
          }
          
          // Para otros errores (timeout, no disponible), también usar IP
          console.log('Error en geolocalización, usando IP como fallback...');
          return await this.detectLocationByIP();
        }
      } else {
        console.log('⚠️ Estado de permisos inesperado:', permissionStatus);
        return await this.detectLocationByIP();
      }
    } catch (error) {
      console.log('Error general en geolocalización:', error);
      return await this.detectLocationByIP();
    }
  }

  /**
   * Detecta ubicación por IP como fallback
   * Garantiza que siempre se capture provincia o solicita manualmente
   */
  public async detectLocationByIP(): Promise<GeolocationData | null> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      // Verificar que se obtuvo provincia
      if (!data.region && data.country_name) {
        console.log('Provincia no detectada por IP, solicitando manualmente');
        // Retornar datos incompletos para que se solicite manualmente
        this.cachedData = {
          country: data.country_name,
          countryCode: data.country_code,
          region: undefined, // Provincia no detectada
          regionCode: data.region_code,
          city: data.city,
          timezone: data.timezone,
          ipAddress: data.ip,
          source: 'ip',
          timestamp: new Date()
        };
        return this.cachedData;
      }
      
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
   * Obtiene explicación de por qué es importante la ubicación real
   */
  public getLocationImportanceExplanation(): string {
    return `La ubicación es fundamental para:
• Cumplir con las leyes de privacidad de tu país
• Configurar correctamente el compliance legal (GDPR, HIPAA, etc.)
• Establecer retención de datos médicos apropiada
• Aplicar las regulaciones locales específicas
• Garantizar que tu información esté protegida según tu jurisdicción`;
  }

  /**
   * Obtiene países disponibles para selección manual con sus características
   */
  public getAvailableCountriesForManualSelection(): Array<{
    code: string;
    name: string;
    gdpr: boolean;
    hipaa: boolean;
    dataRetention: number;
    specialFeatures: string[];
  }> {
    return Object.entries(this.legalComplianceMap).map(([code, compliance]) => ({
      code,
      name: compliance.country,
      gdpr: compliance.gdpr,
      hipaa: compliance.hipaa,
      dataRetention: compliance.dataRetention,
      specialFeatures: compliance.specialRequirements
    }));
  }

  /**
   * Obtiene datos fiduciarios completos para un país específico
   */
  public getFiduciaryDataForCountry(countryCode: string): {
    location: GeolocationData;
    compliance: LegalCompliance;
    explanation: string;
  } | null {
    const compliance = this.legalComplianceMap[countryCode.toUpperCase()];
    if (!compliance) return null;

    // Datos fiduciarios típicos del país
    const fiduciaryData: Record<string, { city: string; region: string }> = {
      'ES': { city: 'Madrid', region: 'Comunidad de Madrid' },
      'MX': { city: 'Ciudad de México', region: 'Ciudad de México' },
      'AR': { city: 'Buenos Aires', region: 'Ciudad Autónoma de Buenos Aires' },
      'US': { city: 'New York', region: 'New York' },
      'GB': { city: 'London', region: 'England' }
    };

    const countryData = fiduciaryData[countryCode.toUpperCase()];
    
    const location: GeolocationData = {
      country: compliance.country,
      countryCode: countryCode.toUpperCase(),
      region: countryData?.region,
      city: countryData?.city,
      source: 'fiduciary',
      timestamp: new Date()
    };

    const explanation = this.getCountrySpecificExplanation(countryCode);

    return {
      location,
      compliance,
      explanation
    };
  }

  /**
   * Obtiene explicación específica para cada país
   */
  private getCountrySpecificExplanation(countryCode: string): string {
    const explanations: Record<string, string> = {
      'ES': `España: Cumple con RGPD y LOPDGDD. Retención de datos médicos: 7 años. 
Derechos: Consentimiento explícito, portabilidad de datos, derecho al olvido.`,
      'MX': `México: Ley Federal de Protección de Datos Personales. Retención: 5 años.
Derechos ARCO: Acceso, Rectificación, Cancelación, Oposición.`,
      'AR': `Argentina: Ley de Protección de Datos Personales. Retención: 5 años.
Registro obligatorio de bases de datos médicas.`,
      'US': `Estados Unidos: Cumple con HIPAA y CCPA. Retención: 7 años.
Autorización específica requerida para uso de datos médicos.`,
      'GB': `Reino Unido: UK GDPR y DPA 2018. Retención: 7 años.
Consentimiento granular y derecho al olvido garantizados.`
    };

    return explanations[countryCode.toUpperCase()] || 'Información de compliance no disponible para este país.';
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
      console.log('Geolocalización no soportada por el navegador');
      return 'denied';
    }

    try {
      // Verificar permisos usando Permissions API si está disponible
      if ('permissions' in navigator) {
        try {
          const permission = await (navigator as Navigator & { permissions?: Permissions }).permissions?.query({ name: 'geolocation' as PermissionName });
          console.log('Estado de permisos de geolocalización:', permission?.state);
          
          // Si los permisos están denegados, no hay nada que hacer
          if (permission.state === 'denied') {
            console.log('Permisos de geolocalización DENEGADOS permanentemente');
            return 'denied';
          }
          
          // Si están concedidos, verificar que realmente funcionan
          if (permission.state === 'granted') {
            try {
              // Intentar obtener posición con timeout razonable
              await this.getCurrentPosition(3000);
              console.log('Permisos concedidos y funcionando correctamente');
              return 'granted';
            } catch (posError) {
              console.log('Permisos concedidos pero error al obtener posición:', posError);
              // Si hay error, intentar con IP como fallback
              return 'prompt';
            }
          }
          
          // Si están en prompt, retornar prompt
          return permission.state;
        } catch (permError) {
          console.log('Error al verificar permisos con Permissions API:', permError);
          // Continuar con fallback
        }
      }

      // Fallback: intentar obtener posición con timeout razonable
      console.log('Usando fallback para verificar permisos...');
      try {
        await this.getCurrentPosition(3000);
        console.log('Permisos funcionando correctamente (fallback)');
        return 'granted';
      } catch (posError) {
        const geolocationError = posError as GeolocationPositionError;
        console.log('Error al verificar permisos de geolocalización (fallback):', {
          code: geolocationError.code,
          message: geolocationError.message
        });
        
        if (geolocationError.code === 1) {
          console.log('Permisos de geolocalización DENEGADOS por el usuario');
          return 'denied';
        }
        if (geolocationError.code === 2) {
          console.log('Ubicación NO DISPONIBLE (fuera de cobertura)');
          return 'prompt'; // Cambiar a prompt para permitir fallback por IP
        }
        if (geolocationError.code === 3) {
          console.log('Timeout en geolocalización');
          return 'prompt'; // Cambiar a prompt para permitir fallback por IP
        }
        
        return 'prompt';
      }
    } catch (error) {
      console.log('Error general al verificar permisos:', error);
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
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      const geocodingResponseReceived = Boolean(data);
      
      // Verificar que data.address existe antes de acceder a sus propiedades
      if (!data.address) {
        console.log('Error en reverse geocoding: No se encontró información de dirección');
        return {};
      }
      
      const locationData = {
        country: data.address.country,
        countryCode: this.getCountryCode(data.address.country),
        region: data.address.state || data.address.province || data.address.region,
        city: data.address.city || data.address.town || data.address.village,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      console.log('[Geolocation] location_resolved:', geocodingResponseReceived);
      return locationData;
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

export const geolocationService = GeolocationServiceImpl.getInstance();
