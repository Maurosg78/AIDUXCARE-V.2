import React, { useMemo } from 'react';
import { CheckCircle, ClipboardList, Copy, Download, FileText, Mail } from 'lucide-react';
import { derivePlanFromText } from '@/utils/derivePlanFromText';

interface FinalizedSessionSoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface FinalizedSessionActionsProps {
  // Datos clinicos de la sesion finalizada
  soapNote: FinalizedSessionSoapNote;
  sessionId: string;
  sessionDateKey: string;

  // Datos del paciente: solo lo necesario para acciones
  patientName: string;
  patientEmail?: string;

  // Datos del profesional: solo lo necesario para documentos derivados
  professionalName: string;
  professionalLicense?: string;

  // Capacidades disponibles calculadas por el caller
  canEmail: boolean;
  canCertificate: boolean;
  canReferralReport: boolean;

  // Callbacks: este componente no persiste, no navega y no escribe historia clinica
  onCopy: () => void;
  onDownloadTxt: () => void;
  onExportPdf: () => void;
  onSendEmail: () => void;
  onCertificate?: () => void;
  onReferralReport?: () => void;
  onBackToCommandCenter: () => void;

  // Estado visual de envio
  emailSent?: boolean;
}

const primaryActionClassName =
  'inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700';

const secondaryActionClassName =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50';

const emailActionClassName =
  'inline-flex h-10 min-w-[210px] items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100';

const completedEmailClassName =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700';

const commandCenterActionClassName =
  'inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple px-5 py-3 text-[15px] font-medium text-white shadow-sm transition hover:opacity-95 font-apple';

export const FinalizedSessionActions: React.FC<FinalizedSessionActionsProps> = ({
  soapNote,
  sessionId,
  sessionDateKey,
  patientName,
  patientEmail,
  professionalName,
  professionalLicense,
  canEmail,
  canCertificate,
  canReferralReport,
  onCopy,
  onDownloadTxt,
  onExportPdf,
  onSendEmail,
  onCertificate,
  onReferralReport,
  onBackToCommandCenter,
  emailSent = false,
}) => {
  const finalizedPlanSections = useMemo(() => {
    return derivePlanFromText(soapNote.plan);
  }, [soapNote.plan]);
  // The patient summary must reflect the finalized SOAP plan, not active workflow UI state.
  const finalizedHomeProgramItems = finalizedPlanSections.homeProgram;
  const finalizedInClinicItems = finalizedPlanSections.inClinic;
  const hasFinalizedPatientSummaryContent =
    soapNote.plan.trim().length > 0 ||
    finalizedHomeProgramItems.length > 0 ||
    finalizedInClinicItems.length > 0;
  const normalizedPatientEmail = patientEmail?.trim() ?? '';
  const shouldRenderEmailAction =
    canEmail &&
    normalizedPatientEmail.length > 0 &&
    hasFinalizedPatientSummaryContent;
  const shouldRenderCertificateAction = canCertificate && Boolean(onCertificate);
  const shouldRenderReferralReportAction = canReferralReport && Boolean(onReferralReport);
  const actionContextLabel = useMemo(() => {
    return `${patientName} · ${sessionDateKey} · ${sessionId}`;
  }, [patientName, sessionDateKey, sessionId]);
  const professionalContextLabel = useMemo(() => {
    if (professionalLicense) {
      return `${professionalName} · ${professionalLicense}`;
    }

    return professionalName;
  }, [professionalName, professionalLicense]);

  return (
    <section
      aria-label={`Acciones de sesion finalizada para ${actionContextLabel}`}
      className="flex flex-wrap items-center gap-3"
      data-professional-context={
        process.env.NODE_ENV === 'development'
          ? professionalContextLabel
          : undefined
      }
    >
      <button
        type="button"
        onClick={() => onCopy()}
        className={primaryActionClassName}
        title="Copiar nota finalizada al portapapeles"
      >
        <Copy className="h-4 w-4" />
        Copiar al portapapeles
      </button>

      <button
        type="button"
        onClick={() => onDownloadTxt()}
        className={primaryActionClassName}
        title="Descargar nota finalizada en formato texto"
      >
        <Download className="h-4 w-4" />
        Descargar .txt
      </button>

      <button
        type="button"
        onClick={() => onExportPdf()}
        className={secondaryActionClassName}
        title="Exportar nota finalizada como PDF"
      >
        <Download className="h-4 w-4" />
        Exportar PDF
      </button>

      {shouldRenderEmailAction && (
        emailSent ? (
          <div className={completedEmailClassName}>
            <CheckCircle className="h-4 w-4" />
            Resumen enviado al paciente
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSendEmail()}
            className={emailActionClassName}
            title="Enviar resumen de la sesion finalizada al paciente"
          >
            <Mail className="h-4 w-4" />
            Enviar resumen al paciente
          </button>
        )
      )}

      {shouldRenderCertificateAction && (
        <button
          type="button"
          onClick={() => onCertificate?.()}
          className={secondaryActionClassName}
          title="Crear certificado desde la sesion finalizada"
        >
          <FileText className="h-4 w-4" />
          Certificado
        </button>
      )}

      {shouldRenderReferralReportAction && (
        <button
          type="button"
          onClick={() => onReferralReport?.()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
          title="Generar informe de derivacion desde la sesion finalizada"
        >
          <ClipboardList className="h-4 w-4" />
          Informe
        </button>
      )}

      <button
        type="button"
        onClick={() => onBackToCommandCenter()}
        className={commandCenterActionClassName}
        title="Volver al Centro de mando"
      >
        <CheckCircle className="h-4 w-4" />
        Volver al Centro de mando
      </button>
    </section>
  );
};

export default FinalizedSessionActions;
