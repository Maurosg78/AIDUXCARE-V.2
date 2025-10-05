export type NoteStatus = 'draft' | 'final' | 'archived' | 'signed';
export type Note = {
  id?: string;
  content?: string;
  patientId?: string;
  visitId?: string;
  clinicianUid?: string;
  status?: NoteStatus;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  updatedAt?: string;
  createdAt?: string;
};

export class NoteError extends Error {
  static readonly IMMUTABLE = 'IMMUTABLE';
  static readonly INVALID_STATUS = 'INVALID_STATUS';
  static readonly UNAUTHORIZED = 'UNAUTHORIZED';
  code: string;
  details?: Record<string, unknown>;
  constructor(message:string, code:string, details?:Record<string,unknown>) {
    super(message); this.name='NoteError'; this.code=code; this.details=details;
  }
}

export class NotesRepo {
  async getLastNotes(patientId: string, limit: number) {
    // @ts-ignore
    const arr = Array.isArray(this._items) ? this._items : [];
    const valid = new Set(['submitted','signed']);
    return arr
      .filter((n: any) => n.patientId === patientId && valid.has(n.status))
      .sort((a: any, b: any) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, limit);
  }
  async getNoteById(id: string) {
    // @ts-ignore
    const arr = Array.isArray(this._items) ? this._items : [];
    return arr.find((n: any) => n.id === id) ?? null;
  }
  private _items: Note[] = [];
  async save(n: Note): Promise<void> {
    const i = this._items.findIndex(x=>x.id===n.id);
    if (i>=0) this._items[i] = { ...this._items[i], ...n, updatedAt:new Date().toISOString() };
    else this._items.push({ ...n, createdAt:new Date().toISOString() });
  }
  async list(): Promise<Note[]> { return [...this._items]; }
  async createNote(n: Omit<Note,'updatedAt'|'createdAt'>): Promise<Note> {
    if (n.status==='final') throw new NoteError('Nota inmutable', NoteError.IMMUTABLE);
    const note = { ...n, createdAt:new Date().toISOString() };
    this._items.push(note);
    return note;
  }
  async updateNote(id:string, patch: Partial<Note>): Promise<Note> {
      // @ts-ignore
      const arr = Array.isArray(this._items) ? this._items : [];
      const idx = arr.findIndex((x:any)=>x.id===id);
      if (idx < 0) { throw new NoteError('No encontrada', NoteError.INVALID_STATUS); }
      const prev = arr[idx];
      if (prev.status === 'signed') { throw new NoteError('Nota inmutable', NoteError.IMMUTABLE); }

      let next = { ...prev, ...patch };

      // Si vamos a firmar, bloquear más cambios y setear hash + signedAt
      if (patch && patch.status === 'signed') {
        const base = typeof next.content === 'string' ? next.content : String(next.id ?? '');
        // hash simple determinístico (no dependemos de crypto node para no romper bundling)
        const simpleHash = 'h' + Buffer.from(base).toString('hex').slice(0, 16);
        next = { ...next, status: 'signed', signedHash: next.signedHash ?? simpleHash, signedAt: new Date().toISOString() };
      }

      // actualizar createdAt sólo si no existía
      if (!next.createdAt) next.createdAt = prev.createdAt ?? new Date().toISOString();

      // persistir
      arr[idx] = next;
      // @ts-ignore
      this._items = arr;
      return next;
  }
  async getLastNoteByPatient(patientId:string): Promise<Note|null> {
    const list = this._items
      .filter(n=>n.patientId===patientId)
      .sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)));
    return list[0] ?? null;
  }
}
export const notesRepo = new NotesRepo();
export default NotesRepo;
