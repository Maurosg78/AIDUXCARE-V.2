export const medicationCorrections: Record<string, string> = {
  'lírica': 'Lyrica (pregabalina)',
  'lirica': 'Lyrica (pregabalina)',
  'nolotil': 'Nolotil (metamizol)',
  'paracetamol': 'Paracetamol (acetaminofén)'
};

/** Corrige nombres de fármacos dentro de un string respetando límites de palabra */
export function correctMedicationText(input: string): string {
  if (!input) return input;
  let out = input;
  for (const [k, v] of Object.entries(medicationCorrections)) {
    const rx = new RegExp(`\\b${k}\\b`, 'gi');
    out = out.replace(rx, v);
  }
  return out;
}

/** Aplica corrección a una lista de frases */
export function correctMedicationList(list: string[]): string[] {
  return (list || []).map(correctMedicationText);
}
