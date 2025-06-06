export class NLPServiceOllama { 
  static async processTranscript(_text: string) { 
    return { 
      entities: [] as unknown[], 
      soapNotes: { 
        subjective: "", 
        objective: "", 
        assessment: "", 
        plan: "", 
        generated_at: new Date() 
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
  
  static async generateSOAPNotes(_text: string, _entities: unknown[]) { 
    return { 
      subjective: "", 
      objective: "", 
      assessment: "", 
      plan: "", 
      generated_at: new Date() 
    }; 
  } 
  
  static async extractClinicalEntities(_text: string) { 
    return [] as unknown[]; 
  } 
  
  static async healthCheck() { 
    return { 
      status: "ok", 
      latency_ms: 0 
    }; 
  } 
  
  static getTestingConfig() { 
    return { 
      promptVersion: "current", 
      testingMode: false 
    }; 
  } 
  
  static setPromptVersion(_version: string) {} 
  
  static setTestingMode(_mode: boolean) {} 
}
