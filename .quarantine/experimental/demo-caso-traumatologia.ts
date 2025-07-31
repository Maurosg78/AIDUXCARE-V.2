#!/usr/bin/env tsx

/**
 * 🧠 AiDuxCare V.2 - Demostración Cerebro Clínico
 * Caso Complejo de Traumatología - Fisioterapia
 * Demostración del pipeline completo: PromptFactory + ModelSelector + Vertex AI
 */

import { PromptFactory, PromptContext } from './src/core/ai/PromptFactory';
import { ModelSelector, ComplexityAnalysis } from './src/core/ai/ModelSelector';
import { vertexAIService } from './src/services/VertexAIService';

interface CasoTraumatologia {
  nombre: string;
  paciente: string;
  historia: string;
  sintomas: string;
  exploracion: string;
  antecedentes: string;
  transcripcion: string;
}

class DemostracionCerebroClinico {
  private casoComplejo: CasoTraumatologia = {
    nombre: 'Caso Complejo - Traumatología Deportiva',
    paciente: 'Carlos Mendoza, 28 años, futbolista profesional',
    historia: 'Lesión durante partido de fútbol hace 3 semanas. Contacto directo con otro jugador en la rodilla izquierda. Dolor inmediato e incapacidad para continuar jugando.',
    sintomas: 'Dolor agudo en rodilla izquierda, inestabilidad al caminar, hinchazón progresiva, limitación severa en flexión y extensión, sensación de bloqueo articular, dolor nocturno intenso.',
    exploracion: 'Edema importante en rodilla izquierda, equimosis en cara lateral, dolor a la palpación en ligamento lateral externo, test de Lachman positivo, test de cajón anterior positivo, limitación de movilidad: flexión 45°, extensión -10°.',
    antecedentes: 'Lesión previa en rodilla derecha hace 2 años (meniscopatía), cirugía artroscópica, rehabilitación completa. Sin otras patologías relevantes.',
    transcripcion: `Paciente de 28 años, futbolista profesional, presenta lesión en rodilla izquierda durante partido hace 3 semanas. Contacto directo con otro jugador generó dolor agudo inmediato e incapacidad para continuar. Desde entonces presenta dolor intenso, inestabilidad al caminar, hinchazón progresiva y limitación severa de movilidad. Dolor nocturno que interfiere con el sueño. Exploración muestra edema importante, equimosis lateral, test de Lachman y cajón anterior positivos, limitación flexión 45° y extensión -10°. Antecedentes de lesión previa en rodilla derecha con cirugía artroscópica hace 2 años. Paciente refiere sensación de bloqueo articular y miedo a recaída. Objetivo: retorno al deporte de alto rendimiento.`
  };

  async ejecutarDemostracion(): Promise<void> {
    console.log('🧠 AIDUXCARE V.2 - DEMOSTRACIÓN CEREBRO CLÍNICO');
    console.log('=' .repeat(80));
    console.log('🏥 CASO COMPLEJO DE TRAUMATOLOGÍA DEPORTIVA');
    console.log('=' .repeat(80));
    console.log('');

    // Paso 1: Presentación del caso
    this.presentarCaso();
    console.log('');

    // Paso 2: Análisis de complejidad
    await this.analizarComplejidad();
    console.log('');

    // Paso 3: Generación de prompts especializados
    await this.generarPromptsEspecializados();
    console.log('');

    // Paso 4: Procesamiento con Vertex AI
    await this.procesarConVertexAI();
    console.log('');

    // Paso 5: Resultado final
    await this.mostrarResultadoFinal();
  }

  private presentarCaso(): void {
    console.log('📋 PRESENTACIÓN DEL CASO');
    console.log('=' .repeat(50));
    console.log(`👤 Paciente: ${this.casoComplejo.paciente}`);
    console.log(`🏥 Especialidad: Fisioterapia Deportiva/Traumatología`);
    console.log(`📅 Tiempo de evolución: 3 semanas`);
    console.log('');
    console.log('📖 HISTORIA CLÍNICA:');
    console.log(`   ${this.casoComplejo.historia}`);
    console.log('');
    console.log('🩺 SÍNTOMAS ACTUALES:');
    console.log(`   ${this.casoComplejo.sintomas}`);
    console.log('');
    console.log('🔍 EXPLORACIÓN FÍSICA:');
    console.log(`   ${this.casoComplejo.exploracion}`);
    console.log('');
    console.log('📚 ANTECEDENTES:');
    console.log(`   ${this.casoComplejo.antecedentes}`);
    console.log('');
    console.log('🎯 OBJETIVO DEL PACIENTE: Retorno al deporte de alto rendimiento');
  }

