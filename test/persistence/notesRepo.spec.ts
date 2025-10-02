import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'node:fs';

// SDK app + emuladores (mismo app que usa el repo)
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, setDoc, doc } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';

import { createNote, getNoteById, getLastNoteByPatient, getLastNotes, updateNote } from '@/repositories/notesRepo';
import { NoteError } from '@/types/notes';

let testEnv: RulesTestEnvironment;
let CLIN_UID = 'clinician-test';

describe('notesRepo (CRUD + guards)', () => {
  beforeAll(async () => {
    const rules = fs.readFileSync('firestore.rules', 'utf8');

    // Carga reglas en el emulador
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-notesrepo',
      firestore: { rules, host: '127.0.0.1', port: 8080 },
    });

    // Inicializa la app por defecto (usada por el repo)
    if (!getApps().length) {
      initializeApp({ projectId: 'demo-notesrepo', apiKey: 'fake-api-key', authDomain: 'demo-notesrepo.firebaseapp.com' });
    }

    // Conecta emuladores
    const db = getFirestore();
    connectFirestoreEmulator(db, '127.0.0.1', 8080);

    const auth = getAuth();
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');

    // Autenticación anónima para poblar request.auth
    await signInAnonymously(auth);
    CLIN_UID = auth.currentUser?.uid || CLIN_UID;
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('create/get works (draft)', async () => {
    const note = await createNote({
      id: '', // ignorado por create
      patientId: 'p1',
      visitId: 'v1',
      clinicianUid: CLIN_UID,
      status: 'draft',
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'p',
    });
    expect(note.id).toBeTruthy();

    const fetched = await getNoteById(note.id);
    expect(fetched.patientId).toBe('p1');
    expect(fetched.status).toBe('draft');
    expect(fetched.clinicianUid).toBe(CLIN_UID);
  });

  it('getLastNote(s) honors index pattern', async () => {
    const now = Date.now();
    const db = getFirestore();

    await setDoc(doc(db, 'notes', 'n1'), {
      patientId: 'p2',
      clinicianUid: CLIN_UID,
      status: 'submitted',
      subjective: 's1', objective: 'o1', assessment: 'a1', plan: 'p1',
      createdAt: new Date(now - 1000), updatedAt: new Date(now - 1000),
    });

    await setDoc(doc(db, 'notes', 'n2'), {
      patientId: 'p2',
      clinicianUid: CLIN_UID,
      status: 'submitted',
      subjective: 's2', objective: 'o2', assessment: 'a2', plan: 'p2',
      createdAt: new Date(now), updatedAt: new Date(now),
    });

    const last = await getLastNoteByPatient('p2');
    expect(last?.subjective).toBe('s2');

    const many = await getLastNotes('p2', 2);
    expect(many.length).toBe(2);
    expect(many[0].subjective).toBe('s2');
    expect(many[1].subjective).toBe('s1');
  });

  it('update to signed cannot modify SOAP in same op', async () => {
    const note = await createNote({
      id: '',
      patientId: 'p3',
      clinicianUid: CLIN_UID,
      status: 'submitted',
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'p',
    });

    await expect(
      updateNote(note.id, { status: 'signed', subjective: 'changed' })
    ).rejects.toThrow(NoteError.IMMUTABLE);

    const signed = await updateNote(note.id, { status: 'signed', signedHash: '0xabc' });
    expect(signed.status).toBe('signed');
  });

  it('signed notes are immutable afterwards', async () => {
    const note = await createNote({
      id: '',
      patientId: 'p4',
      clinicianUid: CLIN_UID,
      status: 'submitted',
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'p',
    });

    await updateNote(note.id, { status: 'signed', signedHash: '0xdead' });

    await expect(
      updateNote(note.id, { objective: 'new' })
    ).rejects.toThrow(NoteError.IMMUTABLE);
  });
});
