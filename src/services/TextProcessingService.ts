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
  private readonly PROCESSING_TIMEOUT = 30000; // 30 segundos

  /**
   * 🎯 MÉTODO PRINCIPAL: Procesa texto libre y lo convierte en SOAP estructurado
   */
  async processTextToSOAP(freeText: string): Promise<ProcessedTextResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧠 Iniciando procesamiento inteligente con Llama 3.2...');
      
      if (!freeText.trim()) {
        throw new Error('El texto no puede estar vacío');
      }

      // Pipeline de procesamiento inteligente
      const soapStructure = await this.generateSOAPStructure(freeText);
      const highlights = await this.extractClinicalHighlights(freeText);
      const warnings = await this.generateWarnings(freeText);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Procesamiento inteligente completado en ${processingTime}ms`);
      
      return {
        soapStructure,
        highlights,
        warnings,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Error en procesamiento:', error);
      throw this.handleProcessingError(error);
    }
  }

  /**
   * 🧠 PROMPT ENGINEERING PROFESIONAL - SOAP
   */
  private buildSOAPPrompt(text: string): string {
    return `ERES UN ASISTENTE MÉDICO EXPERTO EN FISIOTERAPIA Y REHABILITACIÓN

IDENTIDAD: Fisioterapeuta con 15+ años de experiencia clínica, especializado en dolor musculoesquelético, rehabilitación y medicina preventiva.

INSTRUCCIONES CRÍTICAS:
1. Analiza las notas clínicas siguientes con rigor profesional
2. Estructura la información en formato S.O.A.P. médico estándar
3. Realiza inferencias clínicas inteligentes basadas en evidencia
4. Calcula métricas relevantes (IMC, factores de riesgo)
5. Identifica banderas rojas y comorbilidades

NOTAS CLÍNICAS A PROCESAR:
"""
${text}
"""

FORMATO DE RESPUESTA REQUERIDO (JSON válido):
{
  "subjetivo": "SOLO información reportada directamente por el paciente: síntomas, dolor, limitaciones funcionales, historia personal relevante",
  "objetivo": "SOLO hallazgos clínicos observables: mediciones, pruebas físicas, observaciones del terapeuta, datos antropométricos con cálculos",
  "evaluacion": "Análisis profesional: diagnóstico diferencial, severidad, factores de riesgo, cálculo de IMC si hay datos, identificación de banderas rojas",
  "plan": "Plan estructurado: objetivos terapéuticos, modalidades de tratamiento, ejercicios específicos, derivaciones necesarias, seguimiento"
}

REGLAS ESPECÍFICAS:
- SUBJETIVO: Solo lo que dice/siente el paciente
- OBJETIVO: Solo lo que observas/mides como profesional
- No copies textualmente entre secciones
- Calcula IMC si tienes peso/altura
- Identifica factores de riesgo (obesidad, polifarmacia, etc.)
- Sugiere derivaciones si hay banderas rojas
- Sé específico en el plan de tratamiento`;
  }

  /**
   * 🎯 PROMPT ENGINEERING - HIGHLIGHTS CLÍNICOS
   */
  private buildHighlightsPrompt(text: string): string {
    return `ERES UN ANALISTA CLÍNICO EXPERTO EN FISIOTERAPIA

TAREA: Analiza el texto médico siguiente y extrae los highlights clínicos más importantes.

TEXTO A ANALIZAR:
"""
${text}
"""

CATEGORÍAS DE HIGHLIGHTS:
- síntoma: Síntomas reportados por el paciente
- hallazgo: Hallazgos clínicos objetivos y observaciones
- plan: Intervenciones o tratamientos mencionados
- advertencia: Banderas rojas, factores de riesgo, comorbilidades

INSTRUCCIONES:
- Extrae máximo 6 highlights más relevantes
- Prioriza información clínicamente significativa
- Asigna confidence basado en claridad del texto
- Identifica severity según impacto clínico

