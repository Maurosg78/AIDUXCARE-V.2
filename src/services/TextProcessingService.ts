import { ClinicalHighlight } from '../types/session';
import { ENV_CONFIG } from '../config/env';

// Importación dinámica de Google Cloud AI
let VertexAI: any = null;

// Cargar dinámicamente las dependencias de Google Cloud
async function loadGoogleCloudDependencies() {
  if (!VertexAI) {
    try {
      const { VertexAI: VA } = await import('@google-cloud/vertexai');
      VertexAI = VA;
    } catch (error) {
      console.error('Error cargando dependencias de Google Cloud:', error);
      throw new Error('Google Cloud AI no está disponible. Instale las dependencias necesarias.');
    }
  }
}

export interface SOAPStructure {
  subjetivo: string;
  objetivo: string;
  evaluacion: string;
  plan: string;
}

export interface ProcessedTextResult {
  soapStructure: SOAPStructure;
  highlights: ClinicalHighlight[];
  warnings: string[];
  processingTime: number;
  confidence: number;
  entitiesUsed: number;
}

export interface TextProcessingError {
  message: string;
  code: 'CONNECTION_ERROR' | 'PARSING_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT_ERROR' | 'AUTHENTICATION_ERROR';
  details?: unknown;
}

// Tipos para entidades clínicas NER
export interface ClinicalEntity {
  text: string;
  type: 'SYMPTOM' | 'MEDICATION' | 'ANATOMY' | 'CONDITION' | 'PROCEDURE' | 'TEST' | 'DOSAGE' | 'TEMPORAL' | 'SEVERITY' | 'OTHER';
  confidence: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Servicio avanzado de procesamiento de texto usando exclusivamente Google Cloud AI
 * Integración nativa con Vertex AI y Gemini-1.5-pro con prompt engineering médico
 */
class TextProcessingService {
  private vertexAI: any = null;
  private model: any = null;
  private readonly projectId: string;
  private readonly location: string;
  private readonly modelName: string;

  constructor() {
    this.projectId = ENV_CONFIG.ai.google.projectId;
    this.location = ENV_CONFIG.ai.google.location;
    this.modelName = ENV_CONFIG.ai.google.model;

    console.log(`BOT: TextProcessingService inicializado con Google Cloud AI (${this.modelName})`);
  }

  /**
   * Inicializar cliente de Google Cloud Vertex AI
   */
  private async initializeClient() {
    if (!this.vertexAI) {
      await loadGoogleCloudDependencies();
      
      // Configurar credenciales si están disponibles
      if (ENV_CONFIG.ai.google.credentials) {
        try {
          const credentials = JSON.parse(ENV_CONFIG.ai.google.credentials);
          this.vertexAI = new VertexAI({
            project: this.projectId,
            location: this.location,
            auth: {
              credentials
            }
          });
        } catch (error) {
          console.error('Error parseando credenciales de Google Cloud:', error);
          throw new Error('Credenciales de Google Cloud inválidas');
        }
      } else {
        // Usar credenciales por defecto del ambiente
        this.vertexAI = new VertexAI({
          project: this.projectId,
          location: this.location
        });
      }

      this.model = this.vertexAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.1, // Muy determinista para análisis médico
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1500 // Aumentado para respuestas más detalladas
        }
      });

