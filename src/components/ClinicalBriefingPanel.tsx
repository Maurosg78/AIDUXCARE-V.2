import { useTranslation } from 'react-i18next';
import type { TodayFocusItem } from '../utils/parsePlanToFocus';

export interface ClinicalBriefingPanelProps {
  patientName: string;
  assessment: string | null;
  /** HEP items from the prior plan; `completed` = patient did it before this visit. */
  hepItems: TodayFocusItem[];
  onHepItemsChange: (items: TodayFocusItem[]) => void;
  nextSessionFocus: string | null;
  clinicianFirstName: string;
  isVisible: boolean;
}

/**
 * Pre-session briefing for follow-up (Sprint A): fixed card, no collapsibles,
 * last-session assessment + interactive HEP compliance before main recording.
 */
export function ClinicalBriefingPanel({
  patientName,
  assessment,
  hepItems,
  onHepItemsChange,
  nextSessionFocus,
  clinicianFirstName,
  isVisible,
}: ClinicalBriefingPanelProps) {
  const { t } = useTranslation();
  if (!isVisible) return null;

  const nameTrim = patientName.trim();
  const clinicianTrim = clinicianFirstName.trim();
  if (!nameTrim || !clinicianTrim) return null;

  const assessmentTrimmed = assessment?.trim() ?? '';
  const focusTrimmed = nextSessionFocus?.trim() ?? '';
  const showFocusLine = focusTrimmed.length > 0;

  const toggleHep = (id: string) => {
    onHepItemsChange(
      hepItems.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  };

  return (
    <div className="mt-4 bg-white border border-blue-200 rounded-lg p-4 sm:p-5 shadow-sm">
      <p className="text-base sm:text-lg font-semibold text-slate-900 font-apple leading-snug">
        {t('workflow.visit.briefingIntro', { clinician: clinicianTrim, patient: nameTrim })}
      </p>
      {showFocusLine && (
        <p className="mt-3 text-sm sm:text-base font-semibold text-blue-800 font-apple">
          {t('workflow.visit.briefingFocusPrefix')}: {focusTrimmed}
        </p>
      )}

      {assessmentTrimmed && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 font-apple font-semibold mb-2">
            {t('workflow.visit.briefingLastAssessment')}
          </h3>
          <p className="text-sm text-slate-700 font-apple font-light leading-relaxed line-clamp-3">
            {assessmentTrimmed}
          </p>
        </div>
      )}

      {hepItems.length > 0 && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 font-apple font-semibold mb-1">
            {t('workflow.visit.briefingHepTitle')}
          </h3>
          <p className="text-xs text-slate-500 font-apple font-light mb-3">
            {t('workflow.visit.briefingHepHint')}
          </p>
          <ul className="space-y-2">
            {hepItems.map((item) => {
              const inputId = `briefing-hep-${item.id}`;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleHep(item.id)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 shrink-0"
                  />
                  <label htmlFor={inputId} className="text-sm text-slate-800 font-apple font-light cursor-pointer flex-1">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{t('workflow.visit.briefingHepDidTheyDoIt')}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
