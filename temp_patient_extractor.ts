interface ExtractedPatientData {
  nombre: string;
  edad: string;
  sessionInfo?: string;
}

function extractPatientFromTranscript(transcript: string): ExtractedPatientData | null {
  // Extract patient name
  const nameMatch = transcript.match(/Patient:\s*([^,\n]+)/i) || 
                   transcript.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
  
  // Extract age  
  const ageMatch = transcript.match(/(\d+)\s*years?\s*old/i);
  
  // Extract session info
  const sessionMatch = transcript.match(/session\s+(\d+(?:\/\d+)?)/i) ||
                      transcript.match(/follow[- ]?up/i);
  
  if (nameMatch && ageMatch) {
    return {
      nombre: nameMatch[1].trim(),
      edad: `${ageMatch[1]} years`,
      sessionInfo: sessionMatch ? sessionMatch[0] : undefined
    };
  }
  
  return null;
}
