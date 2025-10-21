import { 
  SOAPGenerationRequest, 
  EditableSOAPNote, 
  PhysicalTestResult,
  ClinicalEntity,
  SubjectiveSection,
  ObjectiveSection,
  AssessmentSection,
  PlanSection,
  SOAPMetadata
} from '../types/soap';
import { callVertexAI } from './vertex-ai-adapter';

export class ProfessionalSOAPGenerator {
  static async generateWithVertex(request: SOAPGenerationRequest): Promise<EditableSOAPNote> {
    const prompt = this.buildSOAPPrompt(request);
    
    try {
      const response = await callVertexAI(prompt);
      console.log("[DocGen] Raw response to parse:", response);
      return this.parseVertexResponse(response, request);
    } catch (error) {
      console.error('[DocGen Generator] Vertex AI error:', error);
      return this.generateFallbackSOAP(request);
    }
  }
  private static buildSOAPPrompt(request: SOAPGenerationRequest): string {
    const { analysisResults, physicalTestResults, patientData, selectedItems, sessionContext } = request;
    
    const symptoms = analysisResults.entities
      .filter((e: ClinicalEntity) => e.type === 'symptom')
      .map((s: ClinicalEntity) => s.name);
    
    const medications = analysisResults.entities
      .filter((e: ClinicalEntity) => e.type === 'medication')
      .map((m: ClinicalEntity) => m.name);

    const positiveTests = physicalTestResults
      .filter((t: PhysicalTestResult) => t.result === 'positive')
      .map((t: PhysicalTestResult) => ({
        name: t.name,
        values: t.values,
        interpretation: t.interpretation
      }));

    return `You are a licensed physiotherapist creating a medical-legal SOAP note.

PATIENT INFORMATION:
- Name: ${patientData.nombre}
- Age: ${patientData.edad} years
- Previous Diagnosis: ${patientData.diagnosticoPrevio || 'None documented'}
- Session Type: ${sessionContext.sessionType}
- Session Duration: ${sessionContext.duration} minutes

CLINICAL FINDINGS:
Symptoms: ${symptoms.join(', ') || 'None reported'}
Current Medications: ${medications.join(', ') || 'None reported'}
Red Flags: ${analysisResults.redFlags.join(', ') || 'None identified'}
Yellow Flags: ${analysisResults.yellowFlags.join(', ') || 'None identified'}

PHYSICAL EVALUATION:
${physicalTestResults.map((test: PhysicalTestResult) => 
  `- ${test.name}: ${test.result.toUpperCase()}${test.values ? ` (${JSON.stringify(test.values)})` : ''}`
).join('\\n')}

CLINICAL REASONING:
${analysisResults.clinicalReasoning}

Generate a CONCISE SOAP note in JSON format (maximum 2000 characters total).
The note must be professional, specific, and defensible in a legal context.
Use the same language as the patient information (Spanish if Spanish names/text, English otherwise).

Required JSON structure with specific medical content:
{
  "subjective": {
    "chiefComplaint": "specific reason for today's visit",
    "symptoms": ["detailed symptom descriptions with onset, duration, aggravating/relieving factors"],
    "medications": ["medication name, dose, frequency"],
    "painScale": 0-10 if applicable,
    "functionalLimitations": ["specific functional impairments"],
    "patientGoals": "what the patient hopes to achieve"
  },
  "objective": {
    "physicalExamFindings": ["observable, measurable findings"],
    "testResults": [
      {
        "name": "test name",
        "result": "specific result",
        "interpretation": "clinical significance"
      }
    ],
    "observations": ["posture, gait, compensations observed"],
    "measurements": {"ROM": "degrees", "strength": "grade", etc}
  },
  "assessment": {
    "primaryDiagnosis": ["ICD-10 compatible diagnoses"],
    "differentialDiagnosis": ["alternative considerations"],
    "clinicalImpression": "synthesis of findings",
    "prognosis": "expected recovery timeline and factors",
    "contraindications": ["treatments to avoid and why"]
  },
  "plan": {
    "interventions": [
      {
        "type": "manual|exercise|modality|education",
        "description": "specific technique/exercise",
        "frequency": "times per week",
        "duration": "minutes or weeks"
      }
    ],
    "shortTermGoals": ["SMART goals for 2-4 weeks"],
    "longTermGoals": ["SMART goals for 6-12 weeks"],
    "followUpDate": "recommended next appointment",
    "homeProgramProvided": true/false
  }
}`;
  }

