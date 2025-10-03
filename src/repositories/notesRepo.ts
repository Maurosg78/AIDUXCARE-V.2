import {
  getFirestore,
  Firestore,
  Timestamp,
  serverTimestamp,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  DocumentData,
} from "firebase/firestore";
import { ClinicalNote, NoteError } from "../types/notes";

// --- utils -------------------------------------------------------------------

async function sha256Hex(input: string): Promise<string> {
  // Try Web Crypto first (browser/node >= 19), fallback to Node 'crypto'
  const enc = new TextEncoder().encode(input);
  if (typeof globalThis.crypto?.subtle?.digest === "function") {
    const buf = await globalThis.crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require("crypto") as typeof import("crypto");
    return nodeCrypto.createHash("sha256").update(Buffer.from(enc)).digest("hex");
  }
}

function stableStringifyForHash(data: Record<string, unknown>): string {
  const replacer = (_k: string, v: unknown) => {
    if (v instanceof Timestamp) return v.toMillis();
    return v;
  };
  // stable order:
  const sortKeys = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (obj && typeof obj === "object") {
      return Object.keys(obj).sort().reduce((acc: any, k) => {
        acc[k] = sortKeys((obj as any)[k]);
        return acc;
      }, {});
    }
    return obj;
  };
  return JSON.stringify(sortKeys(data), replacer);
}

function toClinicalNote(id: string, d: DocumentData): ClinicalNote {
  return {
    id,
    patientId: d.patientId,
    visitId: d.visitId,
    clinicianUid: d.clinicianUid,
    status: d.status,
    subjective: d.subjective ?? "",
    objective: d.objective ?? "",
    assessment: d.assessment ?? "",
    plan: d.plan ?? "",
    signedHash: d.signedHash,
    createdAt: d.createdAt as Timestamp,
    updatedAt: d.updatedAt as Timestamp,
  };
}

// --- Repo --------------------------------------------------------------------

export class NotesRepo {
  private db: Firestore;
  private colName = "notes";

  constructor(db?: Firestore) {
    this.db = db ?? getFirestore();
  }

  async createNote(
    data: Omit<ClinicalNote, "id" | "createdAt" | "updatedAt" | "status"> & { status?: ClinicalNote["status"] }
  ): Promise<string> {
    const status = data.status ?? "draft";
    if (!["draft", "submitted", "signed"].includes(status)) {
      throw new Error(NoteError.INVALID_STATUS);
    }
    if (status === "signed") {
      // la firma se hace con signNote()
      throw new Error(NoteError.INVALID_STATUS);
    }

    const payload: Omit<ClinicalNote, "id"> = {
      ...data,
      status,
      signedHash: undefined,
      createdAt: serverTimestamp() as unknown as Timestamp,
      updatedAt: serverTimestamp() as unknown as Timestamp,
    } as unknown as Omit<ClinicalNote, "id">;

    const ref = await addDoc(collection(this.db, this.colName), payload as any);

    // Log de auditoría (solo metadatos, nunca contenido clínico)
    // eslint-disable-next-line no-console
    console.info("notesRepo.create", {
      noteId: ref.id,
      patientId: data.patientId,
      clinicianUid: data.clinicianUid,
      status,
    });

    return ref.id;
  }

  async updateNote(id: string, updates: Partial<ClinicalNote>): Promise<void> {
    const ref = doc(this.db, this.colName, id);
    await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error(NoteError.NOT_FOUND);
      const cur = snap.data();

      if (cur.status === "signed") {
        throw new Error(NoteError.IMMUTABLE);
      }
      if (updates.status && updates.status !== "draft" && updates.status !== "submitted") {
        // no se permite pasar a 'signed' desde updateNote
        throw new Error(NoteError.INVALID_STATUS);
      }
      const payload = { ...updates } as Record<string, unknown>;
      // nunca permitir editar el hash firmado manualmente
      delete (payload as any).signedHash;
      delete (payload as any).id;
      delete (payload as any).createdAt;

      (payload as any).updatedAt = serverTimestamp();

      tx.update(ref, payload);
    });

    // eslint-disable-next-line no-console
    console.info("notesRepo.update", { noteId: id, status: updates.status });
  }

  async getNoteById(id: string): Promise<ClinicalNote | null> {
    const ref = doc(this.db, this.colName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toClinicalNote(snap.id, snap.data());
  }

  async getLastNoteByPatient(patientId: string): Promise<ClinicalNote | null> {
    // Más reciente con status submitted o signed
    const q = query(
      collection(this.db, this.colName),
      where("patientId", "==", patientId),
      where("status", "in", ["submitted", "signed"]),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const rs = await getDocs(q);
    if (rs.empty) return null;
    const d = rs.docs[0];
    return toClinicalNote(d.id, d.data());
  }

  async getLastNotes(patientId: string, count: number): Promise<ClinicalNote[]> {
    const q = query(
      collection(this.db, this.colName),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc"),
      limit(count)
    );
    const rs = await getDocs(q);
    return rs.docs.map(d => toClinicalNote(d.id, d.data()));
  }

  async signNote(id: string): Promise<void> {
    const ref = doc(this.db, this.colName, id);
    await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error(NoteError.NOT_FOUND);
      const cur = snap.data();

      if (cur.status === "signed") {
        throw new Error(NoteError.IMMUTABLE);
      }

      const toHash = stableStringifyForHash({
        ...cur,
        status: "signed",
        signedHash: undefined, // excluir campo destino
        id,
      });

      const signedHash = await sha256Hex(toHash);

      tx.update(ref, {
        status: "signed",
        signedHash,
        updatedAt: serverTimestamp(),
      });
    });

    // eslint-disable-next-line no-console
    console.info("notesRepo.sign", { noteId: id });
  }
}

// API funcional para quien no quiera instanciar
const defaultRepo = new NotesRepo();

export const createNote = defaultRepo.createNote.bind(defaultRepo);
export const updateNote = defaultRepo.updateNote.bind(defaultRepo);
export const getNoteById = defaultRepo.getNoteById.bind(defaultRepo);
export const getLastNoteByPatient = defaultRepo.getLastNoteByPatient.bind(defaultRepo);
export const getLastNotes = defaultRepo.getLastNotes.bind(defaultRepo);
export const signNote = defaultRepo.signNote.bind(defaultRepo);
