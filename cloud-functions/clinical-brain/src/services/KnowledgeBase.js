const { Storage } = require('@google-cloud/storage');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

class KnowledgeBase {
  constructor() {
    this.storage = new Storage();
    this.bucketName = process.env.KNOWLEDGE_BASE_BUCKET || 'aiduxcare-clinical-knowledge';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutos
  }

  static async load(specialty) {
    const kb = new KnowledgeBase();
    return await kb.loadKnowledgeBase(specialty);
  }

  async loadKnowledgeBase(specialty) {
    const cacheKey = `knowledge_${specialty}`;
    const cachedData = this.cache.get(cacheKey);
    
    // Verificar cache
    if (cachedData && (Date.now() - cachedData.timestamp) < this.cacheExpiry) {
      logger.info('Using cached knowledge base', {
        specialty,
        cacheAge: Date.now() - cachedData.timestamp
      });
      return cachedData.data;
    }

    try {
      logger.info('Loading knowledge base from Cloud Storage', {
        specialty,
        bucket: this.bucketName
      });

      // Cargar configuración base
      const baseConfig = await this.loadConfigFile('base/clinical-base.json');
      
      // Cargar configuración específica de especialidad
      const specialtyConfig = await this.loadConfigFile(`specialties/${specialty}.json`);
      
      // Combinar configuraciones
      const knowledgeBase = this.mergeConfigurations(baseConfig, specialtyConfig);
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        data: knowledgeBase,
        timestamp: Date.now()
      });

      logger.info('Knowledge base loaded successfully', {
        specialty,
        rulesCount: knowledgeBase.rules[specialty]?.length || 0,
        terminologyCount: knowledgeBase.terminology[specialty]?.length || 0
      });

