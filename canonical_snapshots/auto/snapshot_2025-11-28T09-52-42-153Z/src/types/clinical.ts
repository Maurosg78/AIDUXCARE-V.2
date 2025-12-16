export interface Warning {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation?: string;
}

export interface Highlight {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface ClinicalMetadata {
  processingTimeMs: number;
  modelVersion?: string;
  confidence?: number;
}

export interface ClinicalAnalysis {
  success: boolean;
  metadata?: ClinicalMetadata;
  warnings?: Warning[];
  highlights?: Highlight[];
} 