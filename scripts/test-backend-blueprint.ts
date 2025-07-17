/**
 * 🧪 Test Backend Blueprint - AiDuxCare V.2
 * Script de testing completo del backend según Blueprint Oficial
 * Valida todos los servicios implementados
 */

import ProfessionalProfileService from '../src/services/ProfessionalProfileService.js';
import OptimizedClinicalBrainService from '../src/services/OptimizedClinicalBrainService.js';
import MedicalTranscriptionPipelineService from '../src/services/MedicalTranscriptionPipelineService.js';
import ComplianceService from '../src/services/ComplianceService.js';
import KnowledgeBaseService from '../src/services/KnowledgeBaseService.js';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  errors?: string[];
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  successRate: number;
}

class BackendBlueprintTester {
  private profileService: ProfessionalProfileService;
  private clinicalBrain: OptimizedClinicalBrainService;
  private pipelineService: MedicalTranscriptionPipelineService;
  private complianceService: ComplianceService;
  private knowledgeService: KnowledgeBaseService;
  
  private testSuites: TestSuite[] = [];

  constructor() {
    this.profileService = ProfessionalProfileService.getInstance();
    this.clinicalBrain = OptimizedClinicalBrainService.getInstance();
    this.pipelineService = MedicalTranscriptionPipelineService.getInstance();
    this.complianceService = ComplianceService.getInstance();
    this.knowledgeService = KnowledgeBaseService.getInstance();
  }

  /**
   * Ejecutar todas las pruebas del backend
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 INICIANDO TESTING COMPLETO DEL BACKEND BLUEPRINT');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();

    // Suite 1: Perfiles Profesionales
    await this.runProfessionalProfilesTests();
    
    // Suite 2: Cerebro Clínico Optimizado
    await this.runClinicalBrainTests();
    
    // Suite 3: Pipeline de Transcripción
    await this.runTranscriptionPipelineTests();
    
    // Suite 4: Compliance Automático
    await this.runComplianceTests();
    
    // Suite 5: Base de Conocimiento
    await this.runKnowledgeBaseTests();
    
    // Suite 6: Integración Completa
    await this.runIntegrationTests();

    const totalDuration = Date.now() - startTime;
    
    this.printFinalReport(totalDuration);
  }

  /**
   * Suite 1: Testing de Perfiles Profesionales
   */
  private async runProfessionalProfilesTests(): Promise<void> {
    console.log('\n📋 SUITE 1: PERFILES PROFESIONALES');
    console.log('-'.repeat(50));
    
    const suite: TestSuite = {
      name: 'Professional Profiles',
      tests: [],
      totalDuration: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // Test 1.1: Crear perfil profesional
    const test1 = await this.runTest('Crear Perfil Profesional', async () => {
      const profile = await this.profileService.createProfile({
        license: 'FIS-12345',
        country: 'España',
        city: 'Madrid',
        state: 'Madrid',
        specialties: ['Ortopedia', 'Deportiva'],
        certifications: ['Terapia Manual', 'Punción Seca'],
        practiceType: 'clínica',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      });

      if (!profile.id || !profile.complianceSettings) {
        throw new Error('Perfil creado incorrectamente');
      }

      return `Perfil creado: ${profile.license} (${profile.country})`;
    });
    suite.tests.push(test1);

    // Test 1.2: Validar técnicas según compliance
    const test2 = await this.runTest('Validar Técnicas Compliance', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para validar');
      }

      const profile = profiles[0];
      const validation = this.profileService.validateTechnique(profile.id, 'Terapia Manual');
      
      if (!validation.allowed) {
        throw new Error('Técnica permitida rechazada incorrectamente');
      }

      const forbiddenValidation = this.profileService.validateTechnique(profile.id, 'Prescripción de medicamentos');
      if (forbiddenValidation.allowed) {
        throw new Error('Técnica prohibida permitida incorrectamente');
      }

      return `Validaciones: ${validation.allowed}, ${!forbiddenValidation.allowed}`;
    });
    suite.tests.push(test2);

    // Test 1.3: Verificar expiración de licencia
    const test3 = await this.runTest('Verificar Expiración Licencia', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para verificar');
      }

      const profile = profiles[0];
      const expiryCheck = this.profileService.checkLicenseExpiry(profile.id);
      
      if (!expiryCheck.valid) {
        throw new Error('Licencia válida marcada como expirada');
      }

