import { callVertexAI } from './VertexAIServiceViaFirebase';
import type { 
 ClinicalAnalysisResponse, 
 SOAPNote, 
 PhysicalExamResult,
} from '../types/vertex-ai';

export class VertexAIServiceDirect {
 private static lastTranscript: string = '';
 
 static async processTranscript(transcript: string): Promise<ClinicalAnalysisResponse> {
   this.lastTranscript = transcript;
   
   const prompt = this.createStructuredPrompt(transcript);
   const rawResponse = await callVertexAI(prompt);
   
   return this.parseTextResponse(rawResponse);
 }
 
 static async generateSOAP(
   analysis: ClinicalAnalysisResponse,
   selectedEntityIds: string[],
   physicalExamResults: PhysicalExamResult[]
 ): Promise<SOAPNote> {
   const selectedEntities = analysis.entities.filter(e => selectedEntityIds.includes(e.id));
   
   const prompt = `Genera una nota SOAP de fisioterapia basada en estos hallazgos:

HALLAZGOS SELECCIONADOS:
${selectedEntities.map(e => `- ${e.text}`).join('\n')}

RESULTADOS DE EXAMEN FÍSICO:
${physicalExamResults.map(r => `- ${r.testName}: ${r.result}`).join('\n')}

Responde con este formato:
SUBJETIVO:
[información reportada por el paciente]

OBJETIVO:
[hallazgos medibles del examen]

EVALUACIÓN:
[análisis clínico]

PLAN:
[tratamiento propuesto]`;
   
   const rawResponse = await callVertexAI(prompt);
   return this.parseSOAPResponse(rawResponse);
 }
 
 private static createStructuredPrompt(transcript: string): string {
   return `Analiza esta consulta de fisioterapia y extrae toda la información clínica relevante.

TRANSCRIPCIÓN:
${transcript}

Responde siguiendo EXACTAMENTE este formato:

HALLAZGOS CLÍNICOS:
- [lista cada síntoma, condición o hallazgo importante]
- [un hallazgo por línea]

BANDERAS ROJAS:
- [condiciones que requieren derivación urgente]
- [si no hay, escribe: Ninguna identificada]

BANDERAS AMARILLAS:
- [factores psicosociales o de riesgo moderado]
- [si no hay, escribe: Ninguna identificada]

TESTS SUGERIDOS:
- [Nombre del test]: [justificación breve]
- [si no hay, escribe: Evaluación estándar de fisioterapia]

IMPORTANTE: Responde SOLO con el formato solicitado, sin texto adicional.`;
 }
 
 private static parseTextResponse(text: string): ClinicalAnalysisResponse {
   const response: ClinicalAnalysisResponse = {
     entities: [],
     redFlags: [],
     yellowFlags: [],
     physicalTests: [],
     standardizedMeasures: []
   };
   
   // Extraer hallazgos clínicos
   const hallazgosMatch = text.match(/HALLAZGOS CLÍNICOS:(.*?)(?=BANDERAS ROJAS:|$)/si);
   if (hallazgosMatch) {
     const lines = hallazgosMatch[1]
       .split('\n')
       .filter(line => line.trim().startsWith('-'));
     
     response.entities = lines.map((line, idx) => ({
       id: String(idx + 1),
       text: line.replace(/^-\s*/, '').trim(),
       type: 'symptom' as const,
       clinicalRelevance: 'medium' as const
     }));
   }
   
   // Extraer banderas rojas
   const rojasMatch = text.match(/BANDERAS ROJAS:(.*?)(?=BANDERAS AMARILLAS:|TESTS|$)/si);
   if (rojasMatch) {
     const lines = rojasMatch[1]
       .split('\n')
       .filter(line => line.trim().startsWith('-'))
       .map(line => line.replace(/^-\s*/, '').trim())
       .filter(line => !line.toLowerCase().includes('ninguna'));
     
     response.redFlags = lines.map(line => ({
       pattern: line,
       action: 'Evaluar derivación',
       urgency: 'high' as const
     }));
   }
   
   // Extraer banderas amarillas
   const amarillasMatch = text.match(/BANDERAS AMARILLAS:(.*?)(?=TESTS|$)/si);
   if (amarillasMatch) {
     const lines = amarillasMatch[1]
       .split('\n')
       .filter(line => line.trim().startsWith('-'))
       .map(line => line.replace(/^-\s*/, '').trim())
       .filter(line => !line.toLowerCase().includes('ninguna'));
     
     response.yellowFlags = lines;
   }
   
   // Extraer tests sugeridos
   const testsMatch = text.match(/TESTS SUGERIDOS:(.*?)$/si);
   if (testsMatch) {
     const lines = testsMatch[1]
       .split('\n')
       .filter(line => line.trim().startsWith('-'));
     
     response.physicalTests = lines.map(line => {
       const clean = line.replace(/^-\s*/, '').trim();
       const [name, rationale] = clean.split(':').map(s => s.trim());
       
       return {
         name: name || clean,
         rationale: rationale || 'Evaluación clínica',
         sensitivity: null,
         specificity: null
       };
     }).filter(test => !test.name.toLowerCase().includes('evaluación estándar'));
   }
   
   console.log('✅ Parseado:', {
     entities: response.entities.length,
     redFlags: response.redFlags.length,
     yellowFlags: response.yellowFlags.length,
     tests: response.physicalTests.length
   });
   
   return response;
 }
 
 private static parseSOAPResponse(text: string): SOAPNote {
   const soap: SOAPNote = {
     subjective: '',
     objective: '',
     assessment: '',
     plan: ''
   };
   
   const subjetivoMatch = text.match(/SUBJETIVO:(.*?)(?=OBJETIVO:|$)/si);
   const objetivoMatch = text.match(/OBJETIVO:(.*?)(?=EVALUACIÓN:|$)/si);
   const evaluacionMatch = text.match(/EVALUACIÓN:(.*?)(?=PLAN:|$)/si);
   const planMatch = text.match(/PLAN:(.*?)$/si);
   
   if (subjetivoMatch) soap.subjective = subjetivoMatch[1].trim();
   if (objetivoMatch) soap.objective = objetivoMatch[1].trim();
   if (evaluacionMatch) soap.assessment = evaluacionMatch[1].trim();
   if (planMatch) soap.plan = planMatch[1].trim();
   
   if (!soap.subjective && !soap.objective) {
     throw new Error('No se pudo parsear la nota SOAP');
   }
   
   return soap;
 }
}
