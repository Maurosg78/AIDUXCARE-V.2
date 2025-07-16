import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, deleteDoc, Firestore } from 'firebase/firestore';
import { VisitStatus } from '../../domain/visitType';
import { VisitDataSourceFirestore } from '../visitDataSourceFirestore';
import { randomUUID } from 'crypto';
import { app } from '../../firebase/firebaseClient';

// Patrón enterprise: testea Firestore con emulador, inyectando la instancia en el data source
let firestore: Firestore;
let ds: VisitDataSourceFirestore;

function uuid() {
  return randomUUID();
}

async function cleanVisits(firestore: Firestore) {
  const snap = await getDocs(collection(firestore, 'visits'));
  for (const docu of snap.docs) {
    await deleteDoc(docu.ref);
  }
}

describe('VisitDataSourceFirestore (integración)', () => {
  beforeAll(async () => {
    firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    ds = new VisitDataSourceFirestore(firestore);
  }, 20000);

  beforeEach(async () => {
    await cleanVisits(firestore);
  }, 20000);

  afterAll(async () => {
    // Eliminar import de initializeApp si no se usa
    // await deleteApp(app);
  }, 20000);

  it('debe crear una visita y luego obtenerla por ID', async () => {
    const patientId = uuid();
    const professionalId = uuid();
    const visitData = {
      professional_id: professionalId,
      patient_id: patientId,
      date: '2024-07-15',
      status: VisitStatus.SCHEDULED,
      notes: 'test'
    };
    const createdVisit = await ds.createVisit(visitData, patientId);
    expect(createdVisit).toBeDefined();
    expect(createdVisit.id).toBeTruthy();
    expect(createdVisit.patient_id).toBe(patientId);
    expect(createdVisit.professional_id).toBe(professionalId);
    // Esperar un poco para evitar latencia del emulador
    await new Promise(r => setTimeout(r, 100));
    const found = await ds.getVisitById(createdVisit.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(createdVisit.id);
    expect(found?.patient_id).toBe(patientId);
    expect(found?.professional_id).toBe(professionalId);
  }, 20000);

  it('debe obtener todas las visitas por paciente', async () => {
    const patientId = uuid();
    const professionalId = uuid();
    const visitData = {
      professional_id: professionalId,
      patient_id: patientId,
      date: '2024-07-15',
      status: VisitStatus.SCHEDULED,
      notes: 'test'
    };
    const createdVisit = await ds.createVisit(visitData, patientId);
    await new Promise(r => setTimeout(r, 100));
    const visits = await ds.getAllVisitsByPatient(patientId);
    expect(Array.isArray(visits)).toBe(true);
    expect(visits.find(v => v.id === createdVisit.id)).toBeDefined();
  }, 20000);

  it('debe actualizar la visita', async () => {
    const patientId = uuid();
    const professionalId = uuid();
    const visitData = {
      professional_id: professionalId,
      patient_id: patientId,
      date: '2024-07-15',
      status: VisitStatus.SCHEDULED,
      notes: 'test'
    };
    const createdVisit = await ds.createVisit(visitData, patientId);
    await new Promise(r => setTimeout(r, 100));
    const updated = await ds.updateVisit(createdVisit.id, { notes: 'actualizado', status: VisitStatus.COMPLETED });
    expect(updated).toBeDefined();
    expect(updated.notes).toBe('actualizado');
    expect(updated.status).toBe(VisitStatus.COMPLETED);
  }, 20000);

  it('debe eliminar la visita', async () => {
    const patientId = uuid();
    const professionalId = uuid();
    const visitData = {
      professional_id: professionalId,
      patient_id: patientId,
      date: '2024-07-15',
      status: VisitStatus.SCHEDULED,
      notes: 'test'
    };
    const createdVisit = await ds.createVisit(visitData, patientId);
    await new Promise(r => setTimeout(r, 100));
    const deleted = await ds.deleteVisit(createdVisit.id);
    expect(deleted).toBe(true);
    const found = await ds.getVisitById(createdVisit.id);
    expect(found).toBeNull();
  }, 20000);

  it('debe retornar null si la visita no existe', async () => {
    const found = await ds.getVisitById('nonexistent-id');
    expect(found).toBeNull();
  }, 20000);
}); 