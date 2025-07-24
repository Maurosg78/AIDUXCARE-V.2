/**
 * 🏥 Servicio de Restricciones de Servicios Profesionales - MVP España
 * Determina qué servicios y tratamientos pueden ofrecerse según la ubicación y certificaciones
 * 
 * MVP: Enfocado en fisioterapeutas españoles
 * Futuro: Expansión internacional con regulaciones específicas por país
 */

export interface ProfessionalService {
  id: string;
  name: string;
  description: string;
  category: 'treatment' | 'assessment' | 'consultation';
  requiresCertification: boolean;
  certificationType?: string;
  restrictions: ServiceRestriction[];
}

export interface ServiceRestriction {
  countryCode: string;
  region?: string;
  isAllowed: boolean;
  requirements: string[];
  notes: string;
  officialUrl?: string;
}

export interface ServiceAvailability {
  service: ProfessionalService;
  isAvailable: boolean;
  requirements: string[];
  restrictions: string[];
  certificationRequired: boolean;
  certificationType?: string;
}

// Base de datos de servicios profesionales - MVP ESPAÑA
// Enfocado en fisioterapeutas españoles según regulaciones del CGCFE
const PROFESSIONAL_SERVICES: ProfessionalService[] = [
  {
    id: 'manual-therapy',
    name: 'Terapia Manual',
    description: 'Técnicas manuales de evaluación y tratamiento fisioterapéutico',
    category: 'treatment',
    requiresCertification: false,
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa'
        ],
        notes: 'Parte del ámbito de competencia del fisioterapeuta según CGCFE.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  },
  {
    id: 'exercise-prescription',
    name: 'Prescripción de Ejercicios',
    description: 'Prescripción de ejercicios terapéuticos y programas de rehabilitación',
    category: 'treatment',
    requiresCertification: false,
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa'
        ],
        notes: 'Competencia exclusiva del fisioterapeuta según legislación española.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  },
  {
    id: 'electrotherapy',
    name: 'Electroterapia',
    description: 'Uso de corrientes eléctricas para tratamiento fisioterapéutico',
    category: 'treatment',
    requiresCertification: false,
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa'
        ],
        notes: 'Parte del ámbito de competencia del fisioterapeuta.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  },
  {
    id: 'dry-needling',
    name: 'Punción Seca',
    description: 'Técnica de punción seca para el tratamiento del dolor muscular',
    category: 'treatment',
    requiresCertification: true,
    certificationType: 'dry-needling-certification',
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa',
          'Formación específica en punción seca',
          'Certificación en técnicas de punción'
        ],
        notes: 'Permitido para fisioterapeutas con formación específica. Requiere certificación.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  },
  {
    id: 'massage-therapy',
    name: 'Masaje Terapéutico',
    description: 'Masaje terapéutico para el tratamiento de tejidos blandos',
    category: 'treatment',
    requiresCertification: false,
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa'
        ],
        notes: 'No existe la profesión de Masage Therapist en España. Solo fisioterapeutas pueden realizar masajes terapéuticos.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  },
  {
    id: 'respiratory-physiotherapy',
    name: 'Fisioterapia Respiratoria',
    description: 'Técnicas específicas para el tratamiento de patologías respiratorias',
    category: 'treatment',
    requiresCertification: false,
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa'
        ],
        notes: 'Especialización dentro de la fisioterapia. No requiere certificación específica.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  },
  {
    id: 'sports-physiotherapy',
    name: 'Fisioterapia Deportiva',
    description: 'Tratamiento especializado para lesiones deportivas',
    category: 'treatment',
    requiresCertification: false,
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa'
        ],
        notes: 'Especialización dentro de la fisioterapia. Formación continua recomendada.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  },
  {
    id: 'neurological-physiotherapy',
    name: 'Fisioterapia Neurológica',
    description: 'Tratamiento de pacientes con patologías neurológicas',
    category: 'treatment',
    requiresCertification: false,
    restrictions: [
      {
        countryCode: 'ES',
        isAllowed: true,
        requirements: [
          'Título de Fisioterapeuta',
          'Colegiación activa'
        ],
        notes: 'Especialización dentro de la fisioterapia. Formación específica recomendada.',
        officialUrl: 'https://www.cgcfisio.es/'
      }
    ]
  }
];

export class ProfessionalServicesService {
  private static instance: ProfessionalServicesService;

  static getInstance(): ProfessionalServicesService {
    if (!ProfessionalServicesService.instance) {
      ProfessionalServicesService.instance = new ProfessionalServicesService();
    }
    return ProfessionalServicesService.instance;
  }

  /**
   * Obtiene todos los servicios disponibles
   */
  getAllServices(): ProfessionalService[] {
    return PROFESSIONAL_SERVICES;
  }

