/**
 * 🧠 TIPOS PARA INTEGRACIÓN CON GEMINI 1.5 PRO
 * 
 * Interfaces TypeScript para la configuración y uso de Gemini 1.5 Pro
 * en el sistema de clasificación SOAP y análisis clínico.
 * 
 * TAREA 1.3: Configurar Gemini 1.5 Pro
 */

// ============================================================================
// CONFIGURACIÓN DE GEMINI
// ============================================================================

export interface GeminiConfig {
  // Configuración de autenticación
  projectId: string;
  location: string;
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash';
  
  // Configuración de generación
  generationConfig: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
    stopSequences?: string[];
  };
  
  // Configuración de seguridad
  safetySettings: Array<{
    category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
    threshold: 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_HIGH_AND_ABOVE' | 'BLOCK_NONE';
  }>;
  
  // Configuración de herramientas
  tools?: GeminiTool[];
}

export interface GeminiTool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  }>;
}

// ============================================================================
// PROMPTS MODULARES JSON
// ============================================================================

export interface SOAPClassificationPrompt {
  // Contexto del sistema
  systemContext: {
    role: 'clinical_assistant';
    specialty: 'fisioterapia' | 'psicologia' | 'general';
    version: string;
    instructions: string[];
  };
  
  // Datos de entrada
  input: {
    transcription: string;
    entities: ClinicalEntity[];
    speakerInfo: SpeakerInfo[];
    previousContext?: string;
  };
  
  // Configuración de salida
  output: {
    format: 'json';
    schema: SOAPOutputSchema;
    confidenceThreshold: number;
  };
  
  // Ejemplos de uso
  examples?: SOAPClassificationExample[];
}

export interface SOAPOutputSchema {
  type: 'object';
  properties: {
    segments: {
      type: 'array';
      items: {
        type: 'object';
        properties: {
          text: { type: 'string' };
          speaker: { type: 'string'; enum: ['PACIENTE', 'TERAPEUTA'] };
          section: { type: 'string'; enum: ['S', 'O', 'A', 'P'] };
          confidence: { type: 'number'; minimum: 0; maximum: 1 };
          reasoning: { type: 'string' };
          entities: { type: 'object' };
        };
        required: ['text', 'speaker', 'section', 'confidence', 'reasoning'];
      };
    };
    fullAssessment: { type: 'string' };
    speakerAccuracy: { type: 'number' };
    processingMetrics: {
      type: 'object';
      properties: {
        totalSegments: { type: 'number' };
        soapDistribution: { type: 'object' };
        entityCount: { type: 'number' };
        averageConfidence: { type: 'number' };
        processingTimeMs: { type: 'number' };
      };
    };
  };
  required: ['segments', 'fullAssessment', 'speakerAccuracy', 'processingMetrics'];
}

export interface SOAPClassificationExample {
  input: {
    transcription: string;
    entities: ClinicalEntity[];
  };
  output: {
    segments: Array<{
      text: string;
      speaker: 'PACIENTE' | 'TERAPEUTA';
      section: 'S' | 'O' | 'A' | 'P';
      confidence: number;
      reasoning: string;
      entities: Record<string, string[]>;
    }>;
    fullAssessment: string;
    speakerAccuracy: number;
  };
}

// ============================================================================
// ENTIDADES CLÍNICAS
// ============================================================================

export interface ClinicalEntity {
  id: string;
  text: string;
  type: EntityType;
  confidence: number;
  context?: string;
  position?: {
    start: number;
    end: number;
  };
}

export type EntityType = 
  | 'anatomy' 
  | 'symptom' 
  | 'treatment' 
  | 'diagnosis' 
  | 'procedure' 
  | 'test' 
  | 'finding' 
  | 'severity' 
  | 'temporal' 
  | 'motion' 
  | 'trigger' 
  | 'limitation' 
  | 'result' 
  | 'grade' 
  | 'reference' 
  | 'context' 
  | 'exclusion' 
  | 'range';

// ============================================================================
// INFORMACIÓN DE HABLANTES
// ============================================================================

export interface SpeakerInfo {
  speaker: 'PACIENTE' | 'TERAPEUTA';
  segments: Array<{
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  patterns: {
    vocabulary: string[];
    speechRate: number;
    formality: number;
  };
}

// ============================================================================
// RESPUESTAS DE GEMINI
// ============================================================================

export interface GeminiResponse {
  // Respuesta principal
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
        functionCall?: {
          name: string;
          args: Record<string, any>;
        };
      }>;
    };
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  
  // Metadatos de la respuesta
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  
  // Métricas de uso
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ============================================================================
// CONFIGURACIÓN DE AUDITORÍA
// ============================================================================

export interface AuditConfiguration {
  // Modo de auditoría
  auditMode: 'AUTOMATIC' | 'MANUAL' | 'HYBRID';
  
  // Configuración de logging
  logging: {
    enabled: boolean;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    includePrompts: boolean;
    includeResponses: boolean;
    includeMetrics: boolean;
  };
  
  // Configuración de fallback
  fallback: {
    enabled: boolean;
    threshold: number;
    maxRetries: number;
    fallbackMethod: 'HEURISTIC' | 'LOCAL_MODEL' | 'CACHE';
  };
  
  // Configuración de validación
  validation: {
    enabled: boolean;
    schemaValidation: boolean;
    confidenceValidation: boolean;
    contentValidation: boolean;
  };
}

// ============================================================================
// MÉTRICAS Y MONITOREO
// ============================================================================

export interface GeminiMetrics {
  // Métricas de rendimiento
  performance: {
    requestCount: number;
    successCount: number;
    errorCount: number;
    averageResponseTime: number;
    totalTokensUsed: number;
    costEstimate: number;
  };
  
  // Métricas de calidad
  quality: {
    averageConfidence: number;
    schemaValidationPassRate: number;
    contentValidationPassRate: number;
    fallbackUsageRate: number;
  };
  
  // Métricas de auditoría
  audit: {
    manualReviewCount: number;
    correctionCount: number;
    userSatisfactionScore: number;
  };
}

// ============================================================================
// CONFIGURACIONES ESPECIALIZADAS
// ============================================================================

export interface SpecialtyConfig {
  fisioterapia: {
    terminology: string[];
    assessmentPatterns: string[];
    treatmentGuidelines: string[];
    redFlags: string[];
  };
  psicologia: {
    terminology: string[];
    assessmentPatterns: string[];
    treatmentGuidelines: string[];
    redFlags: string[];
  };
  general: {
    terminology: string[];
    assessmentPatterns: string[];
    treatmentGuidelines: string[];
    redFlags: string[];
  };
}

// ============================================================================
// UTILIDADES Y HELPERS
// ============================================================================

export interface PromptTemplate {
  name: string;
  version: string;
  description: string;
  template: string;
  variables: string[];
  examples: Array<{
    variables: Record<string, any>;
    expectedOutput: any;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}
