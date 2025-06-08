import { ClinicalHighlight } from '../types/session';

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
}

export interface TextProcessingError {
  message: string;
  code: 'OLLAMA_CONNECTION_ERROR' | 'PARSING_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT_ERROR';
  details?: unknown;
}

class TextProcessingService {
  private readonly OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
  private readonly MODEL_NAME = 'llama3.2';
  private readonly PROCESSING_TIMEOUT = 45000; // 45 segundos para análisis complejo

  /**
   * 🎯 MÉTODO PRINCIPAL: Procesa texto libre y lo convierte en SOAP estructurado
   */
  async processTextToSOAP(freeText: string): Promise<ProcessedTextResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧠 Iniciando análisis médico expert con Llama 3.2...');
      
      if (!freeText.trim()) {
        throw new Error('El texto no puede estar vacío');
      }

      // Pipeline de análisis médico expert
      const soapStructure = await this.generateSOAPStructure(freeText);
      const highlights = await this.extractClinicalHighlights(freeText);
      const warnings = await this.generateWarnings(freeText);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Análisis médico expert completado en ${processingTime}ms`);
      
      return {
        soapStructure,
        highlights,
        warnings,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Error en análisis médico:', error);
      throw this.handleProcessingError(error);
    }
  }

  /**
   * 🧠 PROMPT ENGINEERING MÉDICO EXPERT - NIVEL AIDUXCARE
   */
  private buildSOAPPrompt(text: string): string {
    return `ERES UN ASISTENTE MÉDICO EXPERTO EN FISIOTERAPIA CON ESPECIALIZACIÓN EN PREVENCIÓN DE IATROGENIA Y EXCELENCIA CLÍNICA

IDENTIDAD PROFESIONAL:
- Fisioterapeuta con 20+ años de experiencia clínica
- Especialista en dolor musculoesquelético complejo  
- Experto en identificación de banderas rojas y amarillas
- Formación en medicina legal y prevención de iatrogenia
- Certificado en evaluación de riesgo cardiovascular y metabólico

TEXTO CLÍNICO A ANALIZAR:
"""
${text}
"""

MISIÓN CRÍTICA: Realizar un análisis exhaustivo que PREVENGA problemas legales, iatrogenia y garantice excelencia clínica.

ANÁLISIS OBLIGATORIO - BANDERAS ROJAS A IDENTIFICAR:
🚩 INMEDIATAS (derivación urgente):
- Síntomas neurológicos progresivos
- Dolor nocturno intenso no mecánico  
- Pérdida de peso inexplicada
- Fiebre + dolor lumbar
- Incontinencia o retención urinaria
- Déficit neurológico bilateral

🟡 PRECAUCIONES (evaluación especializada):
- IMC >35 (riesgo cardiovascular alto)
- Polifarmacia (>5 medicamentos - interacciones)
- Antecedentes tabaquismo + obesidad + sedentarismo
- Limitación funcional >80% sin causa clara
- Rigidez matutina >60 minutos (posible inflamatorio)
- Dolor irradiado sin mejoría en 6 semanas

CÁLCULOS AUTOMÁTICOS OBLIGATORIOS:
- Si peso + altura disponible → IMC + clasificación OMS + riesgo cardiovascular
- Si edad >40 + factores de riesgo → Score cardiovascular estimado
- Si dolor crónico → Escala funcional estimada

FORMATO DE RESPUESTA REQUERIDO (JSON válido):
{
  "subjetivo": "Información reportada por el paciente, organizando síntomas por sistemas y cronología. Incluir: características del dolor, limitaciones funcionales específicas, impacto en AVD, antecedentes relevantes",
  "objetivo": "Hallazgos observables + CÁLCULOS OBLIGATORIOS. Para este caso: Peso 102kg, Altura 1.63m → IMC: 38.4 (Obesidad grado II - riesgo cardiovascular alto). Signos físicos observados, mediciones antropométricas, evaluaciones pendientes",
  "evaluacion": "ANÁLISIS EXHAUSTIVO: 1) Diagnóstico diferencial (lumbalgia mecánica vs inflamatoria vs neuropática), 2) Banderas rojas identificadas, 3) Factores de riesgo: obesidad grado II + polifarmacia + exfumadora, 4) Comorbilidades: celiaquia + enfermedades autoinmunes, 5) Nivel de discapacidad funcional estimado, 6) Riesgo de cronificación, 7) Contraindicaciones para ejercicio",
  "plan": "Plan estructurado: 1) DERIVACIONES OBLIGATORIAS: médico interno (evaluación cardiovascular pre-ejercicio debido a obesidad grado II), endocrinología (manejo peso), 2) EVALUACIONES PENDIENTES: RMN lumbar si no mejora en 4 semanas, 3) OBJETIVOS SMART: pérdida peso 10% en 6 meses, mejora funcional 50% en 8 semanas, 4) MODALIDADES SEGURAS: hidroterapia, ejercicio supervisado de baja carga, 5) PRECAUCIONES: monitoreo cardiovascular, evitar Valsalva, 6) SEGUIMIENTO: cada 2 semanas primeras 6 semanas"
}

PREGUNTAS CRÍTICAS QUE EL PROFESIONAL DEBE HACER:
Genera 4-5 preguntas específicas basadas en este caso para prevenir errores diagnósticos y problemas legales.

NIVEL DE EVIDENCIA: Especifica qué información es factual vs inferencia clínica razonable.`;
  }

  /**
   * 🎯 PROMPT ENGINEERING - HIGHLIGHTS CLÍNICOS EXPERT
   */
  private buildHighlightsPrompt(text: string): string {
    return `ERES UN ANALISTA CLÍNICO EXPERTO EN DETECCIÓN DE BANDERAS ROJAS Y FACTORES DE RIESGO

TEXTO A ANALIZAR:
"""
${text}
"""

PRIORIDADES DE DETECCIÓN:
1. BANDERAS ROJAS (alta prioridad)
2. FACTORES DE RIESGO CARDIOVASCULAR
3. COMORBILIDADES SIGNIFICATIVAS  
4. LIMITACIONES FUNCIONALES
5. CONTRAINDICACIONES PARA TRATAMIENTO

ANÁLISIS ESPECÍFICO PARA ESTE CASO:
- Calcular IMC exacto y clasificación
- Evaluar riesgo cardiovascular (obesidad + exfumadora)
- Identificar posible componente inflamatorio (rigidez matutina)
- Cuantificar limitación funcional (100% en crisis)
- Evaluar riesgo de polifarmacia

FORMATO DE RESPUESTA (JSON válido):
[
  {
    "type": "advertencia",
    "text": "IMC 38.4 - Obesidad grado II con riesgo cardiovascular alto",
    "confidence": 0.95,
    "severity": "high"
  },
  {
    "type": "advertencia", 
    "text": "Polifarmacia por múltiples patologías autoinmunes - riesgo interacciones",
    "confidence": 0.9,
    "severity": "medium"
  },
  {
    "type": "síntoma",
    "text": "Rigidez matutina prolongada - descartar componente inflamatorio",
    "confidence": 0.8,
    "severity": "medium"
  },
  {
    "type": "hallazgo",
    "text": "Limitación funcional 100% en crisis - alto impacto discapacidad",
    "confidence": 0.95,
    "severity": "high"
  },
  {
    "type": "plan",
    "text": "Evaluación cardiovascular obligatoria antes de iniciar ejercicio",
    "confidence": 0.9,
    "severity": "high"
  }
]`;
  }

  /**
   * 🚨 PROMPT ENGINEERING - SISTEMA DE ALERTAS MÉDICAS EXPERT
   */
  private buildWarningsPrompt(text: string): string {
    return `ERES UN SISTEMA DE ALERTA MÉDICA ESPECIALIZADO EN PREVENCIÓN DE IATROGENIA

TEXTO CLÍNICO:
"""
${text}
"""

CRITERIOS DE ALERTA ESPECÍFICOS:
- IMC >35 + múltiples factores de riesgo
- Dolor irradiado + limitación funcional severa  
- Polifarmacia + múltiples comorbilidades
- Exfumadora + obesidad (riesgo cardiovascular)
- Rigidez matutina prolongada (posible inflamatorio)

EVALUACIÓN DE RIESGO LEGAL:
- ¿Requiere evaluación médica antes de fisioterapia?
- ¿Hay contraindicaciones absolutas para ejercicio?
- ¿Necesita derivación especializada urgente?

FORMATO DE RESPUESTA (Array JSON):
[
  "Evaluación cardiovascular obligatoria antes de iniciar programa de ejercicios - IMC 38.4 + antecedente tabaquismo",
  "Considerar derivación a reumatología - rigidez matutina prolongada con enfermedades autoinmunes conocidas", 
  "Monitoreo estrecho por polifarmacia - posibles interacciones con antiinflamatorios",
  "Evaluación nutricional especializada urgente - obesidad grado II con múltiples comorbilidades"
]`;
  }

  private async generateSOAPStructure(text: string): Promise<SOAPStructure> {
    const prompt = this.buildSOAPPrompt(text);
    const response = await this.callOllama(prompt);
    return this.parseSOAPResponse(response);
  }

  private async extractClinicalHighlights(text: string): Promise<ClinicalHighlight[]> {
    const prompt = this.buildHighlightsPrompt(text);
    const response = await this.callOllama(prompt);
    return this.parseHighlightsResponse(response);
  }

  private async generateWarnings(text: string): Promise<string[]> {
    const prompt = this.buildWarningsPrompt(text);
    const response = await this.callOllama(prompt);
    return this.parseWarningsResponse(response);
  }

  private async callOllama(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.PROCESSING_TIMEOUT);

    try {
      const response = await fetch(this.OLLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.MODEL_NAME,
          prompt: prompt,
          stream: false,
          options: { 
            temperature: 0.1, // Muy determinista para análisis médico
            top_p: 0.9,
            top_k: 40,
            repeat_penalty: 1.1,
            num_predict: 1000 // Respuestas más largas para análisis completo
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;

    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Timeout en análisis médico');
      }
      throw error;
    }
  }

  private parseSOAPResponse(response: string): SOAPStructure {
    try {
      console.log('🔍 Respuesta médica recibida:', response.substring(0, 300) + '...');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON no encontrado en respuesta médica');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        subjetivo: parsed.subjetivo || 'Información subjetiva pendiente de completar',
        objetivo: parsed.objetivo || 'Evaluación objetiva pendiente',
        evaluacion: parsed.evaluacion || 'Análisis clínico pendiente',
        plan: parsed.plan || 'Plan terapéutico por definir'
      };
      
    } catch (error) {
      console.error('Error parseando análisis médico:', error);
      throw new Error('Error interpretando respuesta médica de IA');
    }
  }

  private parseHighlightsResponse(response: string): ClinicalHighlight[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No se encontraron highlights médicos en la respuesta');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        console.warn('Respuesta de highlights médicos no es un array');
        return [];
      }

      return parsed.map((item: any, index: number) => ({
        id: `medical-highlight-${Date.now()}-${index}`,
        category: this.mapHighlightType(item.type),
        text: item.text || 'Highlight médico sin descripción',
        confidence: this.parseConfidence(item.confidence),
        timestamp: new Date().toISOString(),
        isSelected: false,
        source: 'ai_suggestion' as const
      }));

    } catch (error) {
      console.error('Error parseando highlights médicos:', error);
      return [];
    }
  }

  private parseWarningsResponse(response: string): string[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((item: any) => 
        typeof item === 'string' && item.trim().length > 0
      );

    } catch (error) {
      console.error('Error parseando alertas médicas:', error);
      return [];
    }
  }

  private mapHighlightType(type: string): 'síntoma' | 'hallazgo' | 'plan' | 'advertencia' {
    const typeMap: Record<string, 'síntoma' | 'hallazgo' | 'plan' | 'advertencia'> = {
      'síntoma': 'síntoma',
      'sintoma': 'síntoma',
      'symptom': 'síntoma',
      'hallazgo': 'hallazgo',
      'finding': 'hallazgo',
      'plan': 'plan',
      'treatment': 'plan',
      'advertencia': 'advertencia',
      'warning': 'advertencia',
      'bandera roja': 'advertencia'
    };
    
    return typeMap[type?.toLowerCase()] || 'hallazgo';
  }

  private parseConfidence(confidence: any): number {
    if (typeof confidence === 'number') {
      return Math.max(0, Math.min(1, confidence));
    }
    if (typeof confidence === 'string') {
      const num = parseFloat(confidence);
      return isNaN(num) ? 0.8 : Math.max(0, Math.min(1, num));
    }
    return 0.8; // Default confidence para análisis médico
  }

  private handleProcessingError(error: unknown): TextProcessingError {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('Timeout')) {
      return {
        message: 'El análisis médico tardó demasiado tiempo',
        code: 'TIMEOUT_ERROR'
      };
    }
    
    if (errorMessage.includes('Ollama')) {
      return {
        message: 'No se pudo conectar con el sistema de IA médica. Verifica que Ollama esté ejecutándose.',
        code: 'OLLAMA_CONNECTION_ERROR'
      };
    }
    
    return {
      message: `Error en análisis médico: ${errorMessage}`,
      code: 'VALIDATION_ERROR'
    };
  }

  async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const textProcessingService = new TextProcessingService();
export default textProcessingService; 