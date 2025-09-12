export function sanityCheck(parsed: any, transcript: string): string[] {
  const t = (transcript || '').toLowerCase();
  const issues: string[] = [];
  const jsonStr = JSON.stringify(parsed).toLowerCase();

  // Verificar medicación
  const meds = ['lyrica', 'nolotil', 'paracetamol', 'ibuprofeno', 'tramadol'];
  const foundMeds = meds.filter(m => t.includes(m));
  if (foundMeds.length > 0) {
    const reportedMeds = (parsed.medicacion_actual || []).map((m: string) => m.toLowerCase());
    const missing = foundMeds.filter(m => !reportedMeds.some((rm: string) => rm.includes(m)));
    if (missing.length > 0) {
      issues.push(`Medicamentos mencionados no registrados: ${missing.join(', ')}`);
    }
  }

  // Verificar caídas
  if (/ca[ií]da|caer|cayó|caído/i.test(t) && !jsonStr.includes('caída') && !jsonStr.includes('caida')) {
    issues.push('Caídas mencionadas en transcript pero no aparecen en el análisis');
  }

  // Verificar duración temporal
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mencionaMeses = meses.some(m => t.includes(m));
  if (mencionaMeses && /\d+\s*d[ií]as?/.test(parsed.motivo_consulta || '')) {
    issues.push('Inconsistencia temporal: transcript menciona meses pero análisis dice días');
  }

  // Verificar edad
  const edadMatch = t.match(/(\d{2,3})\s*a[ñn]os/);
  if (edadMatch) {
    const edad = edadMatch[1];
    if (!jsonStr.includes(edad)) {
      issues.push(`Edad ${edad} años no reflejada en el análisis`);
    }
  }

  // Verificar red flags para ancianos con caídas
  if (edadMatch && parseInt(edadMatch[1]) > 75 && /ca[ií]da/i.test(t)) {
    if (!parsed.red_flags || parsed.red_flags.length === 0) {
      issues.push('ALERTA: Anciano con caídas debe tener red flags');
    }
  }

  return issues;
}

export default sanityCheck;
