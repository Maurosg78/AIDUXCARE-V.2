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
              HEP asignado previamente
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
              <p className="text-sm text-slate-500 font-apple font-light">No hay HEP estructurado disponible.</p>
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
    </section>
  );
};
