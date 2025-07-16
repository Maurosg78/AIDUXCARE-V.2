import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { patientDataSourceFirestore } from '../patientDataSourceFirestore';
import { Patient } from '../../domain/patientType';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { app } from '../../firebase/firebaseClient';

const firestore = getFirestore(app);
connectFirestoreEmulator(firestore, '127.0.0.1', 8080);

function randomString(prefix = 'test') {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
}

describe('PatientDataSourceFirestore (integración)', () => {
  beforeAll(async () => {
    // ... existing code ...
  }, 30000);
  beforeEach(async () => {
    // ... existing code ...
  }, 30000);
  afterEach(async () => {
    // ... existing code ...
  }, 30000);
  afterAll(async () => {
    // ... existing code ...
  }, 30000);

  let createdPatient: Patient;
  const professionalId = randomString('prof');
  const patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'> = {
    name: randomString('Paciente'),
    full_name: randomString('Nombre Completo'),
    age: Math.floor(Math.random() * 80) + 18,
    gender: 'male',
    email: `${randomString('mail')}@test.com`,
    phone: randomString('phone'),
    user_id: professionalId
  };

  it('debe crear un paciente', async () => {
    createdPatient = await patientDataSourceFirestore.createPatient(patientData, professionalId);
    expect(createdPatient).toBeDefined();
    expect(createdPatient.id).toBeTruthy();
    expect(createdPatient.name).toBe(patientData.name);
    expect(createdPatient.user_id).toBe(professionalId);
  }, 30000);

  it('debe obtener el paciente por ID', async () => {
    const found = await patientDataSourceFirestore.getPatientById(createdPatient.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(createdPatient.id);
    expect(found?.name).toBe(patientData.name);
  }, 30000);

  it('debe obtener el paciente por user_id', async () => {
    const found = await patientDataSourceFirestore.getPatientByUserId(professionalId);
    expect(found).toBeDefined();
    expect(found?.id).toBe(createdPatient.id);
  }, 30000);

  it('debe actualizar el paciente', async () => {
    const newName = randomString('PacienteEditado');
    const updated = await patientDataSourceFirestore.updatePatient(createdPatient.id, { name: newName });
    expect(updated).toBeDefined();
    expect(updated.name).toBe(newName);
  }, 30000);

  it('debe eliminar el paciente', async () => {
    const deleted = await patientDataSourceFirestore.deletePatient(createdPatient.id);
    expect(deleted).toBe(true);
    const found = await patientDataSourceFirestore.getPatientById(createdPatient.id);
    expect(found).toBeNull();
  }, 30000);

  it('debe retornar null si el paciente no existe', async () => {
    const found = await patientDataSourceFirestore.getPatientById('nonexistent-id');
    expect(found).toBeNull();
  }, 30000);
}); 