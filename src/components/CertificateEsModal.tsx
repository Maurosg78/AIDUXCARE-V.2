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

function downloadCertificatePdf(data: CertificateEsData): void {
  const pdf = new jsPDF();
  const margin = 18;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  const headerTitle = 'CERTIFICADO CLÍNICO';
  const clinicLine = data.emisor === 'clinica' ? (data.nombreClinica || 'Clínica') : 'Consulta particular';
  const bodyText = (data.borrador || '').replace(/^["«»""]|["«»""]$/g, '').trim();
  const bodyLines = pdf.splitTextToSize(bodyText, usableWidth);
  let y = 22;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(headerTitle, margin, y);
  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text(data.profesional.nombre, margin, y);
  y += 6;

  pdf.setFontSize(10);
  pdf.text(clinicLine, margin, y);
  y += 6;
  pdf.text(`N.º colegiado: ${data.profesional.numeroColegiado || 'No informado'}`, margin, y);
  y += 6;
  pdf.text(`Fecha de emisión: ${data.fechaEmision}`, margin, y);
  y += 6;
  pdf.text(`Institución destinataria: ${data.institucionDestinataria || 'No especificada'}`, margin, y);
  y += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Cuerpo del certificado', margin, y);
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.text(bodyLines, margin, y, { align: 'justify', maxWidth: usableWidth });
  y += bodyLines.length * 5 + 18;

  if (y > 245) {
    pdf.addPage();
    y = 30;
  }

  pdf.text(data.profesional.nombre, margin, y);
  y += 6;
  pdf.line(margin, y, margin + 70, y);
  y += 6;
  pdf.text('Firma', margin, y);

  const pageHeight = pdf.internal.pageSize.getHeight();
  const disclaimerY = pageHeight - 18;
  const disclaimerText =
    'Este certificado ha sido emitido a petición del interesado con fines informativos. No sustituye el diagnóstico médico\n' +
    'ni constituye baja laboral. El profesional firmante no asume responsabilidad por el uso indebido de este documento.';
  const disclaimerLines = pdf.splitTextToSize(disclaimerText, usableWidth);

  pdf.setFontSize(8);
  pdf.text(disclaimerLines, margin, disclaimerY);

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
                <div className="text-sm text-slate-500">Emitido por</div>
                <div className="text-lg font-semibold text-slate-900">{formData.profesional.nombre}</div>
                <div className="text-sm text-slate-700">N.º colegiado: {formData.profesional.numeroColegiado || 'No informado'}</div>
                <div className="text-sm text-slate-700">Fecha: {formData.fechaEmision}</div>
                <div className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
                  {formData.borrador}
                </div>
                <div className="mt-6 text-sm text-slate-500">Firma y sello</div>
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
