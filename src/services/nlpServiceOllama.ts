import { SOAPNotes } from '@/types/nlp';

interface ClinicalEntity {
  id: string;
  text: string;
  type: 'symptom' | 'diagnosis' | 'medication' | 'procedure' | 'vital_sign';
  confidence: number;
  start_position: number;
  end_position: number;
}

interface ProcessingMetrics {
  total_processing_time_ms: number;
  overall_confidence: number;
  requires_review: boolean;
  soap_generation_time_ms: number;
  soap_confidence: number;
}

interface ProcessTranscriptResult {
  entities: ClinicalEntity[];
  soapNotes: SOAPNotes;
  metrics: ProcessingMetrics;
}

interface HealthCheckResult {
  status: string;
  latency_ms: number;
}

interface TestingConfig {
  promptVersion: string;
  testingMode: boolean;
}

export class NLPServiceOllama {
  static async processTranscript(text: string): Promise<ProcessTranscriptResult> {
    return {
      entities: [] as ClinicalEntity[],
      soapNotes: {
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        generated_at: new Date().toISOString()
      },
      metrics: {
        total_processing_time_ms: 0,
        overall_confidence: 0,
        requires_review: false,
        soap_generation_time_ms: 0,
        soap_confidence: 0
      }
    };
  }

  static async generateSOAPNotes(text: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
    return {
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      generated_at: new Date().toISOString()
    };
  }

  static async extractClinicalEntities(text: string): Promise<ClinicalEntity[]> {
    return [] as ClinicalEntity[];
  }

  static async healthCheck(): Promise<HealthCheckResult> {
    return {
      status: "ok",
      latency_ms: 0
    };
  }

  static getTestingConfig(): TestingConfig {
    return {
      promptVersion: "current",
      testingMode: false
    };
  }

  static setPromptVersion(version: string): void {}

  static setTestingMode(mode: boolean): void {}
}
