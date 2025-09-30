export function addMedicationToVisit(visitId: string, medication: any) {
  // Implementación pendiente
  return Promise.resolve('med-' + Date.now());
}

export function formatSoapFromMedication(medication: any): string {
  let soap = `**Medicación:** ${medication.name}\n`;
  if (medication.strength) soap += `**Dosis:** ${medication.strength}\n`;
  if (medication.frequency) soap += `**Frecuencia:** ${medication.frequency}\n`;
  if (medication.instructions) soap += `**Instrucciones:** ${medication.instructions}\n`;
  return soap;
}
