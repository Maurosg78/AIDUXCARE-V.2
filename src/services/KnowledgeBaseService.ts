/**
 * 📚 Knowledge Base Service - AiDuxCare V.2
 * Base de conocimiento especializada para fisioterapia
 * Implementación del Blueprint Oficial
 */

import ProfessionalProfileService, { ProfessionalProfile } from './ProfessionalProfileService';

export interface MedicalKnowledge {
  id: string;
  category: 'pathology' | 'technique' | 'test' | 'medication' | 'protocol';
  title: string;
  description: string;
  content: string;
  countries: string[];
  specialties: string[];
  certifications: string[];
  contraindications: string[];
  references: string[];
  lastUpdated: Date;
}

export interface ClinicalProtocol {
  id: string;
  name: string;
  description: string;
  indications: string[];
  contraindications: string[];
  steps: string[];
  expectedOutcomes: string[];
  timeline: string;
  countries: string[];
  specialties: string[];
}

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'orthopedic' | 'neurological' | 'cardiorespiratory' | 'functional';
  description: string;
  procedure: string[];
  positiveSigns: string[];
  negativeSigns: string[];
  contraindications: string[];
  reliability: number; // 0-100
  countries: string[];
}

export class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;
  private profileService: ProfessionalProfileService;
  private medicalKnowledge: Map<string, MedicalKnowledge> = new Map();
  private clinicalProtocols: Map<string, ClinicalProtocol> = new Map();
  private diagnosticTests: Map<string, DiagnosticTest> = new Map();

  private constructor() {
    this.profileService = ProfessionalProfileService.getInstance();
    this.initializeKnowledgeBase();
  }

  static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService();
    }
    return KnowledgeBaseService.instance;
  }

  /**
   * Inicializar base de conocimiento médica
   */
  private initializeKnowledgeBase(): void {
    // Patologías comunes en fisioterapia
    this.initializePathologies();
    
    // Técnicas de tratamiento
    this.initializeTechniques();
    
    // Tests diagnósticos
    this.initializeDiagnosticTests();
    
    // Protocolos clínicos
    this.initializeClinicalProtocols();
    
    console.log('📚 Base de conocimiento inicializada');
    console.log(`   - Patologías: ${Array.from(this.medicalKnowledge.values()).filter(k => k.category === 'pathology').length}`);
    console.log(`   - Técnicas: ${Array.from(this.medicalKnowledge.values()).filter(k => k.category === 'technique').length}`);
    console.log(`   - Tests: ${this.diagnosticTests.size}`);
    console.log(`   - Protocolos: ${this.clinicalProtocols.size}`);
  }

  /**
   * Inicializar patologías
   */
  private initializePathologies(): void {
    const pathologies: MedicalKnowledge[] = [
      {
        id: 'path-001',
        category: 'pathology',
        title: 'Lumbalgia Mecánica',
        description: 'Dolor lumbar de origen mecánico',
        content: 'La lumbalgia mecánica es el dolor lumbar que se origina en estructuras musculoesqueléticas...',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Ortopedia', 'Deportiva'],
        certifications: [],
        contraindications: ['Fractura vertebral', 'Infección', 'Cáncer'],
        references: ['Clinical Practice Guidelines for Low Back Pain'],
        lastUpdated: new Date()
      },
      {
        id: 'path-002',
        category: 'pathology',
        title: 'Síndrome de Pinzamiento Subacromial',
        description: 'Compresión de estructuras subacromiales',
        content: 'El síndrome de pinzamiento subacromial se caracteriza por dolor en el hombro...',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Ortopedia', 'Deportiva'],
        certifications: [],
        contraindications: ['Fractura de hombro', 'Luxación reciente'],
        references: ['Shoulder Impingement Syndrome Guidelines'],
        lastUpdated: new Date()
      },
      {
        id: 'path-003',
        category: 'pathology',
        title: 'Espondiloartritis',
        description: 'Enfermedad inflamatoria sistémica',
        content: 'La espondiloartritis es una enfermedad inflamatoria que afecta principalmente la columna...',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Reumatología'],
        certifications: [],
        contraindications: ['Fase aguda severa'],
        references: ['ASAS Classification Criteria'],
        lastUpdated: new Date()
      }
    ];

    pathologies.forEach(pathology => {
      this.medicalKnowledge.set(pathology.id, pathology);
    });
  }

  /**
   * Inicializar técnicas
   */
  private initializeTechniques(): void {
    const techniques: MedicalKnowledge[] = [
      {
        id: 'tech-001',
        category: 'technique',
        title: 'Terapia Manual',
        description: 'Técnicas manuales de fisioterapia',
        content: 'La terapia manual incluye movilizaciones, manipulaciones y técnicas de tejido blando...',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Ortopedia', 'Neurología'],
        certifications: ['Terapia Manual'],
        contraindications: ['Fractura reciente', 'Infección activa', 'Cáncer activo'],
        references: ['Manual Therapy Guidelines'],
        lastUpdated: new Date()
      },
      {
        id: 'tech-002',
        category: 'technique',
        title: 'Punción Seca',
        description: 'Técnica de punción para puntos gatillo',
        content: 'La punción seca es una técnica invasiva para el tratamiento de puntos gatillo...',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Ortopedia', 'Dolor'],
        certifications: ['Punción Seca'],
        contraindications: ['Trastornos de coagulación', 'Infección local', 'Embarazo'],
        references: ['Dry Needling Guidelines'],
        lastUpdated: new Date()
      },
      {
        id: 'tech-003',
        category: 'technique',
        title: 'Acupuntura',
        description: 'Técnica de medicina tradicional china',
        content: 'La acupuntura utiliza agujas finas en puntos específicos del cuerpo...',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Dolor', 'Neurología'],
        certifications: ['Acupuntura'],
        contraindications: ['Trastornos de coagulación', 'Infección local', 'Embarazo'],
        references: ['Acupuncture Guidelines'],
        lastUpdated: new Date()
      }
    ];

    techniques.forEach(technique => {
      this.medicalKnowledge.set(technique.id, technique);
    });
  }

  /**
   * Inicializar tests diagnósticos
   */
  private initializeDiagnosticTests(): void {
    const tests: DiagnosticTest[] = [
      {
        id: 'test-001',
        name: 'Test de Lasègue',
        category: 'orthopedic',
        description: 'Evaluación de irritación radicular lumbar',
        procedure: [
          'Paciente en decúbito supino',
          'Elevar la pierna extendida',
          'Observar reproducción del dolor radicular'
        ],
        positiveSigns: [
          'Reproducción del dolor radicular',
          'Dolor antes de 60° de elevación',
          'Dolor en distribución dermatomal'
        ],
        negativeSigns: [
          'No reproducción del dolor',
          'Dolor solo en muslo posterior',
          'Elevación > 60° sin dolor radicular'
        ],
        contraindications: ['Fractura vertebral', 'Inestabilidad lumbar'],
        reliability: 85,
        countries: ['España', 'México', 'Estados Unidos', 'Canadá']
      },
      {
        id: 'test-002',
        name: 'Test de Neer',
        category: 'orthopedic',
        description: 'Evaluación de pinzamiento subacromial',
        procedure: [
          'Paciente sentado',
          'Elevar el brazo en flexión',
          'Observar reproducción del dolor'
        ],
        positiveSigns: [
          'Reproducción del dolor subacromial',
          'Dolor en arco doloroso',
          'Crepitación subacromial'
        ],
        negativeSigns: [
          'No reproducción del dolor',
          'Movimiento completo sin dolor'
        ],
        contraindications: ['Fractura de hombro', 'Luxación reciente'],
        reliability: 78,
        countries: ['España', 'México', 'Estados Unidos', 'Canadá']
      },
      {
        id: 'test-003',
        name: 'Test de Timed Up and Go',
        category: 'functional',
        description: 'Evaluación de movilidad y equilibrio',
        procedure: [
          'Paciente sentado en silla',
          'Levantarse y caminar 3 metros',
          'Girar y regresar a la silla',
          'Medir tiempo total'
        ],
        positiveSigns: [
          'Tiempo > 20 segundos',
          'Inestabilidad durante la marcha',
          'Necesidad de ayuda'
        ],
        negativeSigns: [
          'Tiempo < 10 segundos',
          'Marcha estable',
          'Sin necesidad de ayuda'
        ],
        contraindications: ['Inestabilidad severa', 'Dolor agudo'],
        reliability: 92,
        countries: ['España', 'México', 'Estados Unidos', 'Canadá']
      }
    ];

    tests.forEach(test => {
      this.diagnosticTests.set(test.id, test);
    });
  }

  /**
   * Inicializar protocolos clínicos
   */
  private initializeClinicalProtocols(): void {
    const protocols: ClinicalProtocol[] = [
      {
        id: 'protocol-001',
        name: 'Protocolo de Lumbalgia Aguda',
        description: 'Manejo de lumbalgia aguda mecánica',
        indications: ['Dolor lumbar agudo < 6 semanas', 'Origen mecánico', 'Sin banderas rojas'],
        contraindications: ['Banderas rojas', 'Dolor crónico', 'Patología sistémica'],
        steps: [
          'Evaluación inicial completa',
          'Educación del paciente',
          'Ejercicios de estabilización',
          'Progresión gradual de actividad'
        ],
        expectedOutcomes: [
          'Reducción del dolor en 2 semanas',
          'Mejora de la movilidad',
          'Retorno a actividades normales'
        ],
        timeline: '4-6 semanas',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Ortopedia']
      },
      {
        id: 'protocol-002',
        name: 'Protocolo de Rehabilitación Post-ACV',
        description: 'Rehabilitación neurológica post-accidente cerebrovascular',
        indications: ['Secuelas de ACV', 'Hemiparesia', 'Alteración de marcha'],
        contraindications: ['ACV agudo', 'Inestabilidad médica', 'Contraindicaciones médicas'],
        steps: [
          'Evaluación neurológica completa',
          'Ejercicios de Bobath',
          'Entrenamiento de marcha',
          'Actividades de la vida diaria'
        ],
        expectedOutcomes: [
          'Mejora de la función motora',
          'Independencia en marcha',
          'Mejora de actividades diarias'
        ],
        timeline: '6-12 meses',
        countries: ['España', 'México', 'Estados Unidos', 'Canadá'],
        specialties: ['Neurología']
      }
    ];

    protocols.forEach(protocol => {
      this.clinicalProtocols.set(protocol.id, protocol);
    });
  }

  /**
   * Buscar conocimiento personalizado según perfil profesional
   */
  async searchPersonalizedKnowledge(
    professionalProfileId: string,
    query: string,
    category?: string
  ): Promise<MedicalKnowledge[]> {
    const profile = this.profileService.getProfile(professionalProfileId);
    if (!profile) {
      return [];
    }

    const results: MedicalKnowledge[] = [];
    const queryLower = query.toLowerCase();

    for (const knowledge of this.medicalKnowledge.values()) {
      // Filtrar por país
      if (!knowledge.countries.includes(profile.country)) {
        continue;
      }

      // Filtrar por especialidad
      if (knowledge.specialties.length > 0 && 
          !knowledge.specialties.some(spec => profile.specialties.includes(spec))) {
        continue;
      }

      // Filtrar por certificaciones
      if (knowledge.certifications.length > 0 && 
          !knowledge.certifications.some(cert => profile.certifications.includes(cert))) {
        continue;
      }

      // Filtrar por categoría
      if (category && knowledge.category !== category) {
        continue;
      }

      // Buscar en contenido
      if (knowledge.title.toLowerCase().includes(queryLower) ||
          knowledge.description.toLowerCase().includes(queryLower) ||
          knowledge.content.toLowerCase().includes(queryLower)) {
        results.push(knowledge);
      }
    }

    return results.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  /**
   * Obtener tests diagnósticos sugeridos
   */
  getSuggestedTests(
    professionalProfileId: string,
    symptoms: string[],
    specialty: string
  ): DiagnosticTest[] {
    const profile = this.profileService.getProfile(professionalProfileId);
    if (!profile) {
      return [];
    }

    const suggestedTests: DiagnosticTest[] = [];
    const symptomsLower = symptoms.map(s => s.toLowerCase());

    for (const test of this.diagnosticTests.values()) {
      // Filtrar por país
      if (!test.countries.includes(profile.country)) {
        continue;
      }

      // Filtrar por especialidad
      if (test.category === 'orthopedic' && !profile.specialties.includes('Ortopedia')) {
        continue;
      }
      if (test.category === 'neurological' && !profile.specialties.includes('Neurología')) {
        continue;
      }

      // Sugerir tests basados en síntomas
      let shouldSuggest = false;

      if (symptomsLower.some(s => s.includes('dolor lumbar') || s.includes('lumbalgia'))) {
        if (test.name.toLowerCase().includes('lasègue') || test.name.toLowerCase().includes('lasegue')) {
          shouldSuggest = true;
        }
      }

      if (symptomsLower.some(s => s.includes('hombro') || s.includes('dolor hombro'))) {
        if (test.name.toLowerCase().includes('neer')) {
          shouldSuggest = true;
        }
      }

      if (symptomsLower.some(s => s.includes('equilibrio') || s.includes('marcha'))) {
        if (test.name.toLowerCase().includes('timed up and go')) {
          shouldSuggest = true;
        }
      }

      if (shouldSuggest) {
        suggestedTests.push(test);
      }
    }

    return suggestedTests.sort((a, b) => b.reliability - a.reliability);
  }

  /**
   * Obtener protocolos clínicos relevantes
   */
  getRelevantProtocols(
    professionalProfileId: string,
    diagnosis: string,
    specialty: string
  ): ClinicalProtocol[] {
    const profile = this.profileService.getProfile(professionalProfileId);
    if (!profile) {
      return [];
    }

    const relevantProtocols: ClinicalProtocol[] = [];
    const diagnosisLower = diagnosis.toLowerCase();

    for (const protocol of this.clinicalProtocols.values()) {
      // Filtrar por país
      if (!protocol.countries.includes(profile.country)) {
        continue;
      }

      // Filtrar por especialidad
      if (!protocol.specialties.includes(specialty)) {
        continue;
      }

      // Buscar protocolos relevantes
      if (protocol.name.toLowerCase().includes(diagnosisLower) ||
          protocol.description.toLowerCase().includes(diagnosisLower) ||
          protocol.indications.some(ind => ind.toLowerCase().includes(diagnosisLower))) {
        relevantProtocols.push(protocol);
      }
    }

    return relevantProtocols;
  }

  /**
   * Obtener contraindicaciones para una técnica
   */
  getContraindications(techniqueId: string, professionalProfileId: string): string[] {
    const knowledge = this.medicalKnowledge.get(techniqueId);
    const profile = this.profileService.getProfile(professionalProfileId);
    
    if (!knowledge || !profile) {
      return [];
    }

    // Verificar si el profesional tiene las certificaciones necesarias
    const hasRequiredCertifications = knowledge.certifications.length === 0 ||
      knowledge.certifications.some(cert => profile.certifications.includes(cert));

    if (!hasRequiredCertifications) {
      return ['Certificación requerida: ' + knowledge.certifications.join(', ')];
    }

    return knowledge.contraindications;
  }

  /**
   * Obtener referencias bibliográficas
   */
  getReferences(knowledgeId: string): string[] {
    const knowledge = this.medicalKnowledge.get(knowledgeId);
    return knowledge?.references || [];
  }

  /**
   * Actualizar conocimiento
   */
  updateKnowledge(knowledgeId: string, updates: Partial<MedicalKnowledge>): boolean {
    const knowledge = this.medicalKnowledge.get(knowledgeId);
    if (!knowledge) {
      return false;
    }

    const updatedKnowledge: MedicalKnowledge = {
      ...knowledge,
      ...updates,
      lastUpdated: new Date()
    };

    this.medicalKnowledge.set(knowledgeId, updatedKnowledge);
    return true;
  }

  /**
   * Agregar nuevo conocimiento
   */
  addKnowledge(knowledge: Omit<MedicalKnowledge, 'id' | 'lastUpdated'>): string {
    const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newKnowledge: MedicalKnowledge = {
      ...knowledge,
      id,
      lastUpdated: new Date()
    };

    this.medicalKnowledge.set(id, newKnowledge);
    return id;
  }

  /**
   * Obtener estadísticas de la base de conocimiento
   */
  getKnowledgeStats(): {
    totalKnowledge: number;
    pathologies: number;
    techniques: number;
    tests: number;
    protocols: number;
    countries: string[];
  } {
    const knowledge = Array.from(this.medicalKnowledge.values());
    const countries = new Set<string>();
    
    knowledge.forEach(k => k.countries.forEach(c => countries.add(c)));

    return {
      totalKnowledge: knowledge.length,
      pathologies: knowledge.filter(k => k.category === 'pathology').length,
      techniques: knowledge.filter(k => k.category === 'technique').length,
      tests: this.diagnosticTests.size,
      protocols: this.clinicalProtocols.size,
      countries: Array.from(countries)
    };
  }
}

export default KnowledgeBaseService; 