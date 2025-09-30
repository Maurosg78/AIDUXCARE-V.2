import React, { useMemo, useState } from 'react';
import SOAPNotePreview from '@/components/visits/SOAPNotePreview';
import type { ChecklistSignal } from '@/core/notes/SOAPBuilder';

/**
 * Market: CA
 * Language: en-CA
 *
 * VisitNotePage — minimal beta to wire transcript → SOAP preview.
 * No new deps. Local parsing rules only; replace with real pipeline later.
 */

function toChecklist(transcript: string): ChecklistSignal[] {
  const lines = (transcript || '')
    .split(/\n+|(?<=\.)\s+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ChecklistSignal[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/(cc:|chief complaint|motivo|pain|dolor|stiff|rigidez|hip|espalda)/.test(lower)) {
      items.push({ speaker: 'patient', text: line, tag: 'symptom' });
      continue;
    }
    if (/(exam|examen|inspection|observ|rom|gait|palpation|test|prueba)/.test(lower)) {
      items.push({ speaker: 'clinician', text: line, tag: 'finding' });
      continue;
    }
    if (/(dx:|diagnosis|diagnóstico|icd)/.test(lower)) {
      items.push({ speaker: 'clinician', text: line, tag: 'diagnosis' });
      continue;
    }
    if (/(plan:|we will|se indica|home program|follow up|derivar)/.test(lower)) {
      items.push({ speaker: 'clinician', text: line, tag: 'plan' });
      continue;
    }

    // default goes to subjective
    items.push({ speaker: 'patient', text: line, tag: 'symptom' });
  }

  return items;
}

const seed = `78-year-old woman fell on ice yesterday, experiencing right hip pain and difficulty walking.
Has history of recurrent falls, takes Gabapentin for nerve pain, Metformin for diabetes.
Lives alone since husband died last year. Examination shows bruising on left hip,
guarding right hip, appears dehydrated and slightly confused about the day.
Exam: antalgic gait, painful active ROM hip flexion, FABER positive on right.
Dx: Right hip contusion; rule out fracture; dehydration risk in elderly.
Plan: Urgent X-ray hip/pelvis today; hydration advice; walking aid; follow-up in 48h.`;

export const VisitNotePage: React.FC = () => {
  const [transcript, setTranscript] = useState<string>(seed);

  const signals = useMemo(() => toChecklist(transcript), [transcript]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Visit — SOAP Integration (Beta)</h1>
        <span className="text-xs text-slate-500">Market: CA • Language: en-CA</span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-4 py-2 border-b border-slate-200">
            <h2 className="text-sm font-medium text-slate-800">Transcript</h2>
          </div>
          <div className="p-3">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={18}
              className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste or dictate transcription here…"
            />
            <div className="mt-2 text-[11px] text-slate-500">
              Parsed into checklist signals → SOAP sections on the right.
            </div>
          </div>
        </div>

        <SOAPNotePreview />
      </div>
    </div>
  );
};

export default VisitNotePage;
