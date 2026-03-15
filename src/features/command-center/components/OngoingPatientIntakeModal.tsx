/**
 * Ongoing Patient Intake Modal — Baseline-oriented
 *
 * Minimal form for what baseline needs: S/O/A/P.
 * Previous history section includes Add documents for images and reports.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, ChevronDown, ChevronUp, UploadCloud, Loader2, Paperclip } from 'lucide-react';
import { DictationButton } from '@/components/ui/DictationButton';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { createBaselineFromMinimalSOAP } from '@/services/clinicalBaselineService';
import PatientService from '@/services/patientService';
import { patientsRepo } from '@/repositories/patientsRepo';
import { ClinicalAttachmentService, ClinicalAttachment } from '@/services/clinicalAttachmentService';
import { generateBaselineSOAPFromOngoingIntake } from '@/services/vertex-ai-soap-service';
import logger from '@/shared/utils/logger';
import {
  ongoingFormToBaselineSOAP,
  hasMinimumForBaseline,
  hasAllRequiredForBaseline,
  isPlanGeneric,
  type OngoingFormData,
} from '../utils/ongoingFormToBaselineSOAP';

const MIN_FIELD = 3;

const Input = React.memo(function Input({
  label,
  value,
  onChange,
  placeholder,
  optional = true,
  optionalLabel = '(optional)',
  withDictation = false,
  dictateTitle = 'Dictate',
  submitting,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  optionalLabel?: string;
  withDictation?: boolean;
  dictateTitle?: string;
  submitting?: boolean;
  [k: string]: unknown;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {optional && <span className="text-slate-400 font-normal">{optionalLabel}</span>}
      </label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue font-apple"
          disabled={submitting}
          {...rest}
        />
        {withDictation && (
          <DictationButton value={value} onChange={onChange} disabled={submitting} title={dictateTitle} />
        )}
      </div>
    </div>
  );
});

const TextArea = React.memo(function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  optional = true,
  optionalLabel = '(optional)',
  withDictation = false,
  dictateTitle = 'Dictate',
  submitting,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  optional?: boolean;
  optionalLabel?: string;
  withDictation?: boolean;
  dictateTitle?: string;
  submitting?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {optional && <span className="text-slate-400 font-normal">{optionalLabel}</span>}
      </label>
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue font-apple resize-none"
          disabled={submitting}
        />
        {withDictation && (
          <DictationButton value={value} onChange={onChange} disabled={submitting} title={dictateTitle} className="self-start" />
        )}
      </div>
    </div>
  );
});

export interface OngoingPatientIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  onSuccess: (
    patientId: string,
    baselineSOAP?: { subjective: string; objective: string; assessment: string; plan: string },
    patientName?: string
  ) => void;
}

function Collapsible({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 font-medium text-slate-800"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-white border-t border-slate-100">{children}</div>}
    </div>
  );
}

const OngoingPatientIntakeModalInner: React.FC<OngoingPatientIntakeModalProps> = ({
  isOpen,
  onClose,
  patientId: initialPatientId,
  patientName: initialPatientName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vertexFailed, setVertexFailed] = useState(false);
  const [standardizingVertex, setStandardizingVertex] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState<string | undefined>(initialPatientId);
  const [currentPatientName, setCurrentPatientName] = useState<string | undefined>(initialPatientName);

  const isNewPatient = !initialPatientId;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    patientRecord: true,
    subjective: true,
    antecedentes: true,
    objective: false,
    impression: true,
    plan: true,
  });

  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');

  const [form, setForm] = useState<OngoingFormData>({});

  const toggle = (k: string) => setOpenSections((p) => ({ ...p, [k]: !p[k] }));

  const formChange = useMemo(
    () => ({
      chiefComplaint: (v: string) => setForm((p) => ({ ...p, chiefComplaint: v })),
      impactNotes: (v: string) => setForm((p) => ({ ...p, impactNotes: v })),
      antecedentesPrevios: (v: string) => setForm((p) => ({ ...p, antecedentesPrevios: v })),
      objectiveFindings: (v: string) => setForm((p) => ({ ...p, objectiveFindings: v })),
      clinicalImpression: (v: string) => setForm((p) => ({ ...p, clinicalImpression: v })),
      sessionNotes: (v: string) => setForm((p) => ({ ...p, sessionNotes: v })),
      plannedNextFocus: (v: string) => setForm((p) => ({ ...p, plannedNextFocus: v })),
    }),
    []
  );

  useEffect(() => {
    if (isOpen) {
      setCurrentPatientId(initialPatientId);
      setCurrentPatientName(initialPatientName);
      if (!initialPatientId) {
        setFirstName('');
        setLastName('');
        setPhone('');
        setBirthDate('');
        setChiefComplaint('');
      }
      setForm({});
      setAttachments([]);
      setAttachmentError(null);
      setError(null);
      setVertexFailed(false);
      setStandardizingVertex(false);
    }
  }, [isOpen, initialPatientId, initialPatientName]);

  const handleAddDocuments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !user?.uid) return;
    setAttachmentError(null);
    setIsUploading(true);
    for (const file of files) {
      try {
        const att = await ClinicalAttachmentService.upload(file, user.uid);
        setAttachments((prev) => [...prev, att]);
        // Documents stay only in the "Documentos" section (chips). Do not inject into the writing/dictation field.
      } catch (err) {
        logger.error('OngoingPatientIntakeModal upload', err);
        setAttachmentError(err instanceof Error ? err.message : t('shell.workWithPatients.ongoingForm.errorUploadFailed'));
      }
    }
    setIsUploading(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  if (!isOpen) return null;

  const getFormData = (): OngoingFormData => ({
    ...form,
    chiefComplaint: form.chiefComplaint || chiefComplaint,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let patientId = currentPatientId;

    if (isNewPatient && !patientId) {
      const fn = firstName.trim();
      const ln = lastName.trim();
      const ph = phone.trim();
      const bd = birthDate.trim();
      const cc = (form.chiefComplaint ?? chiefComplaint).trim();
      if (!fn || !ln) {
        setError(t('shell.workWithPatients.ongoingForm.errorFirstNameLastName'));
        return;
      }
      if (!ph) {
        setError(t('shell.workWithPatients.ongoingForm.errorPhoneRequired'));
        return;
      }
      if (!bd) {
        setError(t('shell.workWithPatients.ongoingForm.errorBirthDateRequired'));
        return;
      }
      if (cc.length < MIN_FIELD) {
        setError(t('shell.workWithPatients.ongoingForm.errorChiefComplaintRequired'));
        return;
      }
      setSubmitting(true);
      try {
        const auth = getAuth();
        if (!auth.currentUser) throw new Error('User not authenticated');
        const fullName = `${fn} ${ln}`.trim();
        patientId = await patientsRepo.createPatient({
          ownerUid: auth.currentUser.uid,
          status: 'active',
          firstName: fn,
          lastName: ln,
          fullName,
          chiefComplaint: cc,
          phone: ph,
          birthDate: bd,
          dateOfBirth: bd,
          clinical: { diagnoses: [], comorbidities: [], allergies: [] },
        });
        setCurrentPatientId(patientId);
        setCurrentPatientName(fullName);
        setForm((prev) => ({ ...prev, chiefComplaint: cc, dateOfBirth: bd }));
      } catch (err) {
        logger.error('OngoingPatientIntakeModal createPatient', err);
        setError(err instanceof Error ? err.message : t('shell.workWithPatients.ongoingForm.errorCreatePatient'));
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    if (!patientId) return;

    const data = getFormData();
    if (!hasAllRequiredForBaseline(data)) {
      setError(t('shell.workWithPatients.ongoingForm.errorAllFieldsRequired'));
      return;
    }

    const fallbackSoap = ongoingFormToBaselineSOAP(data);
    if (isPlanGeneric(fallbackSoap.plan)) {
      setError(t('shell.workWithPatients.ongoingForm.errorPlanGeneric'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let soap = fallbackSoap;
      if (!vertexFailed) {
        const documentsText = attachments
          .map((a) => a.extractedText)
          .filter((t): t is string => Boolean(t && t.trim()))
          .join('\n\n');
        setStandardizingVertex(true);
        try {
          soap = await generateBaselineSOAPFromOngoingIntake(
            {
              chiefComplaint: data.chiefComplaint,
              painPresent: data.painPresent,
              painNPRS: data.painNPRS,
              impactNotes: data.impactNotes,
              antecedentesPrevios: data.antecedentesPrevios,
              objectiveFindings: data.objectiveFindings,
              clinicalImpression: data.clinicalImpression,
              sessionNotes: data.sessionNotes,
              plannedNextFocus: data.plannedNextFocus,
            },
            documentsText || undefined
          );
        } catch (vertexErr) {
          logger.error('OngoingPatientIntakeModal Vertex standardize', vertexErr);
          setError(t('shell.workWithPatients.ongoingForm.errorVertexFailed'));
          setVertexFailed(true);
          setStandardizingVertex(false);
          setSubmitting(false);
          return;
        } finally {
          setStandardizingVertex(false);
        }
      } else {
        setVertexFailed(false);
      }

      const baselineId = await createBaselineFromMinimalSOAP({
        patientId,
        soap,
        createdBy: user?.uid ?? '',
        source: 'ongoing_intake',
      });
      await PatientService.updatePatient(patientId, { activeBaselineId: baselineId });
      onSuccess(patientId, soap, currentPatientName ?? initialPatientName);
      onClose();
    } catch (err) {
      logger.error('OngoingPatientIntakeModal createBaseline/updatePatient', err);
      setError(err instanceof Error ? err.message : t('shell.workWithPatients.ongoingForm.errorCreateBaseline'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-blue" />
            <h2 className="text-xl font-semibold text-slate-900 font-apple">
              {t('shell.workWithPatients.ongoingFirstTime')}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" disabled={submitting} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {(currentPatientName ?? initialPatientName) && (
          <p className="px-5 pt-1 text-sm text-slate-600 font-apple">
            {t('shell.workWithPatients.ongoingForm.patientLabel')}: <span className="font-medium">{currentPatientName ?? initialPatientName}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>
            )}
            <p className="text-sm text-slate-600">{t('shell.workWithPatients.ongoingForm.allFieldsRequiredHint')}</p>

            {isNewPatient && (
              <Collapsible title={t('shell.workWithPatients.ongoingForm.sectionPatientRecord')} open={openSections.patientRecord} onToggle={() => toggle('patientRecord')}>
                <Input label={t('shell.workWithPatients.ongoingForm.firstName')} value={firstName} onChange={setFirstName} optional={false} required submitting={submitting} optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')} dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')} />
                <Input label={t('shell.workWithPatients.ongoingForm.lastName')} value={lastName} onChange={setLastName} optional={false} required submitting={submitting} optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')} dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')} />
                <Input label={t('shell.workWithPatients.ongoingForm.phone')} value={phone} onChange={setPhone} placeholder={t('shell.workWithPatients.ongoingForm.phonePlaceholder')} optional={false} required submitting={submitting} optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')} dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')} />
                <Input label={t('shell.workWithPatients.ongoingForm.dateOfBirth')} value={birthDate} onChange={setBirthDate} type="date" optional={false} required submitting={submitting} optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')} dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')} />
              </Collapsible>
            )}

            <Collapsible title={t('shell.workWithPatients.ongoingForm.sectionChiefComplaintSubjective')} open={true} onToggle={() => toggle('subjective')}>
              <Input
                label={t('shell.workWithPatients.ongoingForm.primaryConcern')}
                value={form.chiefComplaint ?? chiefComplaint}
                onChange={formChange.chiefComplaint}
                placeholder={t('shell.workWithPatients.ongoingForm.primaryConcernPlaceholder')}
                optional={false}
                withDictation
                submitting={submitting}
                optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')}
                dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 shrink-0">
                  <input
                    type="checkbox"
                    checked={form.painPresent ?? false}
                    onChange={(e) => setForm((p) => ({ ...p, painPresent: e.target.checked }))}
                    disabled={submitting}
                  />
                  <span className="text-sm text-slate-700">{t('shell.workWithPatients.ongoingForm.pain')}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.painNPRS != null ? String(form.painNPRS) : ''}
                  onChange={(e) => setForm((p) => ({ ...p, painNPRS: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                  placeholder={t('shell.workWithPatients.ongoingForm.nprsPlaceholder')}
                  disabled={submitting || !form.painPresent}
                  className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <TextArea
                label={t('shell.workWithPatients.ongoingForm.impactNotes')}
                value={form.impactNotes ?? ''}
                onChange={formChange.impactNotes}
                placeholder={t('shell.workWithPatients.ongoingForm.impactNotesPlaceholder')}
                rows={2}
                optional={false}
                withDictation
                submitting={submitting}
                optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')}
                dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')}
              />
            </Collapsible>

            <Collapsible title={t('shell.workWithPatients.ongoingForm.sectionPreviousHistory')} open={openSections.antecedentes} onToggle={() => toggle('antecedentes')}>
              <TextArea
                label={t('shell.workWithPatients.ongoingForm.historyImagingOnset')}
                value={form.antecedentesPrevios ?? ''}
                onChange={formChange.antecedentesPrevios}
                placeholder={t('shell.workWithPatients.ongoingForm.historyPlaceholder')}
                rows={2}
                optional={false}
                withDictation
                submitting={submitting}
                optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')}
                dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')}
              />
              <p className="text-xs text-slate-500 font-apple font-light mb-2">
                {t('shell.workWithPatients.ongoingForm.documentsMedicalEmrHint')}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  {t('shell.workWithPatients.ongoingForm.documents')}
                </span>
                <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-100 cursor-pointer transition disabled:opacity-50">
                  <UploadCloud className="w-4 h-4" />
                  {isUploading ? t('shell.workWithPatients.ongoingForm.uploading') : t('shell.workWithPatients.ongoingForm.addDocuments')}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,text/plain,.txt,.rtf,.doc,.docx"
                    className="hidden"
                    onChange={handleAddDocuments}
                    disabled={isUploading || submitting}
                  />
                </label>
              </div>
              {attachmentError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{attachmentError}</div>
              )}
              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('shell.workWithPatients.ongoingForm.processingFile')}
                </div>
              )}
              {attachments.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <li key={a.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      <span className="truncate max-w-[140px]">{a.name}</span>
                      <button type="button" onClick={() => removeAttachment(a.id)} className="text-slate-400 hover:text-rose-600" aria-label={t('shell.workWithPatients.ongoingForm.removeAria')}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Collapsible>

            <Collapsible title={t('shell.workWithPatients.ongoingForm.sectionObjective')} open={openSections.objective} onToggle={() => toggle('objective')}>
              <TextArea
                label={t('shell.workWithPatients.ongoingForm.findingsLabel')}
                value={form.objectiveFindings ?? ''}
                onChange={formChange.objectiveFindings}
                placeholder={t('shell.workWithPatients.ongoingForm.findingsPlaceholder')}
                rows={2}
                optional={false}
                withDictation
                submitting={submitting}
                optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')}
                dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')}
              />
            </Collapsible>

            <Collapsible title={t('shell.workWithPatients.ongoingForm.sectionClinicalImpression')} open={openSections.impression} onToggle={() => toggle('impression')}>
              <TextArea label={t('shell.workWithPatients.ongoingForm.clinicalImpressionLabel')} value={form.clinicalImpression ?? ''} onChange={formChange.clinicalImpression} placeholder={t('shell.workWithPatients.ongoingForm.clinicalImpressionPlaceholder')} rows={2} optional={false} withDictation submitting={submitting} optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')} dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')} />
            </Collapsible>

            <Collapsible title={t('shell.workWithPatients.ongoingForm.sectionPlanNextFocus')} open={openSections.plan} onToggle={() => toggle('plan')}>
              <TextArea
                label={t('shell.workWithPatients.ongoingForm.sessionNotes')}
                value={form.sessionNotes ?? ''}
                onChange={formChange.sessionNotes}
                placeholder={t('shell.workWithPatients.ongoingForm.sessionNotesPlaceholder')}
                optional={false}
                withDictation
                submitting={submitting}
                optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')}
                dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')}
              />
              <TextArea
                label={t('shell.workWithPatients.ongoingForm.plannedNextFocus')}
                value={form.plannedNextFocus ?? ''}
                onChange={formChange.plannedNextFocus}
                placeholder={t('shell.workWithPatients.ongoingForm.plannedNextFocusPlaceholder')}
                rows={2}
                optional={false}
                withDictation
                submitting={submitting}
                optionalLabel={t('shell.workWithPatients.ongoingForm.optionalLabel')}
                dictateTitle={t('shell.workWithPatients.ongoingForm.dictateTitle')}
              />
            </Collapsible>
          </div>

          <div className="p-5 border-t flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50" disabled={submitting}>
              {t('shell.workWithPatients.ongoingCancel')}
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                (isNewPatient && (!firstName.trim() || !lastName.trim() || !phone.trim() || !birthDate)) ||
                !hasAllRequiredForBaseline(getFormData())
              }
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {standardizingVertex ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('shell.workWithPatients.ongoingForm.standardizingWithAI')}
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('shell.workWithPatients.ongoingCreatingBaseline')}
                </>
              ) : vertexFailed ? (
                t('shell.workWithPatients.ongoingForm.saveWithoutStandardize')
              ) : (
                t('shell.workWithPatients.ongoingCreateBaselineAndStart')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const OngoingPatientIntakeModal = React.memo(OngoingPatientIntakeModalInner);
