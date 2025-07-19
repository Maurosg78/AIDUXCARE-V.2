/**
 * 🧠 AiDuxCare - Vertex AI Service
 * Servicio principal de IA para procesamiento médico usando Google Vertex AI
 * Arquitectura: PromptFactory + ModelSelector + Vertex AI
 */

import { PromptFactory, PromptContext } from '../core/ai/PromptFactory';
import { ModelSelector, ComplexityAnalysis } from '../core/ai/ModelSelector';

export interface VertexAIResponse {
  response: string;
  tokens: number;
  duration: number;
  model: string;
}

export interface ClinicalEntity {
  text: string;
  type: 'symptom' | 'diagnosis' | 'treatment' | 'anatomy' | 'medication' | 'duration' | 'severity';
  confidence: number;
  start: number;
  end: number;
}

export interface SOAPDocument {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  timestamp: string;
  version: string;
}

export class VertexAIService {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private timeout: number;

  constructor() {
    // Manejo seguro de variables de entorno
    const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
    this.baseUrl = (env as any).VITE_VERTEX_AI_URL || 'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net';
    this.apiKey = (env as any).VITE_VERTEX_AI_API_KEY || '';
    this.model = 'gemini-1.5-pro';
    this.timeout = 30000;
  }

  /**
   * Verifica si Vertex AI está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/clinicalBrain/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Vertex AI no disponible:', error);
      return false;
    }
  }

  /**
   * Extrae entidades clínicas de texto médico
   */
  async extractClinicalEntities(text: string): Promise<ClinicalEntity[]> {
    try {
      const response = await fetch(`${this.baseUrl}/clinicalBrain/extract-entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          text,
          model: this.model,
          medical_context: true
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Vertex AI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.entities || [];
    } catch (error) {
      console.error('Error extracting clinical entities:', error);
      throw new Error(`Failed to extract entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Genera documento SOAP desde transcripción médica
   */
  async generateSOAPDocument(
    transcription: string,
    entities: ClinicalEntity[],
    medicalContext?: string
  ): Promise<SOAPDocument> {
    try {
      const response = await fetch(`${this.baseUrl}/clinicalBrain/generate-soap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          transcription,
          entities,
          medical_context: medicalContext,
          model: this.model,
          format: 'soap'
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Vertex AI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        subjective: data.subjective || '',
        objective: data.objective || '',
        assessment: data.assessment || '',
        plan: data.plan || '',
        timestamp: new Date().toISOString(),
        version: '2.0'
      };
    } catch (error) {
      console.error('Error generating SOAP document:', error);
      throw new Error(`Failed to generate SOAP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Análisis clínico completo con Vertex AI
   */
  async analyzeClinicalText(text: string): Promise<{
    entities: ClinicalEntity[];
    soap: SOAPDocument;
    confidence: number;
    warnings: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/clinicalBrain/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          text,
          model: this.model,
          include_soap: true,
          include_entities: true,
          medical_context: true
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Vertex AI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        entities: data.entities || [],
        soap: data.soap || {},
        confidence: data.confidence || 0,
        warnings: data.warnings || []
      };
    } catch (error) {
      console.error('Error in clinical analysis:', error);
      throw new Error(`Failed to analyze clinical text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    model: string;
    latency_ms?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/clinicalBrain/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          model: this.model,
          latency_ms: latency
        };
      } else {
        return {
          status: 'unhealthy',
          model: this.model,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        model: this.model,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instancia singleton
export const vertexAIService = new VertexAIService();

// Helper para verificar configuración
export const isVertexAIConfigured = (): boolean => {
  return !!(import.meta.env.VITE_VERTEX_AI_URL && import.meta.env.VITE_VERTEX_AI_API_KEY);
}; 