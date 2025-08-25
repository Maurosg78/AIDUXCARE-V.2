import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';

import { MedicationEntity } from '../assistant/entities';

export async function addMedicationToVisit(encounterId: string, med: MedicationEntity): Promise<string> {
  const db = getFirestore();
  const ref = collection(db, 'encounters', encounterId, 'medications');
  const docRef = await addDoc(ref, {
    name: med.name,
    strength: med.strength ?? null,
    route: med.route ?? null,
    dose: med.dose ?? null,
    frequency: med.frequency ?? null,
    durationDays: med.durationDays ?? null,
    startDate: med.startDate ?? null,
    endDate: med.endDate ?? null,
    notes: med.notes ?? null,
    coding: med.coding ?? [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function formatSoapFromMedication(med: MedicationEntity): string {
  const parts: string[] = [];
  
  // Agregar nombre del medicamento
  parts.push(`**Medicación:** ${med.name}`);
  
  // Agregar dosis si existe
  if (med.strength) {
    parts.push(`**Dosis:** ${med.strength}`);
  }
  
  // Agregar frecuencia si existe
  if (med.frequency) {
    parts.push(`**Frecuencia:** ${med.frequency}`);
  }
  
  // Agregar duración si existe
  if (med.durationDays) {
    parts.push(`**Duración:** ${med.durationDays} días`);
  }
  
  // Agregar instrucciones si existen
  if (med.notes) {
    parts.push(`**Instrucciones:** ${med.notes}`);
  }
  
  return parts.join('\n');
}


