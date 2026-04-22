import React from 'react';
import { FileText, Play, RotateCcw } from 'lucide-react';
import type { ClinicalDayRow, ClinicalDayStatus } from '../utils/clinicalDayView';

type ClinicalDayViewPanelProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  rows: ClinicalDayRow[];
  loading: boolean;
  onContinue: (row: ClinicalDayRow) => void;
  onOpenSoap: (row: ClinicalDayRow) => void;
  onReview: (row: ClinicalDayRow) => void;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStatusClass(status: ClinicalDayStatus): string {
  switch (status) {
    case 'programado':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'iniciado':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'incompleto':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'draft-only':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'documentado':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'cancelado':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getActionLabel(status: ClinicalDayStatus): 'Continuar' | 'Abrir SOAP' | 'Revisar' | null {
  switch (status) {
    case 'iniciado':
    case 'incompleto':
      return 'Continuar';
    case 'documentado':
      return 'Abrir SOAP';
    case 'draft-only':
      return 'Revisar';
    default:
      return null;
  }
}

export const ClinicalDayViewPanel: React.FC<ClinicalDayViewPanelProps> = ({
  selectedDate,
  onDateChange,
  rows,
  loading,
  onContinue,
  onOpenSoap,
  onReview,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">Vista del día</h2>
          <p className="text-base text-gray-600 font-apple font-light">
            Jornada clínica reconstruida desde citas, sesiones, encounters y consultas.
          </p>
        </div>
        <input
          type="date"
          value={toDateKey(selectedDate)}
          onChange={(event) => {
            const [year, month, day] = (event.target.value || '').split('-').map(Number);
            if (year && month && day) {
              onDateChange(new Date(year, month - 1, day));
            }
          }}
          className="text-sm font-apple border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
        />
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Construyendo vista clínica del día…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No se encontró actividad clínica para la fecha seleccionada.
          </div>
        ) : (
          rows.map((row) => {
            const actionLabel = getActionLabel(row.status);

            return (
              <div
                key={`${row.patientId}-${row.status}-${row.time ?? 'no-time'}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{row.patientName}</h3>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {row.time ? <span>{row.time}</span> : null}
                    <span>Encounter: {row.hasEncounter ? 'sí' : 'no'}</span>
                    <span>Sesión: {row.hasSession ? 'sí' : 'no'}</span>
                    <span>Consulta: {row.hasConsultation ? 'sí' : 'no'}</span>
                  </div>
                </div>

                {actionLabel ? (
                  <div className="flex items-center justify-end gap-2">
                    {actionLabel === 'Continuar' ? (
                      <button
                        type="button"
                        onClick={() => onContinue(row)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4" />
                        Continuar
                      </button>
                    ) : null}
                    {actionLabel === 'Abrir SOAP' ? (
                      <button
                        type="button"
                        onClick={() => onOpenSoap(row)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                      >
                        <FileText className="h-4 w-4" />
                        Abrir SOAP
                      </button>
                    ) : null}
                    {actionLabel === 'Revisar' ? (
                      <button
                        type="button"
                        onClick={() => onReview(row)}
                        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Revisar
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
