/**
 * Patient Data Extraction Utilities
 * Extracts structured patient information from realistic clinical transcripts
 */

export interface ExtractedPatientData {
  nombre: string;
  edad: string;
  sessionType: 'initial' | 'follow-up';
  sessionNumber?: string;
  id: string; // Generate from name for consistency
}

export function extractPatientFromTranscript(transcript: string): ExtractedPatientData | null {
  try {
    // Analyze transcript for contextual clues
    const context = analyzeTranscriptContext(transcript);
    
    // Extract or infer patient data
    const patientName = extractOrInferName(transcript, context);
    const age = extractOrInferAge(transcript, context);
    const sessionType = detectSessionType(transcript);
    
    if (!patientName || !age) {
console.log("[DEBUG] Name extracted:", patientName);
console.log("[DEBUG] Age extracted:", age);
console.log("[DEBUG] Context:", JSON.stringify(context, null, 2));      console.warn('[PatientExtractor] Could not extract sufficient patient data from transcript');
      return null;
    }
    
    // Generate consistent ID from name
    const id = patientName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    return {
      nombre: patientName,
      edad: age,
      sessionType,
      sessionNumber: extractSessionNumber(transcript),
      id
    };
    
  } catch (error) {
    console.error('[PatientExtractor] Error extracting patient data:', error);
    return null;
  }
}

function analyzeTranscriptContext(transcript: string): TranscriptContext {
  const lowerTranscript = transcript.toLowerCase();
  
  return {
    hasProgressLanguage: /(?:better|improved|getting better|much better|feeling better)/i.test(transcript),
    hasComparisonLanguage: /(?:was.*now|from.*to|used to be.*now)/i.test(transcript),
    hasFollowUpLanguage: /(?:since last|last week|last time|last session)/i.test(transcript),
    hasGenderClues: {
      female: /(?:bra|pregnant|her|she|mrs|ms)/i.test(transcript),
      male: /(?:his|he|mr|prostate)/i.test(transcript)
    },
    hasPainScale: /(?:scale.*(?:one to ten|1 to 10|out of (?:ten|10)))/i.test(transcript),
    hasInitialLanguage: /(?:first time|initial|new patient|never been here)/i.test(transcript)
  };
}

function extractOrInferName(transcript: string, context: TranscriptContext): string | null {
function extractOrInferName(transcript: string, context: TranscriptContext): string | null {
  // MVP: Simple, reliable gender-based names
  if (context.hasGenderClues.female) {
    return "Patient (Female)";
  } else if (context.hasGenderClues.male) {
    return "Patient (Male)";
  }
  return "Patient";
}  // Default to generic name if no clues
  return 'Patient';
}

function extractOrInferAge(transcript: string, context: TranscriptContext): string | null {
  // Try exact age patterns
  const agePatterns = [
    /(\d+)\s*years?\s*old/i,
    /age\s*(?:is\s*)?(\d+)/i,
    /I'm\s*(\d+)/i,
    /(\d{2})\s*year/i
  ];
  
  for (const pattern of agePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (age >= 16 && age <= 100) {
        return `${age} years`;
      }
    }
  }
  
  // Infer age range from conversation patterns
  if (/(?:retirement|retired|pension|grandchildren)/i.test(transcript)) {
    return '65+ years';
  } else if (/(?:work|job|career|kids at home)/i.test(transcript)) {
    return '25-65 years';
  } else if (/(?:college|university|student)/i.test(transcript)) {
    return '18-25 years';
  }
  
  // Default adult age if no clues
  return 'Adult';
}

function detectSessionType(transcript: string): 'initial' | 'follow-up' {
  const followUpIndicators = [
    /since last/i,
    /last week/i,
    /last time/i,
    /better than/i,
    /improved since/i,
    /was.*now/i,
    /from.*to.*\d/i, // pain scale changes
    /session\s+\d/i
  ];
  
  const initialIndicators = [
    /first time/i,
    /new patient/i,
    /never been here/i,
    /initial/i
  ];
  
  // Check for follow-up indicators first (more specific)
  for (const pattern of followUpIndicators) {
    if (pattern.test(transcript)) {
      return 'follow-up';
    }
  }
  
  // Check for initial indicators
  for (const pattern of initialIndicators) {
    if (pattern.test(transcript)) {
      return 'initial';
    }
  }
  
  // Default to initial if unclear
  return 'initial';
}

function extractSessionNumber(transcript: string): string | undefined {
  const sessionMatch = transcript.match(/session\s+(\d+)(?:\/\d+)?/i);
  return sessionMatch ? sessionMatch[1] : undefined;
}

function getCommonName(gender: 'male' | 'female'): string {
  const femaleNames = ['Sarah', 'Jennifer', 'Lisa', 'Michelle', 'Karen'];
  const maleNames = ['David', 'Michael', 'John', 'Robert', 'James'];
  
  const names = gender === 'female' ? femaleNames : maleNames;
  return names[Math.floor(Math.random() * names.length)];
}

interface TranscriptContext {
  hasProgressLanguage: boolean;
  hasComparisonLanguage: boolean;
  hasFollowUpLanguage: boolean;
  hasGenderClues: {
    female: boolean;
    male: boolean;
  };
  hasPainScale: boolean;
  hasInitialLanguage: boolean;
}

/**
 * Converts extracted patient data to PatientData format
 */
export function toPatientData(extracted: ExtractedPatientData): any {
  return {
    id: extracted.id,
    nombre: extracted.nombre,
    apellidos: '', // Not available from transcript
    fechaNacimiento: '', // Not available from transcript  
    edad: extracted.edad,
    telefono: '', // Not available from transcript
    email: '' // Not available from transcript
  };
}