  private static parseVertexResponse(response: any, request: SOAPGenerationRequest
  ): EditableSOAPNote {
    try {
      const parsed = (() => {
        try {
          if (typeof response === "string") {
            return JSON.parse(response);
          } else if (response.text) {
            return JSON.parse(response.text);
          } else {
            return response;
          }
        } catch (error) {
          console.error("[DocGen Parser] JSON truncated, using fallback");
          throw new Error("JSON_TRUNCATED");
        }
      })();
      const now = new Date();
    const sessionId = this.generateSessionId();      
      const subjective: SubjectiveSection = {
        content: this.formatSubjectiveNarrative(parsed.subjective),
        editable: true,
        validated: false,
        chiefComplaint: parsed.subjective.chiefComplaint || '',
        symptoms: parsed.subjective.symptoms || [],
        medications: parsed.subjective.medications || [],
        painScale: parsed.subjective.painScale,
        functionalLimitations: parsed.subjective.functionalLimitations || [],
        patientGoals: parsed.subjective.patientGoals || ''
      };

      const objective: ObjectiveSection = {
        content: this.formatObjectiveNarrative(parsed.objective),
        editable: true,
        validated: false,
        physicalExamFindings: parsed.objective.physicalExamFindings || [],
        testResults: request.physicalTestResults,
        observations: parsed.objective.observations || [],
        measurements: parsed.objective.measurements || {}
      };

      const assessment: AssessmentSection = {
        content: this.formatAssessmentNarrative(parsed.assessment),
        editable: true,
        validated: false,
        primaryDiagnosis: parsed.assessment.primaryDiagnosis || [],
        differentialDiagnosis: parsed.assessment.differentialDiagnosis || [],
        clinicalImpression: parsed.assessment.clinicalImpression || '',
        prognosis: parsed.assessment.prognosis || '',
        contraindications: parsed.assessment.contraindications || []
      };

      const plan: PlanSection = {
        content: this.formatPlanNarrative(parsed.plan),
        editable: true,
        validated: false,
        interventions: parsed.plan.interventions || [],
        shortTermGoals: parsed.plan.shortTermGoals || [],
        longTermGoals: parsed.plan.longTermGoals || [],
        followUpDate: parsed.plan.followUpDate ? new Date(parsed.plan.followUpDate) : undefined,
        homeProgramProvided: parsed.plan.homeProgramProvided || false
      };

      const metadata: SOAPMetadata = {
        sessionId: sessionId,
        patientId: request.patientData.id,
        professionalId: 'current-professional-id', // TODO: Get from auth
        professionalName: 'Dr. Professional Name', // TODO: Get from auth
        generatedAt: now.toISOString(),
        lastModified: now.toISOString(),
        status: 'draft',
        supervisionRequired: false
      };

      return { subjective, objective, assessment, plan, metadata };
    } catch (error) {
      console.error('[DocGen Parser] Parse error:', error);
      return this.generateFallbackSOAP(request);
    }
  }

  private static formatSubjectiveNarrative(data: any): string {
    const parts: string[] = [];
    if (data.chiefComplaint) parts.push(`CC: ${data.chiefComplaint}`);
    if (data.painScale !== undefined) parts.push(`Pain: ${data.painScale}/10`);
    if (data.symptoms?.length) parts.push(`Symptoms: ${data.symptoms.join('; ')}`);
    if (data.functionalLimitations?.length) parts.push(`Functional limitations: ${data.functionalLimitations.join('; ')}`);
    if (data.patientGoals) parts.push(`Goals: ${data.patientGoals}`);
    return parts.join('\\n') || 'See structured data';
  }

  private static formatObjectiveNarrative(data: any): string {
    const parts: string[] = [];
    if (data.physicalExamFindings?.length) {
      parts.push(`Examination: ${data.physicalExamFindings.join('; ')}`);
    }
    if (data.observations?.length) {
      parts.push(`Observations: ${data.observations.join('; ')}`);
    }
    return parts.join('\\n') || 'See structured data';
  }

  private static formatAssessmentNarrative(data: any): string {
    const parts: string[] = [];
    if (data.primaryDiagnosis?.length) {
      parts.push(`Diagnosis: ${data.primaryDiagnosis.join('; ')}`);
    }
    if (data.clinicalImpression) {
      parts.push(`Clinical impression: ${data.clinicalImpression}`);
    }
    if (data.prognosis) {
      parts.push(`Prognosis: ${data.prognosis}`);
    }
    return parts.join('\\n') || 'See structured data';
  }

  private static formatPlanNarrative(data: any): string {
    const parts: string[] = [];
    if (data.interventions?.length) {
      const interventionList = data.interventions.map((i: any) => 
        `${i.type}: ${i.description} (${i.frequency}, ${i.duration})`
      );
      parts.push(`Treatment: ${interventionList.join('; ')}`);
    }
    if (data.followUpDate) {
      parts.push(`Follow-up: ${data.followUpDate}`);
    }
    return parts.join('\\n') || 'See structured data';
  }

  private static generateFallbackSOAP(request: SOAPGenerationRequest): EditableSOAPNote {
    // Implementación del fallback con estructura completa pero datos mínimos
    const now = new Date();
    const sessionId = this.generateSessionId();    
    return {
      subjective: {
        content: 'Patient data collected. Pending professional review.',
        editable: true,
        validated: false,
        chiefComplaint: '',
        symptoms: [],
        medications: [],
        functionalLimitations: [],
        patientGoals: ''
      },
      objective: {
        content: 'Physical evaluation completed. See test results.',
        editable: true,
        validated: false,
        physicalExamFindings: [],
        testResults: request.physicalTestResults,
        observations: [],
        measurements: {}
      },
      assessment: {
        content: 'Clinical assessment pending.',
        editable: true,
        validated: false,
        primaryDiagnosis: [],
        differentialDiagnosis: [],
        clinicalImpression: '',
        prognosis: '',
        contraindications: []
      },
      plan: {
        content: 'Treatment plan to be determined.',
        editable: true,
        validated: false,
        interventions: [],
        shortTermGoals: [],
        longTermGoals: [],
        homeProgramProvided: false
      },
      metadata: {
        sessionId: sessionId,
        patientId: request.patientData.id,
        professionalId: 'pending',
        professionalName: 'Pending',
        generatedAt: now.toISOString(),
        lastModified: now.toISOString(),
        status: 'draft',
        supervisionRequired: true
      }
    };
  }

  private static generateSessionId(): string {
    return `SOAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private static generateDataHash(data: any): string {
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
