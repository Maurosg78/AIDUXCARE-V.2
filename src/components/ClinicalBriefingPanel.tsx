export interface ClinicalBriefingPanelProps {
  patientName: string;
  assessment: string | null;
  homeProgramItems: string[];
  nextSessionFocus: string | null;
  clinicianFirstName: string;
  isVisible: boolean;
}

/**
 * Read-only pre-session briefing for follow-up. No data fetching — props only.
 */
export function ClinicalBriefingPanel({
  patientName,
  assessment,
  homeProgramItems,
  nextSessionFocus,
  clinicianFirstName,
  isVisible,
}: ClinicalBriefingPanelProps) {
  if (!isVisible) return null;

  const nameTrim = patientName.trim();
  const clinicianTrim = clinicianFirstName.trim();
  if (!nameTrim || !clinicianTrim) return null;

  const assessmentTrimmed = assessment?.trim() ?? '';
  const hasAssessment = assessmentTrimmed.length > 0;
  const hasHep = homeProgramItems.length > 0;
  const showCollapsible = hasAssessment || hasHep;

  const focusTrimmed = nextSessionFocus?.trim() ?? '';
  const showFocusLine = focusTrimmed.length > 0;

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-6 mt-4">
      <p className="text-xl font-semibold text-slate-900 font-apple leading-snug">
        {clinicianTrim}, tu siguiente paciente es {nameTrim}.
      </p>
      {showFocusLine && (
        <p className="mt-3 text-base font-semibold text-blue-800 font-apple">
          El foco para hoy: {focusTrimmed}
        </p>
      )}
      {showCollapsible && (
        <details className="mt-4 group border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800 font-apple list-none flex items-center justify-between hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
            <span>Contexto de la última sesión</span>
            <span className="text-slate-400 text-xs transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="px-4 pb-4 pt-0 space-y-2 border-t border-slate-200">
            {hasAssessment && (
              <p className="text-sm text-slate-700 font-apple font-light pt-3">
                Trabajamos en: {assessmentTrimmed}
              </p>
            )}
            {hasHep && (
              <p className="text-sm text-slate-700 font-apple font-light">
                Enviamos a casa: {homeProgramItems.join(', ')}
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
