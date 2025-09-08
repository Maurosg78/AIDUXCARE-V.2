type PatientLite = { nombre: string; apellidos: string };
export async function downloadSOAPReport(patient: PatientLite, soapText: string) {
  const blob = new Blob([soapText ?? ''], { type: 'text/plain;charset=utf-8' });
  const fileName = `SOAP_${patient.apellidos || 'Paciente'}_${patient.nombre || ''}.txt`.replace(/\s+/g,'_');
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
}
export default { downloadSOAPReport };
