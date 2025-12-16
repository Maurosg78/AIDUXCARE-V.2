export function routeQuery(input: string): string {
  const query = input.toLowerCase();
  
  // Detectar intenciones basadas en keywords
  if (query.includes('edad') || query.includes('años') || query.includes('age')) {
    return 'data:age';
  }
  
  if (query.includes('resonancia') || query.includes('mri') || query.includes('rmn')) {
    return 'data:mri';
  }
  
  if (query.includes('citas') || query.includes('agenda') || query.includes('appointments')) {
    return 'data:appointments';
  }
  
  if (query.includes('notas') || query.includes('pendientes') || query.includes('notes')) {
    return 'data:notes';
  }
  
  // Por defecto, tratar como consulta de datos
  return 'data:unknown';
}

export async function lookupPatientAge(_patientId?: string): Promise<{ answerMarkdown: string }> {
  // Placeholder para lookup de edad del paciente
  return {
    answerMarkdown: `Edad del paciente: [Función en desarrollo]`
  };
}

export async function lookupLatestMRI(_patientId?: string): Promise<{ answerMarkdown: string }> {
  // Placeholder para lookup de última resonancia
  return {
    answerMarkdown: `Última resonancia: [Función en desarrollo]`
  };
}

export async function lookupPendingNotes(): Promise<{ answerMarkdown: string }> {
  // Placeholder para lookup de notas pendientes
  return {
    answerMarkdown: `Notas pendientes: [Función en desarrollo]`
  };
}

export async function lookupTodayAppointments(): Promise<{ answerMarkdown: string }> {
  // Placeholder para lookup de citas de hoy
  return {
    answerMarkdown: `Citas de hoy: [Función en desarrollo]`
  };
}
