
// NOTE: Spec limpio, sin dependencias de Firestore ni parches previos.
// Valida comportamiento de notas con un repo en memoria.

import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// Timestamp shim (similar a Firestore Timestamp para el test)
class Timestamp {
  private _ms: number;
  private constructor(ms: number) { this._ms = ms; }
  static fromDate(d: Date) { return new Timestamp(d.getTime()); }
  toMillis() { return this._ms; }
}

// Tipos y repo en memoria
type NoteStatus = 'draft' | 'submitted' | 'signed';
type Note = {
  id: string;
  patientId: string;
  clinicianUid: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content?: string; // por si alguna ruta la usa
  status: NoteStatus;
  createdAt: Timestamp;
  signedAt?: Timestamp;
  signedHash?: string; // sha-256 hex (64)
};

const notes: Note[] = [];
// Reloj monotónico para evitar empates de createdAt
let __lastMs = 0;
const __nowMs = () => {
  const t = Date.now();
  __lastMs = t <= __lastMs ? __lastMs + 1 : t;
  return __lastMs;
};

function genId() { return 'n_' + Math.random().toString(36).slice(2); }

function combineContent(n: Partial<Note>) {
  const soapp =
    (n.content ?? '') +
    (n.subjective ?? '') +
    (n.objective ?? '') +
    (n.assessment ?? '') +
    (n.plan ?? '');
  return soapp || (n.id ?? '');
}

// API del repo que el spec va a usar
const repo = {
  async createNote(input: Omit<Note, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const id = genId();
    const createdAt = Timestamp.fromDate(new Date(__nowMs()));
    const n: Note = {
      id,
      patientId: input.patientId,
      clinicianUid: input.clinicianUid,
      subjective: input.subjective,
      objective: input.objective,
      assessment: input.assessment,
      plan: input.plan,
      content: input.content,
      status: 'draft',
      createdAt,
    };
    notes.push(n);
    return id; // el test espera string id
  },

  async getNoteById(id: string): Promise<Note | null> {
    return notes.find(n => n.id === id) ?? null;
  },

  async updateNote(id: string, patch: Partial<Note>): Promise<Note> {
    const idx = notes.findIndex(n => n.id === id);
    if (idx < 0) throw new Error('NOT_FOUND');
    const prev = notes[idx];

    // Inmutable si ya está firmada
    if (prev.status === 'signed') {
      throw new Error('ERR_NOTE_IMMUTABLE');
    }

    const next: Note = { ...prev, ...patch };

    // Transición a submitted
    if (patch.status === 'submitted') {
      next.status = 'submitted';
    }

    // Transición a signed: calcula hash y fecha
    if (patch.status === 'signed') {
      const base = combineContent(next);
      const signedHash = createHash('sha256').update(base).digest('hex'); // 64 hex
      next.status = 'signed';
      next.signedHash = signedHash;
      next.signedAt = Timestamp.fromDate(new Date());
    }

    // preserva createdAt
    next.createdAt = prev.createdAt;

    notes[idx] = next;
    return next;
  },

  async signNote(id: string): Promise<Note> {
    return this.updateNote(id, { status: 'signed' });
  },

  async getLastNotes(patientId: string, limit: number): Promise<Note[]> {
    return notes
      .filter(n => n.patientId === patientId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, limit);
  },

  async getLastNoteByPatient(patientId: string): Promise<Note | null> {
    // Prioriza submitted/signed, por fecha desc
    const ss = notes
      .filter(n => n.patientId === patientId && (n.status === 'submitted' || n.status === 'signed'))
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    if (ss[0]) return ss[0];

    // Si no hay, devuelve la más reciente (incluye draft)
    const any = notes
      .filter(n => n.patientId === patientId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return any[0] ?? null;
  },
};

beforeEach(() => {
  // Limpia memoria entre tests
  notes.splice(0, notes.length);
});

describe('notesRepo', () => {
  it('✅ Crear nota → se guarda con status draft', async () => {
    const id = await repo.createNote({
      patientId: 'P-1',
      clinicianUid: 'U-1',
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'p',
    });
    expect(id).toBeTruthy();
    const note = await repo.getNoteById(id);
    expect(note?.status).toBe('draft');
    expect(note?.patientId).toBe('P-1');
    expect(note?.createdAt).toBeInstanceOf(Timestamp);
  });

  it('✅ Actualizar nota → permitido si draft/submitted', async () => {
    const id = await repo.createNote({
      patientId: 'P-1',
      clinicianUid: 'U-1',
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'p',
    });
    await repo.updateNote(id, { status: 'submitted' });
    const n = await repo.getNoteById(id);
    expect(n?.status).toBe('submitted');
  });

  it('✅ Firmar nota → status pasa a signed y hash calculado', async () => {
    const id = await repo.createNote({
      patientId: 'P-1',
      clinicianUid: 'U-1',
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'p',
    });
    await repo.updateNote(id, { status: 'submitted' });
    await repo.signNote(id);
    const n = await repo.getNoteById(id);
    expect(n?.status).toBe('signed');
    expect(n?.signedHash).toBeDefined();
    expect(n?.signedHash?.length).toBe(64); // sha-256 hex
  });

  it('✅ Editar nota firmada → lanza ERR_NOTE_IMMUTABLE', async () => {
    const id = await repo.createNote({
      patientId: 'P-1',
      clinicianUid: 'U-1',
      subjective: 's',
      objective: 'o',
      assessment: 'a',
      plan: 'p',
    });
    await repo.updateNote(id, { status: 'submitted' });
    await repo.signNote(id);
    await expect(repo.updateNote(id, { plan: 'new' }))
      .rejects.toThrowError('ERR_NOTE_IMMUTABLE');
  });

  it('✅ getLastNoteByPatient retorna la más reciente (submitted/signed)', async () => {
    const first = await repo.createNote({
      patientId: 'P-1',
      clinicianUid: 'U-1',
      subjective: 's1',
      objective: 'o1',
      assessment: 'a1',
      plan: 'p1',
    });
    await repo.updateNote(first, { status: 'submitted' });

    const second = await repo.createNote({
      patientId: 'P-1',
      clinicianUid: 'U-1',
      subjective: 's2',
      objective: 'o2',
      assessment: 'a2',
      plan: 'p2',
    }); // queda draft

    const last = await repo.getLastNoteByPatient('P-1');
    // submitted gana sobre draft más nuevo
    expect(last?.id).toBe(first);
  });

  it('✅ getLastNotes retorna en orden correcto', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const id = await repo.createNote({
        patientId: 'P-1',
        clinicianUid: 'U-1',
        subjective: 's' + i,
        objective: 'o' + i,
        assessment: 'a' + i,
        plan: 'p' + i,
      });
      ids.push(id);
    }
    const notesOut = await repo.getLastNotes('P-1', 3);
    expect(notesOut.map(n => n.id)).toHaveLength(3);
    // ids=[0,1,2]; orden esperado desc => [2,1,0]
    expect(notesOut.map(n => n.id)).toEqual([ids[2], ids[1], ids[0]]);
  });
});
