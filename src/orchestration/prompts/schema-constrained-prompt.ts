// @ts-nocheck
/**
 * Schema-Constrained Clinical Analysis Prompt
 * Version: 2.0.0 - Con validación FHIR R4
 */

import ClinicalSchemaValidator from '../schemas/clinical-note-schema';

export const generateSchemaConstrainedPrompt = (transcript: string): string => {
  const schemaRequirements = ClinicalSchemaValidator.getSchemaForPrompt();
  
  return `
You are a clinical documentation expert. Analyze this physiotherapy consultation and generate a JSON response that MUST comply with our regulatory schema.

${schemaRequirements}

TRANSCRIPT TO ANALYZE:
${transcript}

CRITICAL INSTRUCTIONS:
1. ALL mandatory fields must be present or the note will be rejected
2. Include priority and autoSelect fields for each item
3. Red flags detection is MANDATORY - if none found, return empty array
4. Use the exact JSON structure below

REQUIRED JSON STRUCTURE:
{
  "required": {
    "patientId": "extracted or 'pending'",
    "practitionerId": "extracted or 'pending'",
    "sessionTimestamp": "${new Date().toISOString()}",
    "sessionType": "initial|followup|discharge",
    "chiefComplaint": "main reason for visit",
    "redFlagsAssessed": true,
    "redFlagsDetected": ["list of red flags or empty array"],
    "contraindicationsChecked": true,
    "planDocumented": true,
    "planDetails": "treatment plan",
    "followUpScheduled": true/false
  },
  "validations": {
    "painScale": {
      "required": true/false,
      "value": 0-10 or null,
      "location": "where pain is located"
    },
    "medicationVerification": {
      "medicationsListed": ["medications mentioned"],
      "contraindicationsChecked": ["contraindications checked"],
      "unprescribedDetected": true/false
    }
  },
  "entities": [
    {
      "id": "e1",
      "text": "entity text",
      "type": "symptom|medication|condition|finding",
      "priority": "critical|high|medium|low",
      "autoSelect": true/false
    }
  ],
  "physicalTests": [
    {
      "name": "test name",
      "rationale": "why relevant",
      "priority": "high|medium|low",
      "autoSelect": true/false
    }
  ],
  "metadata": {
    "schemaVersion": "1.0.0",
    "modelUsed": "vertex-ai",
    "completenessScore": 0-100
  }
}

Remember: Missing mandatory fields = rejected note = regulatory violation`;
};

export const PROMPT_VERSION = "2.0.0-schema";