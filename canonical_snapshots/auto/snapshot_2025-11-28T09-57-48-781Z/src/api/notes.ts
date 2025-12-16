export interface SignResponse { ok: boolean; message?: string }

export async function signNote(noteId: string): Promise<SignResponse> {
  if (!noteId) return { ok: false, message: 'Missing noteId' };
  const res = await fetch(`/notes/${encodeURIComponent(noteId)}/sign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    let msg = 'Failed to sign note';
    try {
      const data = await res.json();
      if (data?.error) msg = String(data.error);
      if (data?.message) msg = String(data.message);
    } catch {}
    return { ok: false, message: msg };
  }
  return { ok: true };
}
