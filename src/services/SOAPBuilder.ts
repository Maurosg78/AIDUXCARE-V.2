import { ClinicalAnalysis, ClinicalHighlight } from './RealTimeClinicalAnalysis';

export interface SOAPEntry {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
  source: 'ai_analysis' | 'manual' | 'import';
  medicalPhase: string;
}

export interface SOAPDocument {
  subjective: SOAPEntry[];
  objective: SOAPEntry[];
  assessment: SOAPEntry[];
  plan: SOAPEntry[];
}

export interface ClinicalContext {
  currentPhase: string;
  sessionStartTime: number;
  patientId: string;
  sessionId: string;
}

export class SOAPBuilder {
  private soapDocument: SOAPDocument = {
    subjective: [],
    objective: [],
    assessment: [],
    plan: []
  };

  private clinicalContext: ClinicalContext = {
    currentPhase: 'anamnesis',
    sessionStartTime: Date.now(),
    patientId: '',
    sessionId: ''
  };

  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoSave();
  }

  addClinicalAnalysis(analysis: ClinicalAnalysis): void {
    analysis.highlights.forEach(highlight => {
      this.addToSOAPSection(highlight);
    });

    // Agregar insights clínicos si son relevantes
    analysis.clinicalInsights.forEach(insight => {
      if (insight.confidence > 0.7) {
        this.addInsightToSOAP(insight);
      }
    });

    // Emit SOAP update
    this.emitSOAPUpdate();
  }

  private addToSOAPSection(highlight: ClinicalHighlight): void {
    const soapEntry: SOAPEntry = {
      id: this.generateId(),
      text: highlight.text,
      timestamp: Date.now(),
      confidence: highlight.relevance,
      source: 'ai_analysis',
      medicalPhase: this.clinicalContext.currentPhase
    };

    switch (highlight.soapCategory) {
      case 'S':
        this.soapDocument.subjective.push(soapEntry);
        break;
      case 'O':
        this.soapDocument.objective.push(soapEntry);
        break;
      case 'A':
        this.soapDocument.assessment.push(soapEntry);
        break;
      case 'P':
        this.soapDocument.plan.push(soapEntry);
        break;
    }
  }

  private addInsightToSOAP(insight: any): void {
    const insightEntry: SOAPEntry = {
      id: this.generateId(),
      text: `Insight: ${insight.insight}`,
      timestamp: Date.now(),
      confidence: insight.confidence,
      source: 'ai_analysis',
      medicalPhase: this.clinicalContext.currentPhase
    };

    // Los insights van principalmente en Assessment
    this.soapDocument.assessment.push(insightEntry);
  }

  private generateId(): string {
    return `soap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitSOAPUpdate(): void {
    window.dispatchEvent(new CustomEvent('soapUpdate', {
      detail: {
        soapDocument: this.soapDocument,
        context: this.clinicalContext
      }
    }));
  }

  generateSOAPDocument(): string {
    const formatSection = (entries: SOAPEntry[], title: string): string => {
      if (entries.length === 0) return '';
      
      const formattedEntries = entries
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(entry => `- ${entry.text}`)
        .join('\n');
      
      return `## ${title}\n${formattedEntries}\n`;
    };

    const subjective = formatSection(this.soapDocument.subjective, 'SUBJETIVO (S)');
    const objective = formatSection(this.soapDocument.objective, 'OBJETIVO (O)');
    const assessment = formatSection(this.soapDocument.assessment, 'ANÁLISIS (A)');
    const plan = formatSection(this.soapDocument.plan, 'PLAN (P)');

    return `# NOTA CLÍNICA - ${new Date().toLocaleDateString()}

${subjective}${objective}${assessment}${plan}
---
*Generado automáticamente por AiDuxCare v2.0*
*Sesión iniciada: ${new Date(this.clinicalContext.sessionStartTime).toLocaleString()}*
    `;
  }

  getSOAPStats(): {
    totalEntries: number;
    subjectiveCount: number;
    objectiveCount: number;
    assessmentCount: number;
    planCount: number;
    averageConfidence: number;
  } {
    const allEntries = [
      ...this.soapDocument.subjective,
      ...this.soapDocument.objective,
      ...this.soapDocument.assessment,
      ...this.soapDocument.plan
    ];

    const totalEntries = allEntries.length;
    const averageConfidence = totalEntries > 0 
      ? allEntries.reduce((sum, entry) => sum + entry.confidence, 0) / totalEntries 
      : 0;

    return {
      totalEntries,
      subjectiveCount: this.soapDocument.subjective.length,
      objectiveCount: this.soapDocument.objective.length,
      assessmentCount: this.soapDocument.assessment.length,
      planCount: this.soapDocument.plan.length,
      averageConfidence
    };
  }

  updateClinicalContext(context: Partial<ClinicalContext>): void {
    this.clinicalContext = { ...this.clinicalContext, ...context };
  }

  private startAutoSave(): void {
    // Auto-save cada 30 segundos
    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
    }, 30000);
  }

  private saveToLocalStorage(): void {
    try {
      const soapData = {
        document: this.soapDocument,
        context: this.clinicalContext,
        timestamp: Date.now()
      };
      localStorage.setItem('aiduxcare_soap_draft', JSON.stringify(soapData));
    } catch (error) {
      console.error('Error saving SOAP to localStorage:', error);
    }
  }

  loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem('aiduxcare_soap_draft');
      if (saved) {
        const soapData = JSON.parse(saved);
        this.soapDocument = soapData.document;
        this.clinicalContext = soapData.context;
        return true;
      }
    } catch (error) {
      console.error('Error loading SOAP from localStorage:', error);
    }
    return false;
  }

  clearSOAP(): void {
    this.soapDocument = {
      subjective: [],
      objective: [],
      assessment: [],
      plan: []
    };
    this.emitSOAPUpdate();
  }

  exportSOAP(format: 'text' | 'json' | 'markdown' = 'text'): string | object {
    switch (format) {
      case 'json':
        return {
          document: this.soapDocument,
          context: this.clinicalContext,
          stats: this.getSOAPStats()
        };
      case 'markdown':
        return this.generateSOAPDocument();
      default:
        return this.generateSOAPDocument();
    }
  }

  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveToLocalStorage();
  }
} 