// @ts-nocheck
import { addDoc, collection, getFirestore, serverTimestamp, Timestamp } from 'firebase/firestore';

export type AppointmentCreateData = {
  clinicianUid: string;
  patientId: string;
  date: Date;
  durationMin?: number;
  notes?: string;
  location?: string;
  status?: 'scheduled'|'confirmed'|'in_progress'|'completed'|'cancelled'|'no_show';
};

export async function createAppointment(input: AppointmentCreateData): Promise<string> {
  const db = getFirestore();
  const payload = {
    clinicianUid: input.clinicianUid,
    patientId: input.patientId,
    date: Timestamp.fromDate(input.date),
    durationMin: input.durationMin ?? 45,
    notes: input.notes ?? '',
    location: input.location ?? 'consulta',
    status: input.status ?? 'scheduled',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'appointments'), payload);
  return ref.id;
}