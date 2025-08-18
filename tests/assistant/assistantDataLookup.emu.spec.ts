import { beforeAll, describe, expect, it } from 'vitest';
import { initTestFirebase, ensureSignedIn, seedBasicData } from '../setup/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

describe('assistantDataLookup (emulator)', () => {
  let uid: string;
  let patientId = 'p-test-001';
  beforeAll(async () => {
    initTestFirebase();
    const user = await ensureSignedIn();
    uid = user?.uid as string;
    await seedBasicData({ uid, patientId });
  });

  it('citas hoy devuelve recuento', async () => {
    const fn = httpsCallable(getFunctions(), 'assistantDataLookup');
    const res: any = await fn({ intent: 'todayAppointments', params: {}, userId: uid });
    expect(res.data.ok).toBe(true);
    expect(res.data.data.count).toBeGreaterThanOrEqual(1);
  });

  it('edad del paciente', async () => {
    const fn = httpsCallable(getFunctions(), 'assistantDataLookup');
    const res: any = await fn({ intent: 'age', params: { patientId }, userId: uid });
    expect(res.data.ok).toBe(true);
    expect(res.data.answerMarkdown).toMatch(/Edad del paciente:/);
  });
});


