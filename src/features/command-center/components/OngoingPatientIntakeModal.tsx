/**
 * Ongoing Patient Intake Modal — Baseline-oriented
 *
 * Minimal form for what baseline needs: S/O/A/P.
 * Previous history section includes Add documents for images and reports.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, ChevronDown, ChevronUp, UploadCloud, Loader2, Paperclip } from 'lucide-react';
import { DictationButton } from '@/components/ui/DictationButton';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { createBaselineFromMinimalSOAP } from '@/services/clinicalBaselineService';
import PatientService from '@/services/patientService';
import { patientsRepo } from '@/repositories/patientsRepo';
import { ClinicalAttachmentService, ClinicalAttachment } from '@/services/clinicalAttachmentService';
import logger from '@/shared/utils/logger';
import {
  ongoingFormToBaselineSOAP,
  hasMinimumForBaseline,
  isPlanGeneric,
  type OngoingFormData,
} from '../utils/ongoingFormToBaselineSOAP';

const MIN_FIELD = 3;

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

export const OngoingPatientIntakeModal: React.FC<OngoingPatientIntakeModalProps> = ({
  isOpen,
  onClose,
  patientId: initialPatientId,
  patientName: initialPatientName,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const excerpt = att.extractedText?.trim();
        if (excerpt) {
          setForm((prev) => {
            const curr = prev.antecedentesPrevios ?? '';
            const sep = curr ? '\n\n' : '';
            return { ...prev, antecedentesPrevios: curr + sep + `[${att.name}]\n${excerpt.slice(0, 2000)}` };
          });
        } else {
          setForm((prev) => {
            const curr = prev.antecedentesPrevios ?? '';
            const sep = curr ? '\n\n' : '';
            return { ...prev, antecedentesPrevios: curr + sep + `[Attached: ${att.name}]` };
          });
        }
      } catch (err) {
        logger.error('OngoingPatientIntakeModal upload', err);
        setAttachmentError(err instanceof Error ? err.message : 'Upload failed');
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
        setError('First and last name are required.');
        return;
      }
      if (!ph) {
        setError('Phone is required for consent.');
        return;
      }
      if (!bd) {
        setError('Date of birth is required.');
        return;
      }
      if (cc.length < MIN_FIELD) {
        setError('Chief complaint is required.');
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
        setError(err instanceof Error ? err.message : 'Failed to create patient.');
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    if (!patientId) return;

    const data = getFormData();
    if (!hasMinimumForBaseline(data)) {
      setError(
        'To create a baseline and start follow-up: add Chief complaint and either Clinical impression or Plan/next focus.'
      );
      return;
    }

    const soap = ongoingFormToBaselineSOAP(data);
    if (isPlanGeneric(soap.plan)) {
      setError('Plan must be specific (e.g. "Continue HEP 2×/day; reassess in 2 weeks"), not generic.');
      return;
    }

    setSubmitting(true);
    try {
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
      setError(err instanceof Error ? err.message : 'Failed to create baseline.');
    } finally {
      setSubmitting(false);
    }
  };

  const Input = ({
    label,
    value,
    onChange,
    placeholder,
    optional = true,
    withDictation = false,
    ...rest
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    optional?: boolean;
    withDictation?: boolean;
    [k: string]: unknown;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
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
          <DictationButton value={value} onChange={onChange} disabled={submitting} title="Dictate" />
        )}
      </div>
    </div>
  );

  const TextArea = ({
    label,
    value,
    onChange,
    placeholder,
    rows = 2,
    optional = true,
    withDictation = false,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    optional?: boolean;
    withDictation?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
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
          <DictationButton value={value} onChange={onChange} disabled={submitting} title="Dictate" className="self-start" />
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-blue" />
            <h2 className="text-xl font-semibold text-slate-900 font-apple">
              Ongoing patient, first time in AiDuxCare
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" disabled={submitting} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {(currentPatientName ?? initialPatientName) && (
          <p className="px-5 pt-1 text-sm text-slate-600 font-apple">
            Patient: <span className="font-medium">{currentPatientName ?? initialPatientName}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>
            )}
            <p className="text-sm text-slate-600">Fill what you have. Chief complaint + (impression or plan) needed to create baseline and start follow-up.</p>

            {isNewPatient && (
              <Collapsible title="Patient record" open={openSections.patientRecord} onToggle={() => toggle('patientRecord')}>
                <Input label="First Name" value={firstName} onChange={setFirstName} optional={false} required />
                <Input label="Last Name" value={lastName} onChange={setLastName} optional={false} required />
                <Input label="Phone" value={phone} onChange={setPhone} placeholder="+1 (555) 123-4567" optional={false} required />
                <Input label="Date of Birth" value={birthDate} onChange={setBirthDate} type="date" optional={false} required />
              </Collapsible>
            )}

            <Collapsible title="Chief complaint & subjective" open={true} onToggle={() => toggle('subjective')}>
              <Input
                label="Primary concern"
                value={form.chiefComplaint ?? chiefComplaint}
                onChange={(v) => setForm((p) => ({ ...p, chiefComplaint: v }))}
                placeholder="e.g. Low back pain, 6 months"
                withDictation
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 shrink-0">
                  <input
                    type="checkbox"
                    checked={form.painPresent ?? false}
                    onChange={(e) => setForm((p) => ({ ...p, painPresent: e.target.checked }))}
                    disabled={submitting}
                  />
                  <span className="text-sm text-slate-700">Pain</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.painNPRS != null ? String(form.painNPRS) : ''}
                  onChange={(e) => setForm((p) => ({ ...p, painNPRS: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                  placeholder="NPRS 0–10"
                  disabled={submitting || !form.painPresent}
                  className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <TextArea
                label="Impact notes"
                value={form.impactNotes ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, impactNotes: v }))}
                placeholder="Pain description, aggravating/easing factors, limitations, goals"
                rows={2}
                withDictation
              />
            </Collapsible>

            <Collapsible title="Previous history" open={openSections.antecedentes} onToggle={() => toggle('antecedentes')}>
              <TextArea
                label="History, imaging, onset"
                value={form.antecedentesPrevios ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, antecedentesPrevios: v }))}
                placeholder="Medical history, imaging, onset, relevant context…"
                rows={2}
                withDictation
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  Documents
                </span>
                <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-100 cursor-pointer transition disabled:opacity-50">
                  <UploadCloud className="w-4 h-4" />
                  {isUploading ? 'Uploading…' : 'Add documents'}
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
                  Processing file…
                </div>
              )}
              {attachments.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <li key={a.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      <span className="truncate max-w-[140px]">{a.name}</span>
                      <button type="button" onClick={() => removeAttachment(a.id)} className="text-slate-400 hover:text-rose-600" aria-label="Remove">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Collapsible>

            <Collapsible title="Objective" open={openSections.objective} onToggle={() => toggle('objective')}>
              <TextArea
                label="Findings (observation, ROM, strength, neuro)"
                value={form.objectiveFindings ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, objectiveFindings: v }))}
                placeholder="Observation, ROM, strength, neurological findings…"
                rows={2}
                withDictation
              />
            </Collapsible>

            <Collapsible title="Clinical impression" open={openSections.impression} onToggle={() => toggle('impression')}>
              <TextArea label="Findings suggest… (no diagnosis)" value={form.clinicalImpression ?? ''} onChange={(v) => setForm((p) => ({ ...p, clinicalImpression: v }))} placeholder="Interpretative, not diagnostic" rows={2} withDictation />
            </Collapsible>

            <Collapsible title="Plan / next focus" open={openSections.plan} onToggle={() => toggle('plan')}>
              <TextArea
                label="Session notes"
                value={form.sessionNotes ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, sessionNotes: v }))}
                placeholder="Focus of session, advice given"
                withDictation
              />
              <TextArea
                label="Planned next focus"
                value={form.plannedNextFocus ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, plannedNextFocus: v }))}
                placeholder="e.g. Continue HEP 2×/day; reassess in 2 weeks"
                rows={2}
                withDictation
              />
              <p className="text-xs text-slate-500">Chief complaint + (impression or plan) needed to create baseline.</p>
            </Collapsible>
          </div>

          <div className="p-5 border-t flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                (isNewPatient && (!firstName.trim() || !lastName.trim() || !phone.trim() || !birthDate)) ||
                !hasMinimumForBaseline(getFormData())
              }
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Creating baseline…' : 'Create baseline & start session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
