const ClinicalInsightService = require('../src/services/ClinicalInsightService');

/**
 * TEST DE INTEGRACIÓN END-TO-END: CASCADA DE ANÁLISIS V2
 * 
 * Verifica que la arquitectura de cascada funcione completamente:
 * 1. Estación 1: Triaje de Banderas Rojas (Gemini-Flash)
 * 2. Estación 2: Extracción de Hechos (Gemini-Flash)  
 * 3. Estación 3: Análisis Final y SOAP (Gemini-Pro)
 * 
 * Y que el ClinicalAnalysisResult final se ensamble correctamente.
 */
describe('🚀 Integración End-to-End: Cascada de Análisis Clínico V2', () => {
  let clinicalInsightService;

  beforeAll(() => {
    // Solo ejecutar si hay credenciales reales configuradas
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      console.warn('⚠️ Saltando tests E2E - No hay credenciales de Google Cloud configuradas');
      return;
    }
    
    clinicalInsightService = new ClinicalInsightService();
  });

  beforeEach(() => {
    // Skip si no hay credenciales
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      pending('Credenciales de Google Cloud no configuradas');
    }
  });

  describe('📊 Caso Clínico Real: Espondiloartropatía Sospechosa', () => {
    const transcripcionCompleta = `
      Paciente masculino de 28 años que consulta por dolor de espalda de 3 semanas de evolución.
      
      HISTORIA ACTUAL:
      - Dolor localizado en región lumbar baja
      - Intensidad 8/10 durante las noches
      - Rigidez matutina que dura aproximadamente 90 minutos
      - No mejora con reposo, empeora al permanecer inmóvil
      - Mejora ligeramente con actividad física
      
      ANTECEDENTES:
      - Psoriasis diagnosticada hace 2 años
      - Episodio de uveítis anterior hace 8 meses
      - No antecedentes traumáticos
      - Padre con espondilitis anquilosante
      
      MEDICACIÓN ACTUAL:
      - Ibuprofeno 600mg cada 8 horas
      - Cremas tópicas para psoriasis
      - No alergias conocidas
      
      IMPACTO FUNCIONAL:
      - Dificultad para dormir
      - Limitación para actividades laborales (trabajo de oficina)
      - Evita ejercicio por temor al dolor
      
      EXAMEN FÍSICO:
      - Postura antálgica
      - Tensión muscular paravertebral
      - Limitación dolorosa de flexión lumbar
      - Test de Schober positivo
      - No déficit neurológico
    `;

    test('🎯 INTEGRACIÓN COMPLETA: Debe ejecutar las 3 estaciones y ensamblar resultado final', async () => {
      console.log('🚀 Iniciando test de integración completa...');
      
      const startTime = Date.now();
      
      // EJECUTAR CASCADA COMPLETA
      const resultado = await clinicalInsightService.processTranscription(
        transcripcionCompleta,
        {
          specialty: 'fisioterapia',
          sessionType: 'initial'
        }
      );
      
      const tiempoTotal = (Date.now() - startTime) / 1000;
      
      console.log('⏱️ Tiempo total de procesamiento:', tiempoTotal, 'segundos');
      console.log('📊 Resultado completo:', JSON.stringify(resultado, null, 2));

      // ========================================
      // VERIFICACIONES DE ESTRUCTURA PRINCIPAL
      // ========================================
      
      // 1. Verificar que se ejecutaron las 3 estaciones
      expect(resultado.cascade_metadata).toBeDefined();
      expect(resultado.cascade_metadata.stations_completed).toBe(3);
      expect(resultado.cascade_metadata.pipeline_version).toBe('2.0-cascade');
      
      // 2. Verificar que se usaron los modelos correctos
      expect(resultado.cascade_metadata.cost_optimization.models_used).toEqual([
        'gemini-flash', 'gemini-flash', 'gemini-pro'
      ]);
      
      // 3. Verificar tiempo de procesamiento razonable
      expect(resultado.cascade_metadata.total_processing_time).toBeLessThan(60); // Menos de 1 minuto
      
      // ========================================
      // VERIFICACIONES DE ESTACIÓN 1: BANDERAS ROJAS
      // ========================================
      
      const estacion1 = resultado.cascade_metadata.station_results.station1_red_flags;
      
      // Debe detectar banderas rojas críticas del caso
      expect(estacion1.count).toBeGreaterThan(0);
      expect(estacion1.flags).toContain(
        expect.stringMatching(/dolor nocturno|rigidez matutina/i)
      );
      
      console.log('🚩 Banderas rojas detectadas:', estacion1.flags);
      
      // ========================================
      // VERIFICACIONES DE ESTACIÓN 2: HECHOS CLÍNICOS
      // ========================================
      
      const estacion2 = resultado.cascade_metadata.station_results.station2_clinical_facts;
      
      // Debe extraer múltiples categorías de hechos
      expect(estacion2.keys_extracted).toBeGreaterThan(3);
      expect(estacion2.categories).toContain('symptoms');
      expect(estacion2.categories).toContain('history');
      
      console.log('📋 Hechos clínicos extraídos:', estacion2.categories);
      
      // ========================================
      // VERIFICACIONES DE ESTACIÓN 3: ANÁLISIS FINAL
      // ========================================
      
      const estacion3 = resultado.cascade_metadata.station_results.station3_final_analysis;
      
      // Debe generar todas las secciones principales
      expect(estacion3.sections_generated).toContain('warnings');
      expect(estacion3.sections_generated).toContain('suggestions');
      expect(estacion3.sections_generated).toContain('soap_analysis');
      
      // ========================================
      // VERIFICACIONES DE CONTENIDO CLÍNICO
      // ========================================
      
      // WARNINGS: Debe incluir alertas apropiadas para el caso
      expect(resultado.warnings).toBeDefined();
      expect(Array.isArray(resultado.warnings)).toBe(true);
      expect(resultado.warnings.length).toBeGreaterThan(0);
      
      // Buscar warning específico sobre patrón inflamatorio
      const warningInflamatorio = resultado.warnings.find(w => 
        w.title.toLowerCase().includes('inflamatorio') ||
        w.description.toLowerCase().includes('nocturno') ||
        w.description.toLowerCase().includes('rigidez')
      );
      expect(warningInflamatorio).toBeDefined();
      expect(warningInflamatorio.severity).toBe('HIGH');
      
      // SUGGESTIONS: Debe incluir recomendaciones apropiadas
      expect(resultado.suggestions).toBeDefined();
      expect(Array.isArray(resultado.suggestions)).toBe(true);
      expect(resultado.suggestions.length).toBeGreaterThan(0);
      
      // Buscar sugerencia de referencia a reumatología
      const sugerenciaReumatologia = resultado.suggestions.find(s => 
        s.description.toLowerCase().includes('reumatolog') ||
        s.type === 'referral'
      );
      expect(sugerenciaReumatologia).toBeDefined();
      
      // SOAP ANALYSIS: Debe estar completa y estructurada
      expect(resultado.soap_analysis).toBeDefined();
      expect(resultado.soap_analysis.subjective).toBeDefined();
      expect(resultado.soap_analysis.objective).toBeDefined();
      expect(resultado.soap_analysis.assessment).toBeDefined();
      expect(resultado.soap_analysis.plan).toBeDefined();
      
      // Assessment debe identificar alto riesgo
      expect(resultado.soap_analysis.assessment.risk_stratification).toBe('HIGH');
      
      // Plan debe incluir acciones inmediatas
      expect(resultado.soap_analysis.plan.immediate_actions).toBeDefined();
      expect(Array.isArray(resultado.soap_analysis.plan.immediate_actions)).toBe(true);
      expect(resultado.soap_analysis.plan.immediate_actions.length).toBeGreaterThan(0);
      
      console.log('✅ Test de integración completa EXITOSO');
      console.log('📈 Métricas finales:', {
        tiempoTotal: tiempoTotal,
        banderas: estacion1.count,
        hechos: estacion2.keys_extracted,
        warnings: resultado.warnings.length,
        suggestions: resultado.suggestions.length
      });
      
    }, 120000); // Timeout de 2 minutos para llamadas reales a Vertex AI
    
    test('🔄 EFICIENCIA: Debe ser más rápido que procesamiento monolítico', async () => {
      console.log('⚡ Evaluando eficiencia de la cascada...');
      
      const startTime = Date.now();
      
      await clinicalInsightService.processTranscription(
        transcripcionCompleta,
        { specialty: 'fisioterapia' }
      );
      
      const tiempoCascada = (Date.now() - startTime) / 1000;
      
      // La cascada debería ser más eficiente que una llamada monolítica
      // Objetivo: menos de 45 segundos total
      expect(tiempoCascada).toBeLessThan(45);
      
      console.log(`⚡ Cascada completada en ${tiempoCascada}s (objetivo: <45s)`);
      
    }, 60000);
  });

  describe('🧪 Casos Edge: Manejo de Situaciones Límite', () => {
    test('📝 Transcripción Mínima: Debe manejar contenido limitado', async () => {
      const transcripcionMinima = 'Paciente con dolor de espalda desde ayer.';
      
      const resultado = await clinicalInsightService.processTranscription(
        transcripcionMinima,
        { specialty: 'fisioterapia' }
      );
      
      // Debe completar las 3 estaciones aunque el contenido sea limitado
      expect(resultado.cascade_metadata.stations_completed).toBe(3);
      
      // Debe generar estructura básica aunque con contenido limitado
      expect(resultado.warnings).toBeDefined();
      expect(resultado.suggestions).toBeDefined();
      expect(resultado.soap_analysis).toBeDefined();
      
    }, 60000);
    
    test('🚫 Sin Banderas Rojas: Debe manejar casos de bajo riesgo', async () => {
      const transcripcionBajoRiesgo = `
        Paciente de 25 años con dolor de cuello leve desde hace 2 días.
        Relacionado con mala postura en el trabajo.
        Dolor 3/10, mejora con movimiento.
        No síntomas neurológicos.
        Sin antecedentes relevantes.
      `;
      
      const resultado = await clinicalInsightService.processTranscription(
        transcripcionBajoRiesgo,
        { specialty: 'fisioterapia' }
      );
      
      // Puede no tener banderas rojas
      const banderas = resultado.cascade_metadata.station_results.station1_red_flags.count;
      
      // Si no hay banderas rojas, el assessment debería ser LOW o MEDIUM
      if (banderas === 0) {
        expect(['LOW', 'MEDIUM']).toContain(
          resultado.soap_analysis.assessment.risk_stratification
        );
      }
      
    }, 60000);
  });

  describe('📊 Validación de Calidad de Datos', () => {
    const casoComplejo = `
      Paciente femenina de 55 años, bailarina profesional.
      Dolor en cadera derecha de 6 meses de evolución.
      Intensidad variable 4-8/10.
      Empeora con extensión y rotación externa.
      Antecedentes de fractura de cadera hace 3 años.
      Cirugía de artroplastia parcial.
      Actualmente toma tramadol 50mg PRN.
      Fisioterapia previa con mejora parcial.
      Limitación severa para actividades profesionales.
    `;

    test('🔍 CALIDAD DE DATOS: Debe extraer información específica y relevante', async () => {
      const resultado = await clinicalInsightService.processTranscription(
        casoComplejo,
        { specialty: 'fisioterapia' }
      );
      
      // Verificar calidad de warnings
      const warnings = resultado.warnings;
      warnings.forEach(warning => {
        expect(warning).toHaveProperty('id');
        expect(warning).toHaveProperty('severity');
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(warning.severity);
        expect(warning).toHaveProperty('title');
        expect(warning).toHaveProperty('description');
        expect(warning.description.length).toBeGreaterThan(10);
      });
      
      // Verificar calidad de suggestions
      const suggestions = resultado.suggestions;
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('type');
        expect(['treatment', 'assessment', 'referral', 'education']).toContain(suggestion.type);
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion.description.length).toBeGreaterThan(10);
      });
      
      // Verificar completitud de SOAP
      const soap = resultado.soap_analysis;
      expect(soap.subjective.chief_complaint).toBeTruthy();
      expect(soap.assessment.clinical_impression).toBeTruthy();
      expect(soap.plan.treatment_plan).toBeTruthy();
      
    }, 90000);
    
    test('📈 CONSISTENCIA: Múltiples ejecuciones deben ser consistentes', async () => {
      const transcripcionTest = 'Paciente con lumbalgia mecánica desde hace 1 semana.';
      
      // Ejecutar cascada 2 veces
      const [resultado1, resultado2] = await Promise.all([
        clinicalInsightService.processTranscription(transcripcionTest, { specialty: 'fisioterapia' }),
        clinicalInsightService.processTranscription(transcripcionTest, { specialty: 'fisioterapia' })
      ]);
      
      // Los resultados deben tener estructura similar
      expect(resultado1.cascade_metadata.stations_completed).toBe(
        resultado2.cascade_metadata.stations_completed
      );
      
      // El nivel de riesgo debería ser similar
      expect(resultado1.soap_analysis.assessment.risk_stratification).toBe(
        resultado2.soap_analysis.assessment.risk_stratification
      );
      
    }, 120000);
  });

  describe('⚡ Verificación de Rendimiento', () => {
    test('🎯 BENCHMARK: Debe cumplir objetivos de tiempo por estación', async () => {
      const transcripcionBenchmark = `
        Paciente con dolor cervical de 1 mes.
        Dolor 6/10, irradia a brazo derecho.
        Hormigueo en dedos.
        Trabajo de oficina, muchas horas frente al computador.
      `;
      
      // Monitorear tiempos de cada estación individualmente
      const tiempos = {
        estacion1: 0,
        estacion2: 0,
        estacion3: 0
      };
      
      // Mock temporal para medir tiempos (solo para este test)
      const originalTriaje = clinicalInsightService.triageRedFlags;
      const originalExtraccion = clinicalInsightService.extractClinicalFacts;
      const originalAnalisis = clinicalInsightService.generateFinalAnalysis;
      
      clinicalInsightService.triageRedFlags = async (transcription) => {
        const start = Date.now();
        const result = await originalTriaje.call(clinicalInsightService, transcription);
        tiempos.estacion1 = (Date.now() - start) / 1000;
        return result;
      };
      
      clinicalInsightService.extractClinicalFacts = async (transcription) => {
        const start = Date.now();
        const result = await originalExtraccion.call(clinicalInsightService, transcription);
        tiempos.estacion2 = (Date.now() - start) / 1000;
        return result;
      };
      
      clinicalInsightService.generateFinalAnalysis = async (transcription, redFlags, facts) => {
        const start = Date.now();
        const result = await originalAnalisis.call(clinicalInsightService, transcription, redFlags, facts);
        tiempos.estacion3 = (Date.now() - start) / 1000;
        return result;
      };
      
      // Ejecutar benchmark
      await clinicalInsightService.processTranscription(
        transcripcionBenchmark,
        { specialty: 'fisioterapia' }
      );
      
      // Restaurar métodos originales
      clinicalInsightService.triageRedFlags = originalTriaje;
      clinicalInsightService.extractClinicalFacts = originalExtraccion;
      clinicalInsightService.generateFinalAnalysis = originalAnalisis;
      
      // Verificar objetivos de tiempo
      console.log('⏱️ Tiempos por estación:', tiempos);
      
      // Estación 1: Triaje debe ser <5s (objetivo de Mauricio)
      expect(tiempos.estacion1).toBeLessThan(5);
      
      // Estación 2: Extracción debe ser razonable
      expect(tiempos.estacion2).toBeLessThan(15);
      
      // Estación 3: Análisis final puede ser más largo pero razonable
      expect(tiempos.estacion3).toBeLessThan(30);
      
      // Total debe ser mejor que procesamiento monolítico
      const tiempoTotal = tiempos.estacion1 + tiempos.estacion2 + tiempos.estacion3;
      expect(tiempoTotal).toBeLessThan(45);
      
    }, 90000);
  });
}); 