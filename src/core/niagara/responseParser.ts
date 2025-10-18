export function parseVertexResponse(raw: unknown): any {
  try {
    if (typeof raw === 'object' && raw !== null) return raw;
    if (typeof raw !== 'string') return {};
    try { return JSON.parse(raw); } catch {}
    const first = raw.indexOf('{');
    const last  = raw.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = raw.slice(first, last + 1);
      try { return JSON.parse(candidate); } catch {}
    }
    const matches = raw.match(/\{[\s\S]*\}/g) || [];
    for (const m of matches.sort((a,b)=>b.length-a.length)) {
      try { return JSON.parse(m); } catch {}
    }
    return {};
  } catch { return {}; }
}