  private async analizarComplejidad(): Promise<void> {
    console.log('🎯 ANÁLISIS DE COMPLEJIDAD - CEREBRO CLÍNICO');
    console.log('=' .repeat(50));

    const startTime = Date.now();
    
    try {
      // Análisis con ModelSelector
      const analysis = await ModelSelector.analyzeAndSelectModel(
        this.casoComplejo.transcripcion, 
        'fisioterapia'
      );

      const analysisTime = Date.now() - startTime;

      console.log('🧠 PROCESAMIENTO DEL CEREBRO CLÍNICO:');
      console.log(`   ⏱️ Tiempo de análisis: ${analysisTime}ms`);
      console.log(`   🎯 Complejidad detectada: ${analysis.complexity.toUpperCase()}`);
      console.log(`   🚨 Banderas rojas identificadas: ${analysis.redFlags.length}`);
      
      if (analysis.redFlags.length > 0) {
        console.log('   🚨 BANDERAS ROJAS DETECTADAS:');
        analysis.redFlags.forEach((flag, index) => {
          console.log(`      ${index + 1}. ${flag}`);
        });
      }

      console.log(`   🧠 Modelo seleccionado: ${analysis.modelRecommendation.model}`);
      console.log(`   💰 Costo estimado: $${analysis.modelRecommendation.estimatedCost.toFixed(4)}`);
      console.log(`   📊 Confianza del análisis: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`   ⚡ Nivel de urgencia: ${analysis.urgency.toUpperCase()}`);
      console.log(`   💡 Razón de selección: ${analysis.modelRecommendation.reason}`);

      // Guardar análisis para uso posterior
      this.analysis = analysis;

    } catch (error) {
      console.error('❌ Error en análisis de complejidad:', error);
    }
  }

  private async generarPromptsEspecializados(): Promise<void> {
    console.log('🔧 GENERACIÓN DE PROMPTS ESPECIALIZADOS');
    console.log('=' .repeat(50));

    if (!this.analysis) {
      console.log('❌ Error: Análisis no disponible');
      return;
    }

    try {
      // Crear contexto clínico
      const context: PromptContext = {
        specialty: 'fisioterapia',
        complexity: this.analysis.complexity,
        redFlags: this.analysis.redFlags,
        patientContext: this.casoComplejo.paciente,
        medicalHistory: this.casoComplejo.antecedentes
      };

      // Generar prompts especializados
      const systemPrompt = PromptFactory.generateSystemPrompt(context);
      const entityPrompt = PromptFactory.generateEntityExtractionPrompt(context, this.casoComplejo.transcripcion);
      const soapPrompt = PromptFactory.generateSOAPPrompt(context, this.casoComplejo.transcripcion, []);

      console.log('📝 PROMPTS GENERADOS:');
      console.log(`   🧠 System Prompt: ${systemPrompt.length} caracteres`);
      console.log(`   🔍 Entity Prompt: ${entityPrompt.length} caracteres`);
      console.log(`   📋 SOAP Prompt: ${soapPrompt.length} caracteres`);
      console.log(`   📊 Total: ${systemPrompt.length + entityPrompt.length + soapPrompt.length} caracteres`);

      console.log('');
      console.log('🧠 SYSTEM PROMPT (Extracto):');
      console.log('   ' + systemPrompt.substring(0, 200) + '...');
      console.log('');
      console.log('🔍 ENTITY PROMPT (Extracto):');
      console.log('   ' + entityPrompt.substring(0, 200) + '...');

      // Guardar contexto para uso posterior
      this.context = context;

    } catch (error) {
      console.error('❌ Error generando prompts:', error);
    }
  }

  private async procesarConVertexAI(): Promise<void> {
    console.log('🧠 PROCESAMIENTO CON VERTEX AI');
    console.log('=' .repeat(50));

    if (!this.analysis || !this.context) {
      console.log('❌ Error: Análisis o contexto no disponible');
      return;
    }

    const startTime = Date.now();

    try {
      console.log(`🎯 Enviando a ${this.analysis.modelRecommendation.model}...`);
      
      // Intentar procesamiento real con Vertex AI
      let vertexResponse: any;
      
      try {
        const analysisResult = await vertexAIService.analyzeClinicalText(this.casoComplejo.transcripcion);
        
        vertexResponse = {
          model: this.analysis.modelRecommendation.model,
          complexity: this.analysis.complexity,
          redFlags: this.analysis.redFlags,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          warnings: analysisResult.warnings,
          suggestions: this.generarSugerenciasTraumatologia(),
          soap_analysis: analysisResult.soap,
          entities: analysisResult.entities
        };
        
        console.log('✅ Respuesta real de Vertex AI obtenida');
        
      } catch (error) {
        console.log('🔄 Vertex AI no disponible, simulando respuesta...');
        
        // Simulación de respuesta para demostración
        vertexResponse = this.simularRespuestaTraumatologia();
      }

      const totalTime = Date.now() - startTime;
      
      console.log(`⏱️ Tiempo total de procesamiento: ${totalTime}ms`);
      console.log(`🧠 Modelo utilizado: ${vertexResponse.model}`);
      console.log(`📊 Complejidad procesada: ${vertexResponse.complexity}`);
      console.log(`🚨 Banderas rojas: ${vertexResponse.redFlags.length}`);

      // Guardar respuesta para uso posterior
      this.vertexResponse = vertexResponse;

    } catch (error) {
      console.error('❌ Error en procesamiento:', error);
    }
  }

  private async mostrarResultadoFinal(): Promise<void> {
    console.log('🎉 RESULTADO FINAL - CEREBRO CLÍNICO');
    console.log('=' .repeat(50));

    if (!this.vertexResponse) {
      console.log('❌ Error: Respuesta no disponible');
      return;
    }

    console.log('📋 ANÁLISIS CLÍNICO COMPLETO:');
    console.log('');

    // Mostrar advertencias si existen
    if (this.vertexResponse.warnings && this.vertexResponse.warnings.length > 0) {
      console.log('🚨 ADVERTENCIAS CLÍNICAS:');
      this.vertexResponse.warnings.forEach((warning: string, index: number) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    // Mostrar sugerencias
    if (this.vertexResponse.suggestions && this.vertexResponse.suggestions.length > 0) {
      console.log('💡 SUGERENCIAS DE TRATAMIENTO:');
      this.vertexResponse.suggestions.forEach((suggestion: string, index: number) => {
        console.log(`   ${index + 1}. ${suggestion}`);
      });
      console.log('');
    }

    // Mostrar documento SOAP
    if (this.vertexResponse.soap_analysis) {
      console.log('📋 DOCUMENTO SOAP GENERADO:');
      console.log('');
      console.log('📝 SUBJETIVO:');
      console.log(`   ${this.vertexResponse.soap_analysis.subjective}`);
      console.log('');
      console.log('🔍 OBJETIVO:');
      console.log(`   ${this.vertexResponse.soap_analysis.objective}`);
      console.log('');
      console.log('🎯 ASSESSMENT:');
      console.log(`   ${this.vertexResponse.soap_analysis.assessment}`);
      console.log('');
      console.log('📋 PLAN:');
      console.log(`   ${this.vertexResponse.soap_analysis.plan}`);
      console.log('');
    }

    // Mostrar entidades clínicas si existen
    if (this.vertexResponse.entities && this.vertexResponse.entities.length > 0) {
      console.log('🔍 ENTIDADES CLÍNICAS IDENTIFICADAS:');
      this.vertexResponse.entities.slice(0, 10).forEach((entity: any) => {
        console.log(`   • ${entity.text} (${entity.type}) - Confianza: ${(entity.confidence * 100).toFixed(1)}%`);
      });
      console.log('');
    }

    // Resumen final
    console.log('📊 RESUMEN DEL PROCESAMIENTO:');
    console.log(`   🧠 Modelo utilizado: ${this.vertexResponse.model}`);
    console.log(`   ⏱️ Tiempo de procesamiento: ${this.vertexResponse.processingTime}ms`);
    console.log(`   🎯 Complejidad: ${this.vertexResponse.complexity}`);
    console.log(`   🚨 Banderas rojas: ${this.vertexResponse.redFlags.length}`);
    console.log(`   💰 Costo estimado: $${this.analysis?.modelRecommendation.estimatedCost.toFixed(4)}`);
    console.log('');
    console.log('✅ CEREBRO CLÍNICO - PROCESAMIENTO COMPLETADO');
  }

  private generarSugerenciasTraumatologia(): string[] {
    return [
      'Evaluación ortopédica inmediata para confirmar lesión ligamentaria',
      'Estudios de imagen: RMN de rodilla para evaluar LCA y meniscos',
      'Programa de rehabilitación preoperatoria si cirugía indicada',
      'Control de edema con crioterapia y compresión',
      'Ejercicios de fortalecimiento de cuádriceps y estabilización',
      'Progresión gradual de carga y movilidad',
      'Evaluación biomecánica para prevención de recaídas',
      'Plan de retorno progresivo al deporte'
    ];
  }

  private simularRespuestaTraumatologia(): any {
    return {
      model: this.analysis?.modelRecommendation.model || 'gemini-1.5-pro',
      complexity: this.analysis?.complexity || 'critical',
      redFlags: this.analysis?.redFlags || ['dolor intenso', 'inestabilidad', 'limitación severa'],
      timestamp: new Date().toISOString(),
      processingTime: Math.random() * 2000 + 1000,
      warnings: [
        'Sospecha de lesión ligamentaria compleja (LCA + LLE)',
        'Riesgo de inestabilidad articular crónica',
        'Necesidad de evaluación ortopédica urgente',
        'Posible indicación quirúrgica'
      ],
      suggestions: this.generarSugerenciasTraumatologia(),
      soap_analysis: {
        subjective: 'Paciente de 28 años, futbolista profesional, presenta lesión aguda en rodilla izquierda durante actividad deportiva hace 3 semanas. Dolor intenso, inestabilidad al deambular, edema progresivo y limitación severa de movilidad. Dolor nocturno que interfiere con el sueño. Antecedentes de lesión previa en rodilla contralateral con cirugía artroscópica.',
        objective: 'Exploración muestra edema importante en rodilla izquierda, equimosis en cara lateral, dolor a la palpación en ligamento lateral externo. Tests de Lachman y cajón anterior positivos. Limitación de movilidad: flexión 45°, extensión -10°. Inestabilidad funcional evidente.',
        assessment: 'Sospecha de lesión ligamentaria compleja en rodilla izquierda, probablemente LCA + LLE, con posible afectación meniscal. Paciente de alto rendimiento deportivo con antecedentes de lesión contralateral. Riesgo de inestabilidad crónica si no se maneja adecuadamente.',
        plan: '1) Derivación urgente a traumatólogo deportivo. 2) Estudios de imagen: RMN de rodilla. 3) Control de edema con crioterapia y compresión. 4) Programa de rehabilitación preoperatoria si cirugía indicada. 5) Evaluación biomecánica post-tratamiento. 6) Plan de retorno progresivo al deporte de alto rendimiento.'
      },
      entities: [
        { text: 'rodilla izquierda', type: 'anatomy', confidence: 0.98 },
        { text: 'dolor intenso', type: 'symptom', confidence: 0.95 },
        { text: 'inestabilidad', type: 'symptom', confidence: 0.92 },
        { text: 'edema', type: 'symptom', confidence: 0.89 },
        { text: 'test de Lachman', type: 'test', confidence: 0.94 },
        { text: 'cajón anterior', type: 'test', confidence: 0.91 },
        { text: 'lesión ligamentaria', type: 'diagnosis', confidence: 0.87 },
        { text: 'futbolista profesional', type: 'context', confidence: 0.96 }
      ]
    };
  }

  // Propiedades para almacenar datos del procesamiento
  private analysis?: ComplexityAnalysis;
  private context?: PromptContext;
  private vertexResponse?: any;
}

// Función principal
async function main() {
  const demo = new DemostracionCerebroClinico();
  await demo.ejecutarDemostracion();
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DemostracionCerebroClinico }; 