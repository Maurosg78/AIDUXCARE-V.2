import type { JSX } from "react";
import React, { useState } from 'react';

type AssistantEntity = { id: string; type: string; text: string };

type RunArgs = { input: string; ctx: { patientId?: string; visitId?: string } };
type RunResult =
  | { ok: true; answerMarkdown?: string; entities?: AssistantEntity[] }
  | { ok: false; error: string };

// Implementación mínima para que compile. Sustituye por tu adapter real cuando esté listo.
async function runAssistantQuery(_args: RunArgs): Promise<RunResult> {
  return { ok: true, answerMarkdown: '', entities: [] };
}

type Props = {
  patientId?: string;
  visitId?: string;
};

export default function ClinicalAssistantPanel({ patientId, visitId }: Props): JSX.Element {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [entities, setEntities] = useState<AssistantEntity[]>([]);
  const [loading, setLoading] = useState(false);

  const onAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await runAssistantQuery({ input: query, ctx: { patientId, visitId } });
    setLoading(false);

    if (res.ok) {
      setAnswer(res.answerMarkdown ?? '');
      setEntities(res.entities ?? []);
    } else {
      setAnswer(`Error: ${res.error}`);
      setEntities([]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pregunta clínica..."
          className="flex-1 border rounded px-2 py-1"
        />
        <button onClick={onAsk} className="px-3 py-1 rounded bg-black text-white" disabled={loading}>
          {loading ? 'Consultando…' : 'Preguntar'}
        </button>
      </div>

      {answer && (
        <div className="prose prose-sm">
          {/* podrías usar un renderer markdown real; aquí simple texto para compilar */}
          <pre className="whitespace-pre-wrap">{answer}</pre>
        </div>
      )}

      {entities.length > 0 && (
        <ul className="text-xs text-gray-700 list-disc pl-4">
          {entities.map((e) => (
            <li key={e.id}>{e.type}: “{e.text}”</li>
          ))}
        </ul>
      )}
    </div>
  );
}
