import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface WorkflowContextCardProps {
  patientName: string;
  patientAge: number | null;
  diagnosis: string | null;
  visitLabel: string;
  lastSessionLabel: string;
  baselineAssessment: string | null;
  baselinePlan: string | null;
  previousHepItems: string[];
  consentValid: boolean;
  allergies: string[];
  contraindications: string[];
  isDischargeSession: boolean;
  onDischargeToggle: (value: boolean) => void;
  onOpenLastSoap?: () => void;
}

function renderClinicalText(value: string | null, fallback: string): string {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return fallback;
  }
  return normalizedValue;
}

export const WorkflowContextCard: React.FC<WorkflowContextCardProps> = ({
  patientName,
  patientAge,
  diagnosis,
  visitLabel,
  lastSessionLabel,
  baselineAssessment,
  baselinePlan,
  previousHepItems,
  consentValid,
  allergies,
  contraindications,
  isDischargeSession,
  onDischargeToggle,
  onOpenLastSoap,
}) => {
  const diagnosisText = renderClinicalText(diagnosis, 'No diagnosis documented');
  const assessmentText = renderClinicalText(baselineAssessment, 'No previous assessment available');
  const planText = renderClinicalText(baselinePlan, 'No previous plan available');

  return (
    <section className="overflow-hidden bg-white border border-blue-100 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-base font-semibold text-slate-900 font-apple">{patientName}</h2>
          {patientAge !== null ? (
            <span className="text-sm text-slate-500 font-apple font-light">{patientAge} años</span>
          ) : null}
          <span className="text-sm text-slate-500 font-apple font-light">{visitLabel}</span>
          <span className="text-sm text-slate-500 font-apple font-light">{lastSessionLabel}</span>
          {onOpenLastSoap ? (
            <button
              type="button"
              onClick={onOpenLastSoap}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-apple font-light"
            >
              Ver último SOAP
            </button>
          ) : null}
          {consentValid ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 font-apple font-light">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              Consentimiento válido
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 font-apple">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              Consentimiento requerido
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-semibold mb-2">
              Datos clínicos leídos
            </p>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-semibold text-slate-500 font-apple">Diagnóstico</dt>
                <dd className="text-sm text-slate-800 font-apple font-light">{diagnosisText}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 font-apple">Valoración última sesión</dt>
                <dd className="text-sm text-slate-800 font-apple font-light whitespace-pre-wrap">{assessmentText}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 font-apple">Plan última sesión</dt>
                <dd className="text-sm text-slate-800 font-apple font-light whitespace-pre-wrap">{planText}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-semibold mb-2">
              Ejercicios prescritos para casa
            </p>
            {previousHepItems.length > 0 ? (
              <ul className="space-y-2">
                {previousHepItems.map((item) => (
                  <li key={item} className="text-sm text-slate-800 font-apple font-light">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 font-apple font-light">No hay ejercicios prescritos para casa.</p>
            )}
          </div>

          {(allergies.length > 0 || contraindications.length > 0) && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-3">
              {allergies.length > 0 ? (
                <p className="text-xs text-amber-800 font-apple">
                  <span className="font-semibold">Alergias:</span> {allergies.join(', ')}
                </p>
              ) : null}
              {contraindications.length > 0 ? (
                <p className="text-xs text-amber-800 font-apple mt-1">
                  <span className="font-semibold">Contraindicaciones:</span> {contraindications.join('; ')}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-slate-100 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDischargeSession}
            onChange={(e) => onDischargeToggle(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 font-apple">Última sesión (alta del paciente)</span>
        </label>
        {isDischargeSession && (
          <div className="rounded-lg bg-sky-50 border border-sky-100 px-4 py-3">
            <p className="text-sm text-sky-900 font-apple leading-relaxed">
              Última sesión — cuanto más menciones en voz alta, mejor quedará documentado el alta.
            </p>
            <p className="mt-1.5 text-sm text-slate-500 font-apple font-light leading-relaxed">
              Algunos ejemplos: rango de movimiento, fuerza, sensibilidad, tolerancia a actividades diarias, recomendaciones... Tú decides qué es relevante para este paciente.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