      console.log(`SUCCESS: Cliente Google Cloud AI inicializado (Proyecto: ${this.projectId})`);
    }
  }

  /**
   * PROMPT AVANZADO: Integra transcripción + entidades clínicas para generar SOAP preciso
   */
  private buildAdvancedSOAPPrompt(transcription: string, clinicalEntities: ClinicalEntity[] = []): string {
    // Organizar entidades por tipo para el prompt
    const entitiesByType = this.organizeEntitiesByType(clinicalEntities);
    
    const entitiesSection = clinicalEntities.length > 0 ? `

ENTIDADES CLÍNICAS IDENTIFICADAS:
${this.formatEntitiesForPrompt(entitiesByType)}

INSTRUCCIONES PARA USO DE ENTIDADES:
- Utiliza las entidades identificadas para enriquecer cada sección SOAP
- Los SÍNTOMAS van principalmente en Subjetivo
- ANATOMÍA, HALLAZGOS y TESTS van en Objetivo  
- CONDICIONES y DIAGNÓSTICOS van en Evaluación
- MEDICAMENTOS y PROCEDIMIENTOS van en Plan
- Mantén la coherencia clínica y no inventes información` : '';

    return `Eres un asistente médico especializado en documentación clínica. Tu tarea es analizar la transcripción de una consulta médica y generar una nota SOAP (Subjetivo, Objetivo, Evaluación, Plan) estructurada y profesional.

TRANSCRIPCIÓN DE LA CONSULTA:
"""
${transcription}
"""${entitiesSection}

INSTRUCCIONES ESPECÍFICAS:
1. SUBJETIVO: Información que reporta el paciente (síntomas, molestias, historia)
2. OBJETIVO: Hallazgos del examen físico, signos vitales, observaciones del médico
3. EVALUACIÓN: Análisis clínico, diagnósticos diferenciales, impresión diagnóstica
4. PLAN: Tratamiento, medicamentos, seguimiento, recomendaciones

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "subjetivo": "Información reportada por el paciente...",
  "objetivo": "Hallazgos del examen físico...",
  "evaluacion": "Análisis clínico y diagnóstico...",
  "plan": "Plan de tratamiento y seguimiento...",
  "confidence": 0.95,
  "entitiesUsed": ${clinicalEntities.length}
}

REGLAS IMPORTANTES:
- NO agregues información que no esté en la transcripción
- NO hagas diagnósticos definitivos sin evidencia clara
- Mantén un lenguaje médico profesional pero claro
- Si una sección no tiene información suficiente, indica "Información pendiente de completar"
- El campo confidence debe reflejar tu confianza en la clasificación (0.0 a 1.0)`;
  }

  /**
   * Organizar entidades por tipo para mejor procesamiento
   */
  private organizeEntitiesByType(entities: ClinicalEntity[]): Record<string, ClinicalEntity[]> {
    return entities.reduce((acc, entity) => {
      if (!acc[entity.type]) {
        acc[entity.type] = [];
      }
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, ClinicalEntity[]>);
  }

  /**
   * Formatear entidades para el prompt
   */
  private formatEntitiesForPrompt(entitiesByType: Record<string, ClinicalEntity[]>): string {
    const typeLabels = {
      SYMPTOM: 'Síntomas',
      MEDICATION: 'Medicamentos',
      ANATOMY: 'Anatomía',
      CONDITION: 'Condiciones',
      PROCEDURE: 'Procedimientos',
      TEST: 'Exámenes',
      DOSAGE: 'Dosificaciones',
      TEMPORAL: 'Referencias temporales',
      SEVERITY: 'Severidad',
      OTHER: 'Otros'
    };

    return Object.entries(entitiesByType)
      .map(([type, entities]) => {
        const label = typeLabels[type as keyof typeof typeLabels] || type;
        const entityList = entities
          .map(e => `"${e.text}" (confianza: ${(e.confidence * 100).toFixed(0)}%)`)
          .join(', ');
        return `- ${label}: ${entityList}`;
      })
      .join('\n');
  }

  /**
   * TARGET: MÉTODO PRINCIPAL: Procesa transcripción + entidades y genera SOAP avanzado
   */
  async processTextToSOAP(
    transcription: string, 
    clinicalEntities: ClinicalEntity[] = []
  ): Promise<ProcessedTextResult> {
    const startTime = Date.now();
    try {
      if (!transcription.trim()) {
        throw new Error('La transcripción no puede estar vacía');
      }

      console.log(`RELOAD: Procesando transcripción con ${clinicalEntities.length} entidades clínicas...`);
      
      // Generar estructura SOAP avanzada
      const result = await this.generateAdvancedSOAPStructure(transcription, clinicalEntities);
      
      // Generar highlights clínicos basados en entidades
      const highlights = this.generateClinicalHighlights(clinicalEntities, transcription);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`SUCCESS: SOAP generado exitosamente en ${processingTime}ms (confianza: ${(result.confidence * 100).toFixed(1)}%)`);
      
      return {
        soapStructure: result.soapStructure,
        highlights,
        warnings: result.warnings,
        processingTime,
        confidence: result.confidence,
        entitiesUsed: result.entitiesUsed
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`ERROR: Error procesando transcripción en ${processingTime}ms:`, error);
      throw this.handleProcessingError(error);
    }
  }

  /**
   * Generar estructura SOAP avanzada usando Google Cloud AI
   */
  private async generateAdvancedSOAPStructure(
    transcription: string, 
    clinicalEntities: ClinicalEntity[]
  ): Promise<{
    soapStructure: SOAPStructure;
    confidence: number;
    entitiesUsed: number;
    warnings: string[];
  }> {
    const prompt = this.buildAdvancedSOAPPrompt(transcription, clinicalEntities);
    const response = await this.processTextWithGoogleAI(prompt);
    return this.parseAdvancedSOAPResponse(response, clinicalEntities.length);
  }

  /**
   * Procesar texto con Google Cloud AI
   */
  private async processTextWithGoogleAI(prompt: string): Promise<string> {
    await this.initializeClient();

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error en Google Cloud AI:', error);
      throw new Error(`Error en Google Cloud AI: ${(error as Error).message}`);
    }
  }

  /**
   * Parsear respuesta SOAP avanzada del modelo de IA
   */
  private parseAdvancedSOAPResponse(
    response: string, 
    expectedEntities: number
  ): {
    soapStructure: SOAPStructure;
    confidence: number;
    entitiesUsed: number;
    warnings: string[];
  } {
    try {
      console.log('🔍 Respuesta SOAP avanzada recibida:', response.substring(0, 200) + '...');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON no encontrado en respuesta SOAP');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const soapStructure: SOAPStructure = {
        subjetivo: parsed.subjetivo || 'Información subjetiva pendiente de completar',
        objetivo: parsed.objetivo || 'Evaluación objetiva pendiente',
        evaluacion: parsed.evaluacion || 'Análisis clínico pendiente',
        plan: parsed.plan || 'Plan terapéutico por definir'
      };

      const confidence = parsed.confidence || 0.5;
      const entitiesUsed = parsed.entitiesUsed || 0;
      
      // Generar advertencias basadas en calidad
      const warnings = this.generateQualityWarnings(soapStructure, confidence, entitiesUsed, expectedEntities);
      
      return {
        soapStructure,
        confidence,
        entitiesUsed,
        warnings
      };
      
    } catch (error) {
      console.error('Error parseando respuesta SOAP avanzada:', error);
      throw new Error('Error interpretando respuesta SOAP de IA');
    }
  }

  /**
   * Generar advertencias de calidad
   */
  private generateQualityWarnings(
    soap: SOAPStructure, 
    confidence: number, 
    entitiesUsed: number, 
    expectedEntities: number
  ): string[] {
    const warnings: string[] = [];

    if (confidence < 0.7) {
      warnings.push('Confianza baja en la clasificación SOAP. Revisar manualmente.');
    }

    if (entitiesUsed < expectedEntities * 0.5) {
      warnings.push('Pocas entidades clínicas utilizadas. Verificar completitud.');
    }

    if (soap.subjetivo.includes('pendiente') || soap.objetivo.includes('pendiente')) {
      warnings.push('Información incompleta en secciones críticas.');
    }

    if (soap.evaluacion.includes('pendiente') && soap.plan.includes('pendiente')) {
      warnings.push('Falta análisis clínico y plan de tratamiento.');
    }

    return warnings;
  }

  /**
   * Generar highlights clínicos basados en entidades NER
   */
  private generateClinicalHighlights(
    entities: ClinicalEntity[], 
    transcription: string
  ): ClinicalHighlight[] {
    return entities
      .filter(entity => entity.confidence > 0.6) // Solo entidades con buena confianza
      .map(entity => ({
        id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: entity.text,
        category: this.mapEntityToHighlightCategory(entity.type),
        confidence: entity.confidence,
        timestamp: new Date().toISOString(),
        isSelected: entity.confidence > 0.8, // Auto-seleccionar las de alta confianza
        source: 'ai_suggestion' as const
      }));
  }

  /**
   * Mapear tipos de entidades NER a categorías de highlights
   */
  private mapEntityToHighlightCategory(
    entityType: ClinicalEntity['type']
  ): ClinicalHighlight['category'] {
    const mapping = {
      SYMPTOM: 'síntoma' as const,
      CONDITION: 'hallazgo' as const,
      MEDICATION: 'plan' as const,
      PROCEDURE: 'plan' as const,
      TEST: 'hallazgo' as const,
      SEVERITY: 'advertencia' as const,
      ANATOMY: 'hallazgo' as const,
      DOSAGE: 'plan' as const,
      TEMPORAL: 'síntoma' as const,
      OTHER: 'hallazgo' as const
    };

    return mapping[entityType] || 'hallazgo';
  }

  /**
   * Manejo de errores específico para Google Cloud AI
   */
  private handleProcessingError(error: unknown): TextProcessingError {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('Timeout')) {
      return {
        message: 'El análisis médico tardó demasiado tiempo',
        code: 'TIMEOUT_ERROR'
      };
    }
    
    if (errorMessage.includes('Credenciales') || errorMessage.includes('Authentication') || errorMessage.includes('API key')) {
      return {
        message: 'Error de autenticación con Google Cloud AI. Verifica las credenciales.',
        code: 'AUTHENTICATION_ERROR'
      };
    }
    
    if (errorMessage.includes('Google Cloud') || errorMessage.includes('Vertex AI')) {
      return {
        message: `No se pudo conectar con Google Cloud AI. Verifica la configuración.`,
        code: 'CONNECTION_ERROR'
      };
    }
    
    return {
      message: `Error en análisis médico: ${errorMessage}`,
      code: 'VALIDATION_ERROR'
    };
  }

  /**
   * Verificar estado de salud de Google Cloud AI
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.initializeClient();
      // Hacer una llamada de prueba simple
      const testResult = await this.model.generateContent('Test de conectividad');
      return !!testResult;
    } catch (error) {
      console.error('Health check de Google Cloud AI falló:', error);
      return false;
    }
  }

  /**
   * Obtener información del servicio
   */
  public getServiceInfo(): { provider: string; model: string; project: string } {
    return {
      provider: 'Google Cloud AI',
      model: this.modelName,
      project: this.projectId
    };
  }

  /**
   * Diagnóstico: prueba la conexión con un prompt mínimo
   */
  public async testConnection(): Promise<string> {
    try {
      const response = await this.processTextWithGoogleAI('Responde solo: "Conexión exitosa con Google Cloud AI"');
      return `SUCCESS: Google Cloud AI: ${response}`;
    } catch (error) {
      return `ERROR: Google Cloud AI: ${(error as Error).message}`;
    }
  }

  /**
   * Validar configuración de Google Cloud
   */
  public validateConfiguration(): { isValid: boolean; missingConfig: string[] } {
    const missing = [];
    
    if (!this.projectId) missing.push('GOOGLE_CLOUD_PROJECT_ID');
    if (!this.location) missing.push('GOOGLE_CLOUD_LOCATION');
    if (!this.modelName) missing.push('GOOGLE_CLOUD_MODEL');
    if (!ENV_CONFIG.ai.google.credentials) missing.push('GOOGLE_CLOUD_CREDENTIALS');

    return {
      isValid: missing.length === 0,
      missingConfig: missing
    };
  }

  /**
   * 🧪 MÉTODO DE PRUEBA: Procesa texto simple para testing
   */
  public async processSimpleText(text: string): Promise<ProcessedTextResult> {
    return this.processTextToSOAP(text, []);
  }
}

export const textProcessingService = new TextProcessingService();