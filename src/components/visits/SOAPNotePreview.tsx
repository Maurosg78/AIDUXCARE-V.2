import React, { useMemo } from 'react';
import { buildSOAPFromAnalysis, transcriptToChecklist } from '../../core/notes/transcriptToSOAP';

type PreviewState = 'pending' | 'empty' | 'ready';

interface AnalysisResults {
  entities?: unknown[]; // shape opaque to the viewer; checklist builder owns structure
}

interface SOAPNotePreviewProps {
  transcript?: string; // received by contract, not used for mapping (per CTO guardrails)
  analysisResults?: AnalysisResults | null;
  className?: string;
}

const MAX_ITEMS_PER_SECTION = 20;

/**
 * Preview component states:
 * - pending:    no analysisResults
 * - empty:      analysisResults present but no structurable checklist
 * - ready:      content available to render S/O/A/P
 */
export const SOAPNotePreview: React.FC<SOAPNotePreviewProps> = ({
  transcript, // eslint-disable-line @typescript-eslint/no-unused-vars
  analysisResults,
  className = '',
}) => {
  const { state, soap } = useMemo(() => {
    if (!analysisResults) {
      return { state: 'pending' as PreviewState, soap: null as unknown };
    }
    const checklist = transcriptToChecklist(analysisResults as Record<string, unknown>);
    if (!Array.isArray(checklist) || checklist.length === 0) {
      return { state: 'empty' as PreviewState, soap: null as unknown };
    }
    const note = buildSOAPFromAnalysis(analysisResults as Record<string, unknown>) as {
      sections: {
        subjective?: string[];
        objective?: string[];
        assessment?: string[];
        plan?: string[];
      };
    };
    return { state: 'ready' as PreviewState, soap: note };
  }, [analysisResults]);

  if (state === 'pending') {
    return (
      <div
        role="region"
        aria-label="SOAP Note Preview"
        aria-live="polite"
        className={`rounded-md border border-slate-200 bg-white p-4 text-slate-700 ${className}`}
      >
        <div className="text-sm">⏳ Analyzing...</div>
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div
        role="region"
        aria-label="SOAP Note Preview"
        aria-live="polite"
        className={`rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900 ${className}`}
      >
        <div className="text-sm">No clinically structurable information</div>
      </div>
    );
  }

  // state === 'ready'
  const sections = soap && (soap as any).sections ? (soap as any).sections : {};
  return (
    <div
      role="region"
      aria-label="SOAP Note Preview"
      aria-live="polite"
      className={`rounded-md border border-slate-200 bg-white p-4 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-800 mb-2">SOAP preview</h3>

      <Section title="S - Subjective" items={toStringArray(sections.subjective)} />
      <Section title="O - Objective" items={toStringArray(sections.objective)} />
      <Section title="A - Assessment" items={toStringArray(sections.assessment)} />
      <Section title="P - Plan" items={toStringArray(sections.plan)} />
    </div>
  );
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

const Section: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  const shown = items.slice(0, MAX_ITEMS_PER_SECTION);
  const remaining = items.length - shown.length;

  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-slate-600 mb-1">{title}</div>
      {shown.length > 0 ? (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          {shown.map((t, idx) => (
            <li key={`${title}-${idx}`}>{t}</li>
          ))}
          {remaining > 0 && (
            <li className="text-xs text-slate-400 italic">+{remaining} more items...</li>
          )}
        </ul>
      ) : (
        <div className="text-xs text-slate-400 italic">—</div>
      )}
    </div>
  );
};

export default SOAPNotePreview;
