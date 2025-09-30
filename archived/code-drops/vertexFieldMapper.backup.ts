export function mapVertexToSpanish(vertexData: any): any {
  if (!vertexData) return null;
  
  const toArray = (item: any) => Array.isArray(item) ? item : item ? [item] : [];
  
  // Extraer medicaciones de CUALQUIER parte
  let meds = [];
  if (vertexData.medical_history_inferred) {
    meds = vertexData.medical_history_inferred.map((m: any) => 
      m.medication_inferred + ' for ' + m.condition);
  } else if (vertexData.medications_reported) {
    meds = vertexData.medications_reported.map((m: any) => m.name || m.reported_as);
  }
  
  // Extraer red flags
  const redFlags = [];
  const concerns = vertexData.concerns_and_red_flags || [];
  concerns.forEach((c: string) => {
    if (c.includes('fall')) redFlags.push('⚠️ Fall risk');
    if (c.includes('confusion')) redFlags.push('⚠️ Confusion/delirium');
    if (c.includes('depression')) redFlags.push('⚠️ Depression risk');
  });
  
  // Extraer hallazgos
  const findings = [];
  if (vertexData.physical_exam_findings) {
    Object.values(vertexData.physical_exam_findings).forEach(f => 
      findings.push(String(f)));
  }
  
  return {
    motivo_consulta: vertexData.chief_complaint?.symptom || 'Pain',
    hallazgos_clinicos: findings,
    medicacion_actual: meds,
    contexto_psicosocial: ['Age: ' + (vertexData.age || '?')],
    red_flags: redFlags,
    evaluaciones_fisicas_sugeridas: [
      { test: 'Physical assessment', objetivo: 'Evaluation' }
    ]
  };
}