FORMATO DE RESPUESTA (JSON válido):
[
  {
    "type": "síntoma|hallazgo|plan|advertencia",
    "text": "Descripción específica del highlight",
    "confidence": 0.9,
    "severity": "low|medium|high"
  }
]

EJEMPLOS DE HIGHLIGHTS DE CALIDAD:
- "IMC 38.4 - Obesidad grado II" (hallazgo, high severity)
- "Dolor lumbar irradiado a glúteo" (síntoma, medium severity)
- "Polifarmacia por celiaquia" (advertencia, medium severity)`;
  }

  /**
   * 🚨 PROMPT ENGINEERING - SISTEMA DE ALERTAS
   */
  private buildWarningsPrompt(text: string): string {
    return `ERES UN SISTEMA DE ALERTA MÉDICA ESPECIALIZADO EN FISIOTERAPIA

TAREA: Analiza el texto clínico y genera advertencias importantes.

TEXTO CLÍNICO:
"""
${text}
"""

BUSCAR SEÑALES DE ALERTA:
- Banderas rojas neurológicas
- Factores de riesgo cardiovascular
- Contraindicaciones para ejercicio
- Necesidad de derivación médica urgente
- Precauciones especiales
- Comorbilidades significativas

CRITERIOS DE ADVERTENCIA:
- IMC >35 (obesidad severa)
- Polifarmacia (>5 medicamentos)
- Dolor irradiado + síntomas neurológicos
- Limitación funcional >80%
- Historia de tabaquismo + otros factores

FORMATO DE RESPUESTA (Array JSON):
["Advertencia específica 1", "Advertencia específica 2"]

Si no hay advertencias críticas, responde: []`;
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
            temperature: 0.2, // Más determinista para respuestas médicas
            top_p: 0.9,
            top_k: 40,
            repeat_penalty: 1.1
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
        throw new Error('Timeout en procesamiento');
      }
      throw error;
    }
  }

  private parseSOAPResponse(response: string): SOAPStructure {
    try {
      console.log('🔍 Respuesta SOAP recibida:', response.substring(0, 200) + '...');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON no encontrado en respuesta');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        subjetivo: parsed.subjetivo || 'No especificado',
        objetivo: parsed.objetivo || 'No especificado',
        evaluacion: parsed.evaluacion || 'No especificado',
        plan: parsed.plan || 'No especificado'
      };
      
    } catch (error) {
      console.error('Error parseando SOAP:', error);
      throw new Error('Error interpretando respuesta de IA');
    }
  }

  private parseHighlightsResponse(response: string): ClinicalHighlight[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No se encontraron highlights en la respuesta');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        console.warn('Respuesta de highlights no es un array');
        return [];
      }

      return parsed.map((item: any, index: number) => ({
        id: `ai-highlight-${Date.now()}-${index}`,
        category: this.mapHighlightType(item.type),
        text: item.text || 'Highlight sin descripción',
        confidence: this.parseConfidence(item.confidence),
        timestamp: new Date().toISOString(),
        isSelected: false,
        source: 'ai_suggestion' as const
      }));

    } catch (error) {
      console.error('Error parseando highlights:', error);
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
      console.error('Error parseando warnings:', error);
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
      return isNaN(num) ? 0.7 : Math.max(0, Math.min(1, num));
    }
    return 0.7; // Default confidence
  }

  private handleProcessingError(error: unknown): TextProcessingError {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('Timeout')) {
      return {
        message: 'El procesamiento tardó demasiado tiempo',
        code: 'TIMEOUT_ERROR'
      };
    }
    
    if (errorMessage.includes('Ollama')) {
      return {
        message: 'No se pudo conectar con Ollama. Verifica que esté ejecutándose.',
        code: 'OLLAMA_CONNECTION_ERROR'
      };
    }
    
    return {
      message: `Error: ${errorMessage}`,
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