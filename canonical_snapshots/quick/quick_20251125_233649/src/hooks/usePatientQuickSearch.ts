import { useEffect, useMemo, useState } from 'react';
import { getDocs, getFirestore, limit, orderBy, query, collection, startAt, endAt } from 'firebase/firestore';

type QuickRow = { id: string; name: string; email?: string };

export function usePatientQuickSearch(term: string) {
  const [results, setResults] = useState<QuickRow[]>([]);
  const [loading, setLoading] = useState(false);

  const debounced = useMemo(() => term.trim().toLowerCase(), [term]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!debounced) { setResults([]); return; }
      setLoading(true);
      try {
        const db = getFirestore();
        const col = collection(db, 'patients');
        const q = query(
          col,
          orderBy('nameLower'),
          startAt(debounced),
          endAt(debounced + '\uf8ff'),
          limit(8)
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map(d => {
          const data = d.data() as Record<string, unknown>;
          const firstName = String(data.firstName ?? '');
          const lastName = String(data.lastName ?? '');
          const email = data.email ? String(data.email) : undefined;
          return { id: d.id, name: `${firstName} ${lastName}`.trim(), email };
        });
        if (active) setResults(rows);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [debounced]);

  return { results, loading };
}


