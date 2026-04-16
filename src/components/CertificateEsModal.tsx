import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { Download, FileText, Loader2, Sparkles, X } from 'lucide-react';
import { isSpainPilot } from '@/core/pilotDetection';
import { generateCertificateBodyEs } from '@/services/certificateEsService';
import type { CertificateEsData, CertificateTypeEs } from '@/types/certificate.es';

type CertificateEsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  soapAssessment: string;
  professional: CertificateEsData['profesional'];
  patient: CertificateEsData['paciente'];
  defaultClinicName?: string;
};

const CERTIFICATE_TYPE_OPTIONS: Array<{ value: CertificateTypeEs; label: string; description: string }> = [
  {
    value: 'asistencia-tratamiento',
    label: 'Asistencia a tratamiento',
    description: 'Justifica asistencia a sesiones o seguimiento fisioterapéutico.',
  },
  {
    value: 'estado-clinico-actual',
    label: 'Estado clínico actual',
    description: 'Resume situación funcional y clínica actual del paciente.',
  },
  {
    value: 'derivacion-especialista',
    label: 'Derivación a especialista',
    description: 'Expone motivo clínico para derivación o revisión médica.',
  },
  {
    value: 'restricciones-funcionales',
    label: 'Restricciones funcionales',
    description: 'Describe limitaciones físicas recomendadas para el paciente.',
  },
  {
    value: 'certificado-escolar',
    label: 'Certificado para instituciones de educación',
    description: 'Indica adaptación o restricción temporal en entorno educativo.',
  },
  {
    value: 'otro',
    label: 'Otro',
    description: 'Certificado libre para situación específica documentada.',
  },
];

function buildInitialData(
  professional: CertificateEsData['profesional'],
  patient: CertificateEsData['paciente'],
  defaultClinicName?: string,
): CertificateEsData {
  const issueDate = new Date().toLocaleDateString('es-ES');
  const institutionPreset = 'A petición del paciente';
  const initialData: CertificateEsData = {
    tipo: 'asistencia-tratamiento',
    institucionDestinataria: institutionPreset,
    emisor: 'clinica',
    nombreClinica: defaultClinicName || '',
    detallesEspecificos: '',
    borrador: '',
    profesional: professional,
    paciente: patient,
    fechaEmision: issueDate,
  };

  return initialData;
}

