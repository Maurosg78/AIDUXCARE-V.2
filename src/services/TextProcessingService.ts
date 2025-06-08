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
      console.log('🤖 Iniciando procesamiento de texto con Llama 3.2...');
      
      if (!freeText.trim()) {
        throw new Error('El texto no puede estar vacío');
      }

      // Pipeline de procesamiento
      const soapStructure = await this.generateSOAPStructure(freeText);
      const highlights = await this.extractClinicalHighlights(freeText);
      const warnings = await this.generateWarnings(freeText);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Procesamiento completado en ${processingTime}ms`);
      
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

  private buildSOAPPrompt(text: string): string {
    return `Eres un asistente médico experto en fisioterapia. Estructura estas notas en formato SOAP profesional.

NOTAS CLÍNICAS:
"""
${text}
"""

Responde en JSON válido:
{
  "subjetivo": "Información del paciente...",
  "objetivo": "Observaciones clínicas...",
  "evaluacion": "Análisis profesional...",
  "plan": "Tratamiento propuesto..."
}`;
  }

  private async generateSOAPStructure(text: string): Promise<SOAPStructure> {
    const prompt = this.buildSOAPPrompt(text);
    const response = await this.callOllama(prompt);
    return this.parseSOAPResponse(response);
  }

  private async extractClinicalHighlights(text: string): Promise<ClinicalHighlight[]> {
    // Por ahora, implementación simplificada
    return [
      {
        id: `highlight-${Date.now()}`,
        category: 'hallazgo',
        text: 'Análisis generado por IA',
        confidence: 0.8,
        timestamp: new Date().toISOString(),
        isSelected: false,
        source: 'ai_suggestion'
      }
    ];
  }

  private async generateWarnings(text: string): Promise<string[]> {
    // Implementación simplificada
    return [];
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
          options: { temperature: 0.1, top_p: 0.9 }
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
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON no encontrado');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        subjetivo: parsed.subjetivo || 'No especificado',
        objetivo: parsed.objetivo || 'No especificado',
        evaluacion: parsed.evaluacion || 'No especificado',
        plan: parsed.plan || 'No especificado'
      };
      
    } catch (error) {
      throw new Error('Error parseando SOAP');
    }
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