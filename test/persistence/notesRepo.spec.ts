import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getApp } from 'firebase/app';
import { initializeApp, deleteApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

import {
  NotesRepo,
} from "../../src/repositories/notesRepo";
import { NoteError } from "../../src/types/notes";

let app: FirebaseApp;
let repo: NotesRepo;

const HOST = process.env.FIRESTORE_EMULATOR_HOST?.split(":")[0] ?? "127.0.0.1";
const PORT = Number(process.env.FIRESTORE_EMULATOR_HOST?.split(":")[1] ?? 8080);

beforeAll(async () => {
  try { app = getApp(); } catch { app = initializeApp({ projectId: `notes-test-${Date.now()}` }); }
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, PORT);
  repo = new NotesRepo(db);
});

afterAll(async () => {
  if (app) await deleteApp(app);
});

beforeEach(async () => {
  // limpia coleccion 'notes' del paciente de prueba
  const db = getFirestore(app);
  const snap = await getDocs(query(collection(db, "notes"), where("patientId", "==", "P-1")));
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "notes", d.id))));
});

describe("notesRepo", () => {
  it("✅ Crear nota → se guarda con status draft", async () => {
    const id = await repo.createNote({
      patientId: "P-1",
      clinicianUid: "U-1",
      subjective: "s",
      objective: "o",
      assessment: "a",
      plan: "p",
    });
    expect(id).toBeTruthy();

    const note = await repo.getNoteById(id);
    expect(note?.status).toBe("draft");
    expect(note?.patientId).toBe("P-1");
    expect(note?.createdAt).toBeInstanceOf(Timestamp);
  });

  it("✅ Actualizar nota → permitido si draft/submitted", async () => {
    const id = await repo.createNote({
      patientId: "P-1",
      clinicianUid: "U-1",
      subjective: "s",
      objective: "o",
      assessment: "a",
      plan: "p",
    });
    await repo.updateNote(id, { status: "submitted" });
    const n = await repo.getNoteById(id);
    expect(n?.status).toBe("submitted");
  });

  it("✅ Firmar nota → status pasa a signed y hash calculado", async () => {
    const id = await repo.createNote({
      patientId: "P-1",
      clinicianUid: "U-1",
      subjective: "s",
      objective: "o",
      assessment: "a",
      plan: "p",
    });
    await repo.updateNote(id, { status: "submitted" });
    await repo.signNote(id);

    const n = await repo.getNoteById(id);
    expect(n?.status).toBe("signed");
    expect(n?.signedHash).toBeDefined();
    expect(n?.signedHash?.length).toBe(64); // sha-256 hex
  });

  it("✅ Editar nota firmada → lanza ERR_NOTE_IMMUTABLE", async () => {
    const id = await repo.createNote({
      patientId: "P-1",
      clinicianUid: "U-1",
      subjective: "s",
      objective: "o",
      assessment: "a",
      plan: "p",
    });
    await repo.updateNote(id, { status: "submitted" });
    await repo.signNote(id);

    await expect(repo.updateNote(id, { plan: "new" })).rejects.toThrowError(NoteError.IMMUTABLE);
  });

  it("✅ getLastNoteByPatient retorna la más reciente (submitted/signed)", async () => {
    const first = await repo.createNote({
      patientId: "P-1",
      clinicianUid: "U-1",
      subjective: "s1",
      objective: "o1",
      assessment: "a1",
      plan: "p1",
    });
    await repo.updateNote(first, { status: "submitted" });

    const second = await repo.createNote({
      patientId: "P-1",
      clinicianUid: "U-1",
      subjective: "s2",
      objective: "o2",
      assessment: "a2",
      plan: "p2",
    });
    // queda en draft

    const last = await repo.getLastNoteByPatient("P-1");
    expect(last?.id).toBe(first); // submitted gana sobre draft más nuevo
  });

  it("✅ getLastNotes retorna en orden correcto", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const id = await repo.createNote({
        patientId: "P-1",
        clinicianUid: "U-1",
        subjective: "s" + i,
        objective: "o" + i,
        assessment: "a" + i,
        plan: "p" + i,
      });
      ids.push(id);
    }
    const notes = await repo.getLastNotes("P-1", 3);
    expect(notes.map(n => n.id)).toHaveLength(3);
    // creado más reciente primero
    expect(ids).toHaveLength(3);
    // ids: [0,1,2]; orden esperado desc -> [2,1,0]
    expect(notes.map(n => n.id)).toEqual([ids[2], ids[1], ids[0]]);
  });
});