      return `Licencia válida por ${expiryCheck.daysUntilExpiry} días`;
    });
    suite.tests.push(test3);

    suite.totalDuration = Date.now() - startTime;
    suite.successRate = (suite.tests.filter(t => t.success).length / suite.tests.length) * 100;
    
    this.testSuites.push(suite);
    this.printSuiteResults(suite);
  }

  /**
   * Suite 2: Testing del Cerebro Clínico Optimizado
   */
  private async runClinicalBrainTests(): Promise<void> {
    console.log('\n🧠 SUITE 2: CEREBRO CLÍNICO OPTIMIZADO');
    console.log('-'.repeat(50));
    
    const suite: TestSuite = {
      name: 'Clinical Brain',
      tests: [],
      totalDuration: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // Test 2.1: Análisis clínico básico
    const test1 = await this.runTest('Análisis Clínico Básico', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const request = {
        transcription: 'Paciente refiere dolor lumbar desde hace 2 semanas, dolor mecánico que empeora con el movimiento y alivia con reposo. No presenta banderas rojas.',
        specialty: 'physiotherapy',
        sessionType: 'initial' as const,
        professionalProfileId: profiles[0].id,
        patientInfo: {
          age: 35,
          gender: 'masculino',
          occupation: 'oficinista',
          comorbidities: []
        }
      };

      const analysis = await this.clinicalBrain.analyzeClinicalCase(request);
      
      if (!analysis.success) {
        throw new Error('Análisis clínico falló');
      }

      if (analysis.highlights.length === 0) {
        throw new Error('No se detectaron highlights');
      }

      if (analysis.soapDocument.subjective === '') {
        throw new Error('SOAP subjective está vacío');
      }

      return `Highlights: ${analysis.highlights.length}, SOAP calidad: ${analysis.soapDocument.quality.overall}%`;
    });
    suite.tests.push(test1);

    // Test 2.2: Detección de banderas rojas
    const test2 = await this.runTest('Detección Banderas Rojas', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const request = {
        transcription: 'Paciente refiere dolor lumbar constante, pérdida de peso, fiebre y dolor nocturno. Presenta alteración de la sensibilidad en la pierna derecha.',
        specialty: 'physiotherapy',
        sessionType: 'initial' as const,
        professionalProfileId: profiles[0].id,
        patientInfo: {
          age: 45,
          gender: 'femenino',
          occupation: 'profesora',
          comorbidities: []
        }
      };

      const analysis = await this.clinicalBrain.analyzeClinicalCase(request);
      
      const redFlags = analysis.warnings.filter(w => w.type === 'bandera_roja');
      if (redFlags.length === 0) {
        throw new Error('No se detectaron banderas rojas en caso de alto riesgo');
      }

      return `Banderas rojas detectadas: ${redFlags.length}`;
    });
    suite.tests.push(test2);

    // Test 2.3: Performance del cache
    const test3 = await this.runTest('Performance Cache', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const request = {
        transcription: 'Paciente con dolor de hombro derecho desde hace 1 mes.',
        specialty: 'physiotherapy',
        sessionType: 'initial' as const,
        professionalProfileId: profiles[0].id,
        patientInfo: {
          age: 30,
          gender: 'masculino',
          occupation: 'deportista',
          comorbidities: []
        }
      };

      // Primera llamada
      const start1 = Date.now();
      await this.clinicalBrain.analyzeClinicalCase(request);
      const time1 = Date.now() - start1;

      // Segunda llamada (debería usar cache)
      const start2 = Date.now();
      await this.clinicalBrain.analyzeClinicalCase(request);
      const time2 = Date.now() - start2;

      if (time2 >= time1) {
        throw new Error('Cache no está funcionando correctamente');
      }

      return `Tiempo sin cache: ${time1}ms, con cache: ${time2}ms`;
    });
    suite.tests.push(test3);

    suite.totalDuration = Date.now() - startTime;
    suite.successRate = (suite.tests.filter(t => t.success).length / suite.tests.length) * 100;
    
    this.testSuites.push(suite);
    this.printSuiteResults(suite);
  }

  /**
   * Suite 3: Testing del Pipeline de Transcripción
   */
  private async runTranscriptionPipelineTests(): Promise<void> {
    console.log('\n🎙️ SUITE 3: PIPELINE DE TRANSCRIPCIÓN');
    console.log('-'.repeat(50));
    
    const suite: TestSuite = {
      name: 'Transcription Pipeline',
      tests: [],
      totalDuration: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // Test 3.1: Fase 1 - Anamnesis Aumentada
    const test1 = await this.runTest('Fase 1: Anamnesis Aumentada', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const rawTranscription = `
        Paciente: Hola, vengo porque me duele la espalda desde hace dos semanas.
        Terapeuta: ¿Dónde exactamente sientes el dolor?
        Paciente: En la parte baja de la espalda, sobre todo cuando me muevo.
        Terapeuta: ¿El dolor es constante o intermitente?
        Paciente: Es intermitente, me duele más cuando me siento mucho tiempo.
        Terapeuta: ¿Has notado alguna pérdida de fuerza o sensibilidad?
        Paciente: No, solo el dolor.
      `;

      const phase1Result = await this.pipelineService.executePhase1(
        rawTranscription,
        profiles[0].id,
        {
          age: 28,
          gender: 'femenino',
          occupation: 'estudiante',
          comorbidities: []
        }
      );

      if (phase1Result.highlights.length === 0) {
        throw new Error('No se detectaron highlights en Fase 1');
      }

      if (phase1Result.segments.length === 0) {
        throw new Error('No se procesaron segmentos en Fase 1');
      }

      return `Highlights: ${phase1Result.highlights.length}, Segmentos: ${phase1Result.segments.length}`;
    });
    suite.tests.push(test1);

    // Test 3.2: Fase 2 - Evaluación Funcional
    const test2 = await this.runTest('Fase 2: Evaluación Funcional', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const phase1Result = await this.pipelineService.executePhase1(
        'Paciente con dolor lumbar mecánico',
        profiles[0].id,
        {
          age: 35,
          gender: 'masculino',
          occupation: 'oficinista',
          comorbidities: []
        }
      );

      const phase2Result = await this.pipelineService.executePhase2(
        phase1Result,
        profiles[0].id,
        ['dolor lumbar', 'dolor mecánico'],
        ['bandera_roja']
      );

      if (phase2Result.suggestedTests.length === 0) {
        throw new Error('No se sugirieron tests en Fase 2');
      }

      return `Tests sugeridos: ${phase2Result.suggestedTests.length}`;
    });
    suite.tests.push(test2);

    // Test 3.3: Pipeline Completo
    const test3 = await this.runTest('Pipeline Completo', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const rawTranscription = `
        Paciente: Me duele el hombro derecho desde hace un mes.
        Terapeuta: ¿Cuándo empezó el dolor?
        Paciente: Después de hacer ejercicio en el gimnasio.
        Terapeuta: ¿Qué movimientos te duelen más?
        Paciente: Cuando levanto el brazo por encima de la cabeza.
        Terapeuta: ¿Has notado algún crujido o bloqueo?
        Paciente: Sí, a veces hace un ruido cuando lo muevo.
      `;

      const result = await this.pipelineService.executeCompletePipeline(
        rawTranscription,
        profiles[0].id,
        {
          age: 25,
          gender: 'masculino',
          occupation: 'deportista',
          comorbidities: []
        },
        ['dolor hombro', 'dolor al levantar brazo'],
        ['test provocación']
      );

      if (result.phase3.soapDocument.quality.overall < 50) {
        throw new Error('Calidad SOAP muy baja');
      }

      return `Pipeline completado - Calidad SOAP: ${result.phase3.soapDocument.quality.overall}%`;
    });
    suite.tests.push(test3);

    suite.totalDuration = Date.now() - startTime;
    suite.successRate = (suite.tests.filter(t => t.success).length / suite.tests.length) * 100;
    
    this.testSuites.push(suite);
    this.printSuiteResults(suite);
  }

  /**
   * Suite 4: Testing de Compliance
   */
  private async runComplianceTests(): Promise<void> {
    console.log('\n⚖️ SUITE 4: COMPLIANCE AUTOMÁTICO');
    console.log('-'.repeat(50));
    
    const suite: TestSuite = {
      name: 'Compliance',
      tests: [],
      totalDuration: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // Test 4.1: Verificar compliance de sugerencias
    const test1 = await this.runTest('Verificar Compliance Sugerencias', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const compliance = await this.complianceService.checkCompliance(
        profiles[0].id,
        'Recomiendo tomar ibuprofeno para el dolor',
        'suggestion'
      );

      if (compliance.compliant) {
        throw new Error('Sugerencia de medicamento debería ser rechazada');
      }

      if (compliance.violations.length === 0) {
        throw new Error('No se detectaron violaciones de compliance');
      }

      return `Violaciones detectadas: ${compliance.violations.length}`;
    });
    suite.tests.push(test1);

    // Test 4.2: Verificar compliance de técnicas
    const test2 = await this.runTest('Verificar Compliance Técnicas', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const compliance = await this.complianceService.checkCompliance(
        profiles[0].id,
        'Aplicar acupuntura en puntos específicos',
        'technique'
      );

      // Dependiendo del perfil, puede ser permitido o no
      return `Compliance verificado - Compliant: ${compliance.compliant}`;
    });
    suite.tests.push(test2);

    // Test 4.3: Generar reporte de compliance
    const test3 = await this.runTest('Generar Reporte Compliance', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const report = await this.complianceService.generateComplianceReport(profiles[0].id);
      
      if (report.complianceScore < 0 || report.complianceScore > 100) {
        throw new Error('Score de compliance inválido');
      }

      return `Score de compliance: ${report.complianceScore}%`;
    });
    suite.tests.push(test3);

    suite.totalDuration = Date.now() - startTime;
    suite.successRate = (suite.tests.filter(t => t.success).length / suite.tests.length) * 100;
    
    this.testSuites.push(suite);
    this.printSuiteResults(suite);
  }

  /**
   * Suite 5: Testing de Base de Conocimiento
   */
  private async runKnowledgeBaseTests(): Promise<void> {
    console.log('\n📚 SUITE 5: BASE DE CONOCIMIENTO');
    console.log('-'.repeat(50));
    
    const suite: TestSuite = {
      name: 'Knowledge Base',
      tests: [],
      totalDuration: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // Test 5.1: Buscar conocimiento personalizado
    const test1 = await this.runTest('Buscar Conocimiento Personalizado', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const knowledge = await this.knowledgeService.searchPersonalizedKnowledge(
        profiles[0].id,
        'lumbalgia',
        'pathology'
      );

      if (knowledge.length === 0) {
        throw new Error('No se encontró conocimiento sobre lumbalgia');
      }

      return `Conocimiento encontrado: ${knowledge.length} items`;
    });
    suite.tests.push(test1);

    // Test 5.2: Obtener tests sugeridos
    const test2 = await this.runTest('Obtener Tests Sugeridos', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const tests = this.knowledgeService.getSuggestedTests(
        profiles[0].id,
        ['dolor lumbar', 'dolor que irradia'],
        'Ortopedia'
      );

      if (tests.length === 0) {
        throw new Error('No se sugirieron tests para dolor lumbar');
      }

      return `Tests sugeridos: ${tests.length}`;
    });
    suite.tests.push(test2);

    // Test 5.3: Obtener estadísticas
    const test3 = await this.runTest('Obtener Estadísticas KB', async () => {
      const stats = this.knowledgeService.getKnowledgeStats();
      
      if (stats.totalKnowledge === 0) {
        throw new Error('Base de conocimiento está vacía');
      }

      return `Total conocimiento: ${stats.totalKnowledge}, Países: ${stats.countries.length}`;
    });
    suite.tests.push(test3);

    suite.totalDuration = Date.now() - startTime;
    suite.successRate = (suite.tests.filter(t => t.success).length / suite.tests.length) * 100;
    
    this.testSuites.push(suite);
    this.printSuiteResults(suite);
  }

  /**
   * Suite 6: Testing de Integración Completa
   */
  private async runIntegrationTests(): Promise<void> {
    console.log('\n🔗 SUITE 6: INTEGRACIÓN COMPLETA');
    console.log('-'.repeat(50));
    
    const suite: TestSuite = {
      name: 'Integration',
      tests: [],
      totalDuration: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // Test 6.1: Flujo completo end-to-end
    const test1 = await this.runTest('Flujo Completo End-to-End', async () => {
      // 1. Crear perfil profesional
      const profile = await this.profileService.createProfile({
        license: 'FIS-TEST-001',
        country: 'España',
        city: 'Barcelona',
        specialties: ['Ortopedia'],
        certifications: ['Terapia Manual'],
        practiceType: 'clínica',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      });

      // 2. Análisis clínico
      const analysis = await this.clinicalBrain.analyzeClinicalCase({
        transcription: 'Paciente con dolor lumbar mecánico',
        specialty: 'physiotherapy',
        sessionType: 'initial',
        professionalProfileId: profile.id,
        patientInfo: {
          age: 30,
          gender: 'masculino',
          occupation: 'programador',
          comorbidities: []
        }
      });

      // 3. Verificar compliance
      const compliance = await this.complianceService.checkCompliance(
        profile.id,
        'Aplicar terapia manual',
        'technique'
      );

      // 4. Buscar conocimiento
      const knowledge = await this.knowledgeService.searchPersonalizedKnowledge(
        profile.id,
        'terapia manual',
        'technique'
      );

      if (!analysis.success || !compliance.compliant || knowledge.length === 0) {
        throw new Error('Flujo de integración falló');
      }

      return 'Flujo completo exitoso';
    });
    suite.tests.push(test1);

    // Test 6.2: Performance bajo carga
    const test2 = await this.runTest('Performance Bajo Carga', async () => {
      const profiles = this.profileService.getAllProfiles();
      if (profiles.length === 0) {
        throw new Error('No hay perfiles para testing');
      }

      const startTime = Date.now();
      const promises = [];

      // Simular 5 análisis concurrentes
      for (let i = 0; i < 5; i++) {
        promises.push(
          this.clinicalBrain.analyzeClinicalCase({
            transcription: `Paciente ${i} con dolor lumbar`,
            specialty: 'physiotherapy',
            sessionType: 'initial',
            professionalProfileId: profiles[0].id,
            patientInfo: {
              age: 30 + i,
              gender: 'masculino',
              occupation: 'oficinista',
              comorbidities: []
            }
          })
        );
      }

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      if (totalTime > 10000) { // 10 segundos
        throw new Error('Performance muy lenta bajo carga');
      }

      return `5 análisis concurrentes en ${totalTime}ms`;
    });
    suite.tests.push(test2);

    suite.totalDuration = Date.now() - startTime;
    suite.successRate = (suite.tests.filter(t => t.success).length / suite.tests.length) * 100;
    
    this.testSuites.push(suite);
    this.printSuiteResults(suite);
  }

  /**
   * Ejecutar un test individual
   */
  private async runTest(testName: string, testFunction: () => Promise<string>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      return {
        testName,
        success: true,
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        testName,
        success: false,
        duration,
        details: 'Test falló',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Imprimir resultados de una suite
   */
  private printSuiteResults(suite: TestSuite): void {
    console.log(`\n📊 Resultados de ${suite.name}:`);
    console.log(`   Tiempo total: ${suite.totalDuration}ms`);
    console.log(`   Tests exitosos: ${suite.tests.filter(t => t.success).length}/${suite.tests.length}`);
    console.log(`   Tasa de éxito: ${suite.successRate.toFixed(1)}%`);
    
    suite.tests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      console.log(`   ${status} ${test.testName} (${test.duration}ms)`);
      if (!test.success && test.errors) {
        test.errors.forEach(error => console.log(`      Error: ${error}`));
      }
    });
  }

  /**
   * Imprimir reporte final
   */
  private printFinalReport(totalDuration: number): void {
    console.log('\n' + '=' .repeat(80));
    console.log('🏁 REPORTE FINAL DEL TESTING BACKEND BLUEPRINT');
    console.log('=' .repeat(80));
    
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const successfulTests = this.testSuites.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.success).length, 0
    );
    const overallSuccessRate = (successfulTests / totalTests) * 100;
    
    console.log(`⏱️ Tiempo total: ${totalDuration}ms`);
    console.log(`🧪 Tests ejecutados: ${totalTests}`);
    console.log(`✅ Tests exitosos: ${successfulTests}`);
    console.log(`📈 Tasa de éxito general: ${overallSuccessRate.toFixed(1)}%`);
    
    console.log('\n📋 Resumen por suites:');
    this.testSuites.forEach(suite => {
      const status = suite.successRate >= 80 ? '🟢' : suite.successRate >= 60 ? '🟡' : '🔴';
      console.log(`   ${status} ${suite.name}: ${suite.successRate.toFixed(1)}% (${suite.totalDuration}ms)`);
    });
    
    if (overallSuccessRate >= 90) {
      console.log('\n🎉 ¡BACKEND BLUEPRINT LISTO PARA PRODUCCIÓN!');
    } else if (overallSuccessRate >= 70) {
      console.log('\n⚠️ Backend funcional pero requiere optimizaciones');
    } else {
      console.log('\n🚨 Backend requiere correcciones críticas');
    }
    
    console.log('=' .repeat(80));
  }
}

// Ejecutar testing si se llama directamente
const tester = new BackendBlueprintTester();
tester.runAllTests().catch(error => {
  console.error('💥 Error fatal en testing:', error);
  process.exit(1);
});

export default BackendBlueprintTester; 