      return knowledgeBase;

    } catch (error) {
      logger.error('Failed to load knowledge base', {
        specialty,
        error: error.message,
        stack: error.stack
      });

      // Devolver configuración de fallback
      return this.createFallbackKnowledgeBase(specialty);
    }
  }

  async loadConfigFile(filePath) {
    try {
      const file = this.storage.bucket(this.bucketName).file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        logger.warn('Config file not found', { filePath });
        return {};
      }

      const [contents] = await file.download();
      const config = JSON.parse(contents.toString());
      
      logger.info('Config file loaded', {
        filePath,
        size: contents.length
      });

      return config;

    } catch (error) {
      logger.error('Failed to load config file', {
        filePath,
        error: error.message
      });
      return {};
    }
  }

  mergeConfigurations(baseConfig, specialtyConfig) {
    const merged = {
      rules: { ...baseConfig.rules, ...specialtyConfig.rules },
      terminology: { ...baseConfig.terminology, ...specialtyConfig.terminology },
      protocols: { ...baseConfig.protocols, ...specialtyConfig.protocols },
      contraindications: { ...baseConfig.contraindications, ...specialtyConfig.contraindications },
      redFlags: { ...baseConfig.redFlags, ...specialtyConfig.redFlags }
    };

    return merged;
  }

  createFallbackKnowledgeBase(specialty) {
    logger.warn('Creating fallback knowledge base', { specialty });

    const fallbackKnowledge = {
      rules: {},
      terminology: {},
      protocols: {},
      contraindications: {},
      redFlags: {}
    };

    // Reglas básicas por especialidad
    switch (specialty) {
      case 'physiotherapy':
        fallbackKnowledge.rules[specialty] = [
          'Evaluar signos neurológicos antes de cualquier manipulación',
          'Contraindicar ejercicios en presencia de inflamación aguda',
          'Monitorear respuesta al dolor durante tratamiento',
          'Verificar estabilidad articular antes de movilización'
        ];
        fallbackKnowledge.terminology[specialty] = [
          { term: 'ROM', definition: 'Rango de movimiento articular' },
          { term: 'ADL', definition: 'Actividades de la vida diaria' },
          { term: 'PROM', definition: 'Rango de movimiento pasivo' },
          { term: 'AROM', definition: 'Rango de movimiento activo' }
        ];
        fallbackKnowledge.redFlags[specialty] = [
          'Pérdida de control de esfínteres',
          'Debilidad progresiva en extremidades',
          'Entumecimiento en silla de montar',
          'Fiebre con dolor de espalda'
        ];
        break;

      case 'psychology':
        fallbackKnowledge.rules[specialty] = [
          'Evaluar riesgo suicida en cada sesión',
          'Mantener confidencialidad excepto en casos de riesgo',
          'Documentar cambios significativos en el estado mental',
          'Referir a psiquiatría si se sospecha psicosis'
        ];
        fallbackKnowledge.terminology[specialty] = [
          { term: 'DSM-5', definition: 'Manual Diagnóstico y Estadístico de Trastornos Mentales' },
          { term: 'GAF', definition: 'Escala de Evaluación de la Actividad Global' },
          { term: 'PHQ-9', definition: 'Cuestionario de Salud del Paciente para Depresión' },
          { term: 'GAD-7', definition: 'Escala de Trastorno de Ansiedad Generalizada' }
        ];
        fallbackKnowledge.redFlags[specialty] = [
          'Ideación suicida activa',
          'Alucinaciones auditivas',
          'Delirios paranoides',
          'Comportamiento agresivo'
        ];
        break;

      case 'general':
        fallbackKnowledge.rules[specialty] = [
          'Evaluar signos vitales en cada consulta',
          'Investigar síntomas de alarma',
          'Considerar diagnóstico diferencial',
          'Referir a especialista cuando sea necesario'
        ];
        fallbackKnowledge.terminology[specialty] = [
          { term: 'HTA', definition: 'Hipertensión arterial' },
          { term: 'DM', definition: 'Diabetes mellitus' },
          { term: 'IMC', definition: 'Índice de masa corporal' },
          { term: 'FC', definition: 'Frecuencia cardíaca' }
        ];
        fallbackKnowledge.redFlags[specialty] = [
          'Dolor torácico con disnea',
          'Cefalea súbita intensa',
          'Pérdida de conciencia',
          'Sangrado activo'
        ];
        break;

      default:
        fallbackKnowledge.rules[specialty] = [
          'Seguir protocolos de seguridad del paciente',
          'Documentar todos los hallazgos relevantes',
          'Mantener comunicación clara con el paciente',
          'Referir cuando exceda el alcance de práctica'
        ];
        fallbackKnowledge.terminology[specialty] = [
          { term: 'Anamnesis', definition: 'Historia clínica del paciente' },
          { term: 'Exploración', definition: 'Examen físico del paciente' },
          { term: 'Diagnóstico', definition: 'Identificación de la condición médica' },
          { term: 'Tratamiento', definition: 'Intervención terapéutica' }
        ];
        fallbackKnowledge.redFlags[specialty] = [
          'Deterioro súbito del estado general',
          'Signos de shock',
          'Alteración del nivel de conciencia',
          'Signos de infección sistémica'
        ];
    }

    return fallbackKnowledge;
  }

  async updateKnowledgeBase(specialty, newData) {
    try {
      const filePath = `specialties/${specialty}.json`;
      const file = this.storage.bucket(this.bucketName).file(filePath);
      
      await file.save(JSON.stringify(newData, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            updatedAt: new Date().toISOString(),
            updatedBy: 'clinical-brain-system'
          }
        }
      });

      // Limpiar cache
      this.cache.delete(`knowledge_${specialty}`);

      logger.info('Knowledge base updated', {
        specialty,
        filePath,
        timestamp: new Date().toISOString()
      });

      return true;

    } catch (error) {
      logger.error('Failed to update knowledge base', {
        specialty,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  async listAvailableSpecialties() {
    try {
      const [files] = await this.storage.bucket(this.bucketName).getFiles({
        prefix: 'specialties/'
      });

      const specialties = files
        .filter(file => file.name.endsWith('.json'))
        .map(file => file.name.replace('specialties/', '').replace('.json', ''));

      logger.info('Available specialties retrieved', {
        count: specialties.length,
        specialties
      });

      return specialties;

    } catch (error) {
      logger.error('Failed to list specialties', {
        error: error.message
      });
      return ['physiotherapy', 'psychology', 'general']; // Fallback
    }
  }

  clearCache() {
    this.cache.clear();
    logger.info('Knowledge base cache cleared');
  }

  /**
   * Obtiene banderas rojas críticas para triaje rápido
   * Optimizado para uso en la Estación 1 de la cascada de análisis
   * @param {string} specialty - Especialidad médica (default: 'physiotherapy')
   * @returns {string[]} Array de banderas rojas críticas
   */
  getCriticalRedFlags(specialty = 'physiotherapy') {
    // Banderas rojas críticas para fisioterapia basadas en evidencia científica
    const physiotherapyRedFlags = [
      'Pérdida de control de esfínteres',
      'Debilidad progresiva en extremidades',
      'Entumecimiento en silla de montar',
      'Fiebre con dolor de espalda',
      'Dolor nocturno severo no mecánico',
      'Pérdida de peso inexplicada',
      'Rigidez matutina mayor a 1 hora',
      'Antecedentes de cáncer con nuevo dolor',
      'Trastornos neurológicos progresivos',
      'Dolor torácico con actividad física',
      'Cefalea súbita intensa',
      'Alteraciones visuales agudas',
      'Dificultad respiratoria con movimiento',
      'Síncope o mareos severos',
      'Cambios en patrones de dolor',
      'Hormigueo bilateral en extremidades',
      'Claudicación neurógena',
      'Signos de infección sistémica',
      'Deformidad ósea visible',
      'Limitación funcional severa aguda'
    ];

    const psychologyRedFlags = [
      'Ideación suicida activa',
      'Alucinaciones auditivas o visuales',
      'Delirios paranoides',
      'Comportamiento agresivo hacia otros',
      'Amenazas de autolesión',
      'Pérdida completa de contacto con la realidad',
      'Mutismo selectivo súbito',
      'Agitación psicomotora severa',
      'Despersonalización intensa',
      'Episodios disociativos',
      'Consumo activo de sustancias',
      'Crisis de pánico recurrentes',
      'Síntomas maníacos',
      'Depresión mayor severa',
      'Trastorno del pensamiento'
    ];

    const generalRedFlags = [
      'Dolor torácico con disnea',
      'Cefalea súbita intensa',
      'Pérdida de conciencia',
      'Sangrado activo',
      'Fiebre alta persistente',
      'Dificultad respiratoria severa',
      'Alteraciones neurológicas agudas',
      'Dolor abdominal intenso',
      'Síncope recurrente',
      'Cambios en estado mental',
      'Signos de deshidratación severa',
      'Reacciones alérgicas graves',
      'Convulsiones',
      'Alteraciones del ritmo cardíaco',
      'Signos de shock'
    ];

    // Devolver banderas rojas según especialidad
    switch (specialty) {
      case 'physiotherapy':
      case 'fisioterapia':
        return physiotherapyRedFlags;
      
      case 'psychology':
      case 'psicologia':
        return psychologyRedFlags;
      
      case 'general':
      default:
        return generalRedFlags;
    }
  }
}

module.exports = KnowledgeBase; 