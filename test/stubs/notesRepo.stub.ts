export const notesRepo = {
  createNote: async () => ({}),
  updateNote: async () => ({}),
};
export const NoteError = {
  NOT_FOUND: 'NOT_FOUND',
  IMMUTABLE: 'IMMUTABLE',
  INVALID_STATUS: 'INVALID_STATUS',
  UNAUTHORIZED: 'UNAUTHORIZED',
};
export default { notesRepo, NoteError };
