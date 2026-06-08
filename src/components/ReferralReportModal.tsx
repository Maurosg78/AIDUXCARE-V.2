import React from 'react';
import { ReferralReportData, ReferralReportGenerator } from '../services/referralReportGenerator';

interface ReferralReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReferralReportData | null;
}

function calcAgeUI(dobStr: string): string {  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age > 0 ? String(age) : "";
}

export const ReferralReportModal: React.FC<ReferralReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  if (!isOpen || !reportData) {
    return null;
  }

  const handleDownload = () => {
    if (!reportData) return;
    const blob = ReferralReportGenerator.generatePDF(reportData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = reportData.patientName.replace(/\s+/g, '_') || 'PATIENT';
    link.href = url;
    link.download = `Referral_Report_${safeName}_${reportData.sessionDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasUrgentFlags = reportData.redFlags.some(
    (f) => f.decision === 'referral_stop' || f.decision === 'referral_continue_partial'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Informe de Derivación Fisioterapéutica</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
          <section className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">Datos del Paciente</h3>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Nombre:</span> {reportData.patientName}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Fecha de nacimiento:</span>{' '}
              {reportData.patientDOB || "No especificada"}{reportData.patientDOB ? ` (Edad: ${calcAgeUI(reportData.patientDOB)} años)` : ""}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Fecha de sesión:</span> {reportData.sessionDate}
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">Fisioterapeuta Derivador</h3>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Fisioterapeuta:</span> {reportData.physiotherapistName}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Médico derivador registrado:</span>{' '}
              {reportData.referringDoctor || 'No especificado'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">Alertas Clínicas Identificadas</h3>
            {reportData.redFlags.length === 0 ? (
              <p className="text-sm text-slate-600">No se documentaron alertas clínicas específicas.</p>
            ) : (
              <div className="space-y-2">
                {reportData.redFlags.map((flag, idx) => (
                  <div
                    key={`${flag.label}-${idx}`}
                    className="rounded-md border border-red-200 bg-red-50/60 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-red-900">{flag.label}</span>
                      {flag.urgency && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white">
                          {flag.urgency}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-red-800">
                      <span className="font-semibold">Decisión:</span>{' '}
                      {flag.decision === 'referral_stop'
                        ? 'Derivación + suspensión de fisioterapia'
                        : 'Derivación + continuidad con modalidades seguras'}
                    </p>
                    {(flag.evidence || flag.continuationNote) && (
                      <p className="mt-1 text-xs text-slate-700">
                        {flag.evidence && (
                          <>
                            <span className="font-semibold">Evidencia:</span> {flag.evidence}
                          </>
                        )}
                        {flag.evidence && flag.continuationNote && <span> · </span>}
                        {flag.continuationNote && (
                          <>
                            <span className="font-semibold">Plan de continuidad:</span>{' '}
                            {flag.continuationNote}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {reportData.clinicalEvolutionSummary && (
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800">Evolución clínica</h3>
              <p className="text-sm text-slate-700">
                {reportData.clinicalEvolutionSummary}
              </p>
            </section>
          )}

          {reportData.clinicalNotes && (
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800">Hallazgos de la sesión actual</h3>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {reportData.clinicalNotes}
              </p>
            </section>
          )}

          <section className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">Acción Documentada</h3>
            <p className="text-sm text-slate-700">
              {hasUrgentFlags ? (
                <>
                  {reportData.redFlags.some((f) => f.decision === 'referral_stop')
                    ? 'Se documentaron indicadores clínicos para valoración de derivación inmediata. Tratamiento fisioterapéutico suspendido hasta respuesta del especialista.'
                    : 'Se documentaron indicadores clínicos para valoración de derivación. La fisioterapia continúa solo con modalidades seguras.'}
                </>
              ) : (
                'No se registró una decisión explícita de derivación con suspensión en este informe.'
              )}
            </p>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition shadow-sm"
          >
            <span>📋</span>
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralReportModal;