  /**
   * Obtiene un servicio específico por ID
   */
  getServiceById(serviceId: string): ProfessionalService | null {
    return PROFESSIONAL_SERVICES.find(service => service.id === serviceId) || null;
  }

  /**
   * Verifica la disponibilidad de un servicio para una ubicación específica
   * MVP: Enfocado en España
   */
  checkServiceAvailability(
    serviceId: string, 
    countryCode: string, 
    region?: string,
    userCertifications: string[] = []
  ): ServiceAvailability | null {
    const service = this.getServiceById(serviceId);
    if (!service) return null;

    // MVP: Solo verificar España por ahora
    if (countryCode !== 'ES') {
      return {
        service,
        isAvailable: false,
        requirements: [],
        restrictions: ['Servicio no disponible fuera de España (MVP)'],
        certificationRequired: service.requiresCertification,
        certificationType: service.certificationType
      };
    }

    // Buscar restricción específica para España
    const restriction = service.restrictions.find(r => r.countryCode === 'ES');

    if (!restriction) {
      return {
        service,
        isAvailable: false,
        requirements: [],
        restrictions: ['Servicio no configurado para España'],
        certificationRequired: service.requiresCertification,
        certificationType: service.certificationType
      };
    }

    // Verificar si el usuario tiene las certificaciones requeridas
    const hasRequiredCertification = service.requiresCertification 
      ? userCertifications.includes(service.certificationType || '')
      : true;

    const isAvailable = restriction.isAllowed && hasRequiredCertification;

    return {
      service,
      isAvailable,
      requirements: restriction.requirements,
      restrictions: isAvailable ? [] : ['Certificación requerida no encontrada'],
      certificationRequired: service.requiresCertification,
      certificationType: service.certificationType
    };
  }

  /**
   * Obtiene todos los servicios disponibles para una ubicación específica
   * MVP: Enfocado en España
   */
  getAvailableServices(
    countryCode: string, 
    userCertifications: string[] = []
  ): ServiceAvailability[] {
    // MVP: Solo mostrar servicios para España
    if (countryCode !== 'ES') {
      return PROFESSIONAL_SERVICES.map(service => ({
        service,
        isAvailable: false,
        requirements: [],
        restrictions: ['Servicio no disponible fuera de España (MVP)'],
        certificationRequired: service.requiresCertification,
        certificationType: service.certificationType
      }));
    }

    return PROFESSIONAL_SERVICES.map(service => 
      this.checkServiceAvailability(service.id, countryCode, undefined, userCertifications)
    ).filter((availability): availability is ServiceAvailability => availability !== null);
  }

  /**
   * Obtiene servicios que requieren certificación específica
   * MVP: Enfocado en España
   */
  getServicesRequiringCertification(
    countryCode: string
  ): ProfessionalService[] {
    // MVP: Solo para España
    if (countryCode !== 'ES') {
      return [];
    }

    return PROFESSIONAL_SERVICES.filter(service => {
      const restriction = service.restrictions.find(r => r.countryCode === 'ES');
      return restriction?.isAllowed && service.requiresCertification;
    });
  }

  /**
   * Obtiene información sobre certificaciones requeridas para una ubicación
   * MVP: Enfocado en España
   */
  getCertificationRequirements(
    countryCode: string
  ): Array<{
    service: ProfessionalService;
    requirements: string[];
    officialUrl?: string;
  }> {
    // MVP: Solo para España
    if (countryCode !== 'ES') {
      return [];
    }

    const services = this.getServicesRequiringCertification(countryCode);
    
    return services.map(service => {
      const restriction = service.restrictions.find(r => r.countryCode === 'ES');

      return {
        service,
        requirements: restriction?.requirements || [],
        officialUrl: restriction?.officialUrl
      };
    });
  }

  /**
   * Obtiene servicios específicos para fisioterapeutas españoles
   * MVP: Método específico para el nicho objetivo
   */
  getSpanishPhysiotherapistServices(
    userCertifications: string[] = []
  ): ServiceAvailability[] {
    return this.getAvailableServices('ES', userCertifications);
  }

  /**
   * Verifica si un servicio está disponible para fisioterapeutas españoles
   * MVP: Método específico para el nicho objetivo
   */
  isServiceAvailableForSpanishPhysiotherapist(
    serviceId: string,
    userCertifications: string[] = []
  ): boolean {
    const availability = this.checkServiceAvailability(serviceId, 'ES', undefined, userCertifications);
    return availability?.isAvailable || false;
  }
}

// Exportar instancia singleton
export const professionalServicesService = ProfessionalServicesService.getInstance(); 