function buildFilename(data: CertificateEsData): string {
  const patientSegment = data.paciente.nombre.trim().replace(/\s+/g, '-').toLowerCase();
  const typeSegment = data.tipo.trim().replace(/\s+/g, '-').toLowerCase();
  const dateSegment = data.fechaEmision.replace(/\//g, '-');
  const fallbackSegment = 'paciente';
  const resolvedPatientSegment = patientSegment || fallbackSegment;
  const filename = `certificado-${typeSegment}-${resolvedPatientSegment}-${dateSegment}.pdf`;

  return filename;
}

function resolveInstitutionDisplay(data: CertificateEsData): string {
  const clinicLine = data.emisor === 'clinica' ? (data.nombreClinica || 'Clínica') : 'Consulta particular';
  const trimmedInstitution = data.institucionDestinataria.trim();
  const isApeticion =
    trimmedInstitution === 'A petición del paciente' ||
    trimmedInstitution === '';
  const institucionDisplay = isApeticion ? '—' : trimmedInstitution;
  void clinicLine;

  return institucionDisplay;
}

function buildCertificateHeaderLines(data: CertificateEsData): string[] {
  const clinicLine = data.emisor === 'clinica' ? (data.nombreClinica || 'Clínica') : 'Consulta particular';
  const institutionDisplay = resolveInstitutionDisplay(data);
  const patientLine = `Paciente: ${data.paciente.nombre}`;
  const professionalLine = `Fisioterapeuta: ${data.profesional.nombre}`;
  const clinicLabelLine = `Centro: ${clinicLine}`;
  const licenseLine = `N.º de colegiado: ${data.profesional.numeroColegiado || 'No informado'}`;
  const issueDateLine = `Fecha de emisión: ${data.fechaEmision}`;
  const institutionLine = `Institución destinataria: ${institutionDisplay}`;
  const headerLines = [
    patientLine,
    professionalLine,
    clinicLabelLine,
    licenseLine,
    issueDateLine,
    institutionLine,
  ];

  return headerLines;
}

function buildCertificateBodyText(data: CertificateEsData): string {
  const rawBodyText = (data.borrador || '').replace(/^["«»""]|["«»""]$/g, '').trim();
  const normalizedBodyStart = rawBodyText.replace(
    /^\s*(El presente certificado se emite a nombre de .*?\.\s*)?(El\/La paciente|El paciente|La paciente)\s+/i,
    '',
  ).trim();
  const patientPresentationPrefix = `El presente certificado se emite a nombre de ${data.paciente.nombre}. `;
  const bodyText = `${patientPresentationPrefix}${normalizedBodyStart}`;
  const trimmedBodyText = bodyText.trim();

  return trimmedBodyText;
}

function buildCertificateParagraphs(data: CertificateEsData): string[] {
  const bodyText = buildCertificateBodyText(data);
  const rawParagraphs = bodyText.split(/\n\s*\n/);
  const paragraphTexts = rawParagraphs.filter((paragraph) => paragraph.trim().length > 0);
  const normalizedParagraphs = paragraphTexts.length > 0 ? paragraphTexts : [bodyText];

  return normalizedParagraphs;
}

function downloadCertificatePdf(data: CertificateEsData): void {
  const pdf = new jsPDF();
  const margin = 18;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageCenterX = pageWidth / 2;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const bodyBlockWidth = usableWidth - 18;
  const bodyBlockX = (pageWidth - bodyBlockWidth) / 2;
  const topFrameY = 12;
  const bottomFrameY = pageHeight - 24;
  const paragraphSpacing = 6;
  const signatureOffset = paragraphSpacing * 3;
  const bodyLineHeight = 5.8;
  const headerTitle = 'CERTIFICADO CLÍNICO';
  const headerLines = buildCertificateHeaderLines(data);
  const institutionDisplay = resolveInstitutionDisplay(data);
  const normalizedParagraphs = buildCertificateParagraphs(data);
  let y = 24;

  pdf.setDrawColor(160, 160, 160);
  pdf.setLineWidth(0.3);
  pdf.line(margin, topFrameY, pageWidth - margin, topFrameY);
  pdf.line(margin, bottomFrameY, pageWidth - margin, bottomFrameY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(headerTitle, pageCenterX, y, { align: 'center' });
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  headerLines.forEach((line, index) => {
    const isPrimaryLine = index < 2;
    const fontSize = isPrimaryLine ? 11 : 10;
    pdf.setFontSize(fontSize);
    pdf.text(line, pageCenterX, y, { align: 'center' });
    y += 6;
  });
  y += 4;

  pdf.setFont('helvetica', 'normal');
  let currentBodyY = y;

  normalizedParagraphs.forEach((paragraph) => {
    const paragraphLines = pdf.splitTextToSize(paragraph.trim(), bodyBlockWidth);
    pdf.text(paragraphLines, bodyBlockX, currentBodyY, {
      align: 'left',
      maxWidth: bodyBlockWidth,
      lineHeightFactor: 1.25,
    });
    const paragraphHeight = paragraphLines.length * bodyLineHeight;
    currentBodyY += paragraphHeight + paragraphSpacing;
  });

  const bodyBottomY = currentBodyY - paragraphSpacing;
  const signatureStartY = bodyBottomY + signatureOffset;
  const minimumSignatureStartY = pageHeight * 0.75;
  const maximumSignatureStartY = bottomFrameY - 26;
  const preferredSignatureStartY = Math.max(signatureStartY, minimumSignatureStartY);
  const resolvedSignatureStartY = Math.min(preferredSignatureStartY, maximumSignatureStartY);
  const signatureLineWidth = 70;
  const signatureLineStartX = pageCenterX - signatureLineWidth / 2;
  const signatureLineEndX = pageCenterX + signatureLineWidth / 2;
  const signatureName = `Ft. ${data.profesional.nombre}`;
  const signatureTextY = resolvedSignatureStartY;
  const signatureLineY = signatureTextY + 10;

  pdf.text(signatureName, pageCenterX, signatureTextY, { align: 'center' });
  pdf.line(signatureLineStartX, signatureLineY, signatureLineEndX, signatureLineY);

  const disclaimerY = pageHeight - 15;
  const disclaimerText =
    'Certificado emitido en el ejercicio de la práctica fisioterapéutica. No constituye prescripción médica ni baja laboral.';
  pdf.setFontSize(8);

  if (institutionDisplay === '—') {
    const petitionLine = 'Emitido a petición del interesado/a.';
    pdf.setFont('helvetica', 'bold');
    pdf.text(petitionLine, margin, disclaimerY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(disclaimerText, margin, disclaimerY + 5, { maxWidth: usableWidth });
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.text(disclaimerText, margin, disclaimerY, { maxWidth: usableWidth });
  }

  const filename = buildFilename(data);
  pdf.save(filename);
}

export default function CertificateEsModal(props: CertificateEsModalProps) {
  const { isOpen, onClose, soapAssessment, professional, patient, defaultClinicName } = props;
  const pilotIsSpain = isSpainPilot();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialData = useMemo(() => buildInitialData(professional, patient, defaultClinicName), [defaultClinicName, patient, professional]);
  const [formData, setFormData] = useState<CertificateEsData>(initialData);

  useEffect(() => {
    setFormData((previous) => {
      const nextData = {
        ...previous,
        profesional: professional,
        paciente: patient,
        nombreClinica: previous.emisor === 'clinica' ? (previous.nombreClinica || defaultClinicName || '') : previous.nombreClinica,
      };

      return nextData;
    });
  }, [defaultClinicName, patient, professional]);

  if (!pilotIsSpain || !isOpen) {
    return null;
  }

  const selectedType = CERTIFICATE_TYPE_OPTIONS.find((item) => item.value === formData.tipo);
  const previewHeaderLines = buildCertificateHeaderLines(formData);
  const previewParagraphs = buildCertificateParagraphs(formData);
  const canContinueFromStepOne = Boolean(formData.tipo);
  const canContinueFromStepTwo = Boolean(formData.detallesEspecificos.trim());
  const canContinueFromStepThree = Boolean(formData.borrador.trim());

  const updateField = <K extends keyof CertificateEsData>(field: K, value: CertificateEsData[K]) => {
    setFormData((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };

      return next;
    });
  };

  const handleGenerateDraft = async () => {
    const loadingValue = true;
    const emptyError = null;

    setIsGenerating(loadingValue);
    setError(emptyError);

    try {
      const draft = await generateCertificateBodyEs(formData, soapAssessment);
      const trimmedDraft = draft.trim();

      updateField('borrador', trimmedDraft);
    } catch (generationError) {
      const message = generationError instanceof Error ? generationError.message : 'No se pudo generar el borrador.';

      setError(message);
    } finally {
      const loadingValueAfter = false;

      setIsGenerating(loadingValueAfter);
    }
  };

  const handleDownloadPdf = () => {
    downloadCertificatePdf(formData);
  };

  const handleClose = () => {
    const resetData = buildInitialData(professional, patient, defaultClinicName);
    const firstStep = 1;
    const idleGeneratingState = false;
    const emptyError = null;

    setFormData(resetData);
    setStep(firstStep);
    setIsGenerating(idleGeneratingState);
    setError(emptyError);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Certificado clínico</h2>
            <p className="mt-1 text-sm text-slate-600">Flujo ES-ES para certificados del piloto en España.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-slate-500">
            {[
              '1. Tipo',
              '2. Detalles',
              '3. Borrador IA',
              '4. PDF',
            ].map((label, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === step;
              const isCompleted = stepNumber < step;
              const className = isActive
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : isCompleted
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500';

              return (
                <div key={label} className={`rounded-lg border px-3 py-2 ${className}`}>
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {CERTIFICATE_TYPE_OPTIONS.map((option) => {
                const isSelected = option.value === formData.tipo;
                const cardClassName = isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300';

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('tipo', option.value)}
                    className={`w-full rounded-xl border p-4 text-left transition ${cardClassName}`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                    <div className="mt-1 text-sm text-slate-600">{option.description}</div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Institución destinataria</label>
                <input
                  type="text"
                  value={formData.institucionDestinataria}
                  onChange={(event) => updateField('institucionDestinataria', event.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-blue-500"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => updateField('institucionDestinataria', 'A petición del paciente')}
                    className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    A petición del paciente
                  </button>
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">Emisor</span>
                <div className="flex gap-3">
                  {(['clinica', 'particular'] as const).map((option) => {
                    const isSelected = formData.emisor === option;
                    const optionLabel = option === 'clinica' ? 'Clínica' : 'Particular';
                    const className = isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-700';

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField('emisor', option)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium ${className}`}
                      >
                        {optionLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.emisor === 'clinica' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nombre de la clínica</label>
                  <input
                    type="text"
                    value={formData.nombreClinica || ''}
                    onChange={(event) => updateField('nombreClinica', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Detalles específicos</label>
                <textarea
                  value={formData.detallesEspecificos}
                  onChange={(event) => updateField('detallesEspecificos', event.target.value)}
                  placeholder="ej: no levantar más de 10kg, no realizar educación física"
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div><strong>Tipo:</strong> {selectedType?.label || 'No seleccionado'}</div>
                <div><strong>Institución:</strong> {formData.institucionDestinataria || 'No especificada'}</div>
                <div><strong>Paciente:</strong> {formData.paciente.nombre}</div>
              </div>

              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generar borrador
              </button>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Borrador editable</label>
                <textarea
                  value={formData.borrador}
                  onChange={(event) => updateField('borrador', event.target.value)}
                  rows={10}
                  style={{ minHeight: '200px' }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-blue-500 resize-y"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-center">
                  <div className="text-xl font-semibold text-slate-900">CERTIFICADO CLÍNICO</div>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    {previewHeaderLines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 border-t border-slate-200 pt-5 text-sm leading-7 text-slate-800">
                  {previewParagraphs.map((paragraph) => (
                    <p key={paragraph} className="mb-5 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-16 text-center text-sm text-slate-700">Ft. {formData.profesional.nombre}</div>
                <div className="mx-auto mt-6 w-48 border-t border-slate-300" />
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={() => setStep((previous) => Math.max(1, previous - 1))}
            disabled={step === 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Atrás
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cerrar
            </button>
            {step < 4 && (
              <button
                type="button"
                onClick={() => setStep((previous) => Math.min(4, previous + 1))}
                disabled={
                  (step === 1 && !canContinueFromStepOne) ||
                  (step === 2 && !canContinueFromStepTwo) ||
                  (step === 3 && !canContinueFromStepThree)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {step === 3 ? <FileText className="h-4 w-4" /> : null}
                Siguiente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
