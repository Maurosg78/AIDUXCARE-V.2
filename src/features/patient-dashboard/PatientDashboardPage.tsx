import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Play, History, Award, ChevronDown } from 'lucide-react';

import CertificateEsModal from '@/components/CertificateEsModal';
import { isSpainPilot } from '@/core/pilotDetection';
import { useProfessionalProfile } from '@/context/ProfessionalProfileContext';

import { PatientHeaderCard } from './components/PatientHeaderCard';
import { LastTherapyCard } from './components/LastTherapyCard';
import { usePatientCore } from './hooks/usePatientCore';
import { useActiveEpisode } from './hooks/useActiveEpisode';
import { useLastEncounter } from './hooks/useLastEncounter';
import { usePatientVisits } from './hooks/usePatientVisits';
import { PatientService } from '@/services/patientService';
import {
  archivePatientVisitRecord,
  type ArchivableVisitSource,
} from '@/services/patientVisitArchiveService';

type EditablePatientFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const createEmptyPatientForm = (): EditablePatientFormState => {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  };
};

/** Visit row actions: shared tap target + padding; variants below match command-center / brand-in patterns. */
const VISIT_ACTION_SHELL =
  'inline-flex items-center justify-center min-h-9 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export const PatientDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // TODO: Implementar lógica para pacientes nuevos con searchParams

  // Hooks de datos
  const patientCore = usePatientCore(patientId!);
  const activeEpisode = useActiveEpisode(patientId!);
  const lastEncounter = useLastEncounter(patientId!);
  const patientVisits = usePatientVisits(patientId!);
  const { profile: professionalProfile } = useProfessionalProfile();

  // WO-AUTO-BASELINE-01: Baseline effective = activeBaselineId OR at least one finalized initial SOAP.
  const [hasActiveBaseline, setHasActiveBaseline] = useState(false);
  const [selectedSOAP, setSelectedSOAP] = useState<{subjective?:string;objective?:string;assessment?:string;plan?:string;date?:string} | null>(null);
  const [archivedVisitIds, setArchivedVisitIds] = useState<Set<string>>(() => new Set());
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState<EditablePatientFormState>(() => createEmptyPatientForm());
  const [editPatientError, setEditPatientError] = useState<string | null>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [patientDisplayOverride, setPatientDisplayOverride] = useState<Record<string, unknown> | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [expandedVisitIds, setExpandedVisitIds] = useState<Set<string>>(() => new Set());
  const [certificateSourceSOAP, setCertificateSourceSOAP] = useState<{subjective?:string;objective?:string;assessment?:string;plan?:string;date?:string} | null>(null);
  const rawVisitList = patientVisits.data ?? [];
  const visitsForDisplay = rawVisitList.filter((v) => !archivedVisitIds.has(v.id));
  const mostRecentVisitId = visitsForDisplay[0]?.id ?? '';

  useEffect(() => {
    setExpandedVisitIds(() => {
      const nextIds = new Set<string>();
      if (mostRecentVisitId) {
        nextIds.add(mostRecentVisitId);
      }
      return nextIds;
    });
  }, [patientId, mostRecentVisitId]);

  useEffect(() => {
    const checkBaseline = async () => {
      if (!patientId) return;
      const patient = await PatientService.getPatientById(patientId);
      setHasActiveBaseline(!!patient?.activeBaselineId);
    };
    checkBaseline();
  }, [patientId]);

  // const pendingReportsCount = usePendingReportsCountByPatient(patientId!); // TODO: Mostrar en UI

  // Estados para modales
  // const [showNewEpisodeModal, setShowNewEpisodeModal] = useState(false); // TODO: Implementar modal
  // const [showAudioRecording, setShowAudioRecording] = useState(false); // TODO: Implementar grabación

  if (!patientId) {
    return <div>{t('patientDashboard.invalidPatientId')}</div>;
  }

  if (patientCore.loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-48 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (patientCore.error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="card p-6 text-center">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              {t('patientDashboard.loadErrorTitle')}
            </h1>
            <p className="text-slate-600 mb-4">
              {patientCore.error.message}
            </p>
            <button
              onClick={() => navigate('/command-center')}
              className="btn-primary"
            >
              {t('shell.nav.backToCommandCenter')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const basePatient = patientCore.data!;
  const patient = patientDisplayOverride
    ? { ...basePatient, ...patientDisplayOverride }
    : basePatient;
  const hasActiveEpisode = !!activeEpisode.data;
  const hasPreviousEncounters = !!lastEncounter.data;
  const isEstablishedPatient = hasActiveEpisode || hasPreviousEncounters;
  // Ongoing only for patients not yet in AiDuxCare (no baseline, no visits). Same logic as StartSessionTwoStepModal.
  const ongoingDisabled = hasActiveBaseline || visitsForDisplay.length > 0;

  const toggleVisitExpanded = (visitId: string) => {
    setExpandedVisitIds((previousIds) => {
      const nextIds = new Set(previousIds);
      const isCurrentlyExpanded = nextIds.has(visitId);
      if (isCurrentlyExpanded) {
        nextIds.delete(visitId);
      } else {
        nextIds.add(visitId);
      }
      return nextIds;
    });
  };

  const openEditPatientModal = async () => {
    if (!patientId) {
      return;
    }

    setEditPatientError(null);

    try {
      const detailedPatient = await PatientService.getPatientById(patientId);
      const fallbackFirstName = String(patient.firstName || '').trim();
      const fallbackLastName = String(patient.lastName || '').trim();
      const fallbackEmail = String(patient.email || '').trim();
      const fallbackPhone = String(patient.phone || '').trim();
      const fallbackBirthDate = String((patient as { birthDate?: string }).birthDate || '').trim();
      const billingAddress = detailedPatient?.billingAddress;
      const nextForm = {
        firstName: String(detailedPatient?.firstName || fallbackFirstName).trim(),
        lastName: String(detailedPatient?.lastName || fallbackLastName).trim(),
        email: String(detailedPatient?.email || fallbackEmail).trim(),
        phone: String(detailedPatient?.phone || fallbackPhone).trim(),
        dateOfBirth: String(detailedPatient?.dateOfBirth || fallbackBirthDate).trim(),
        street: String(billingAddress?.street || '').trim(),
        city: String(billingAddress?.city || '').trim(),
        state: String(billingAddress?.state || '').trim(),
        zipCode: String(billingAddress?.zipCode || '').trim(),
        country: String(billingAddress?.country || '').trim(),
      };

      setEditPatientForm(nextForm);
      setIsEditPatientModalOpen(true);
    } catch (error) {
      console.error('[PatientDashboard] Failed to load patient details for edit', error);
      setEditPatientError('No se pudieron cargar los datos del paciente.');
    }
  };

  const handleEditPatientField = (field: keyof EditablePatientFormState, value: string) => {
    setEditPatientForm((previousForm) => {
      return {
        ...previousForm,
        [field]: value,
      };
    });
  };

  const handleSavePatientDetails = async () => {
    if (!patientId) {
      return;
    }

    const firstName = editPatientForm.firstName.trim();
    const lastName = editPatientForm.lastName.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = editPatientForm.email.trim();
    const phone = editPatientForm.phone.trim();
    const dateOfBirth = editPatientForm.dateOfBirth.trim();

    if (firstName === '' || lastName === '') {
      setEditPatientError('Nombre y apellido son obligatorios.');
      return;
    }

    setIsSavingPatient(true);
    setEditPatientError(null);

    try {
      const billingAddress = {
        street: editPatientForm.street.trim(),
        city: editPatientForm.city.trim(),
        state: editPatientForm.state.trim(),
        zipCode: editPatientForm.zipCode.trim(),
        country: editPatientForm.country.trim(),
      };

      await PatientService.updatePatient(patientId, {
        firstName,
        lastName,
        fullName,
        email,
        phone,
        dateOfBirth,
        billingAddress,
      });

      setPatientDisplayOverride({
        firstName,
        lastName,
        email,
        phone,
        birthDate: dateOfBirth,
      });
      setIsEditPatientModalOpen(false);
    } catch (error) {
      console.error('[PatientDashboard] Failed to save patient details', error);
      setEditPatientError('No se pudieron guardar los cambios del paciente.');
    } finally {
      setIsSavingPatient(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header — WO-DASHBOARD-01: Clear way back to Command Center */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/command-center')}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              ← {t('shell.nav.backToCommandCenter')}
            </button>
            <h1 className="text-xl font-semibold text-slate-900">{t('shell.patientHistory')}</h1>
            <div className="w-40"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={openEditPatientModal}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            Editar datos del paciente
          </button>
        </div>
        {/* Encabezado del paciente */}
        <PatientHeaderCard 
          patient={patient} 
          episode={activeEpisode.data}
          loading={patientCore.loading}
        />

        {/* Quick Info Panel */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{visitsForDisplay.length || 0}</div>
              <div className="text-xs text-slate-600 mt-1">{t('patientDashboard.totalVisits')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {visitsForDisplay.filter(v =>
                  (v.status === 'completed' || v.status === 'signed') &&
                  v.soapNote?.status === 'finalized'
                ).length || 0}
              </div>
              <div className="text-xs text-slate-600 mt-1">{t('patientDashboard.completed')}</div>
            </div>
            <div className="text-center">
              {(() => {
                const hasClosedInitial = visitsForDisplay.some(v =>
                  v.type === 'initial' &&
                  v.soapNote?.status === 'finalized' &&
                  hasActiveBaseline
                );
                const hasInitialPending = visitsForDisplay.some(v => v.type === 'initial');
                const symbol = hasClosedInitial ? '✓' : hasInitialPending ? '⟳' : '?';
                const colorClass = hasClosedInitial ? 'text-green-600' : hasInitialPending ? 'text-yellow-600' : 'text-yellow-600';
                return (
                  <>
                    <div className={`text-2xl font-bold ${colorClass}`}>{symbol}</div>
                    <div className="text-xs text-slate-600 mt-1">{t('patientDashboard.initialEval')}</div>
                  </>
                );
              })()}
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-900">
                {visitsForDisplay.length > 0
                  ? new Date(visitsForDisplay[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : t('patientDashboard.never')
                }
              </div>
              <div className="text-xs text-slate-600 mt-1">{t('patientDashboard.lastVisit')}</div>
            </div>
          </div>
        </div>

        {/* 3 clinical actions: initial, follow-up, ongoing */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('patientDashboard.clinicalActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}`)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t('shell.initialAssessment')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/workflow?type=followup&patientId=${patientId}`)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-blue/10 hover:bg-primary-blue/20 border border-primary-blue/30 text-primary-blue text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              {t('patientDashboard.followUp')}
            </button>
            <button
              type="button"
              onClick={() => !ongoingDisabled && navigate('/command-center', { state: { openOngoingForPatientId: patientId } })}
              disabled={ongoingDisabled}
              title={ongoingDisabled ? t('shell.ongoingPatientTooltipDisabled') : undefined}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary-blue/5 hover:border-primary-blue/30 text-slate-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:border-slate-200"
            >
              <History className="w-4 h-4" />
              {t('patientDashboard.ongoingPatient')}
            </button>
            {isSpainPilot() && visitsForDisplay.some(v => (v.status === 'completed' || v.status === 'signed') && v.soapNote?.status === 'finalized') && (
              <button
                type="button"
                onClick={() => {
                  setCertificateSourceSOAP(null);
                  setShowCertificateModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium transition-colors"
              >
                <Award className="w-4 h-4" />
                Certificado
              </button>
            )}
          </div>
        </div>

        {/* Visits timeline */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">{t('patientDashboard.visitHistory')}</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/notes/new?patientId=${patientId}`)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                Documentar atención pasada
              </button>
              <button
                onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}`)}
                className="bg-brand-in-500 hover:bg-brand-in-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                {t('patientDashboard.startNewEvaluation')}
              </button>
            </div>
          </div>

          {patientVisits.loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg"></div>
              ))}
            </div>
          ) : visitsForDisplay.length > 0 ? (
            <div className="space-y-4">
              {visitsForDisplay.map((visit) => {
                // WO-STATE-ALIGN-01: Resumible = initial + SOAP not finalized + session/encounter (id is sessionId)
                const isResumableInitial = visit.type === 'initial' && visit.soapNote?.status !== 'finalized' && (visit.source === 'session' || visit.source === 'encounter');
                // Single source of truth: initial closed = hasActiveBaseline (from "Close Initial Assessment" button). Don't show Pending Closure when baseline says closed.
                const initialClosedByBaseline =
                  visit.type === 'initial' && (hasActiveBaseline || visit.soapNote?.status === 'finalized');
                const showPendingClosure = (visit.status === 'draft' || (visit.status === 'completed' && visit.soapNote?.status !== 'finalized')) && !initialClosedByBaseline;
                const soapNoteStatus = visit.soapNote?.status;
                const isFinalizedSoap = soapNoteStatus === 'finalized';
                const isFamilyA = isFinalizedSoap;
                const isFamilyB = !isFinalizedSoap;
                const visitSource = visit.source;
                const canArchiveSource =
                  visitSource === 'session' ||
                  visitSource === 'encounter' ||
                  visitSource === 'consultation';
                const openSoapPreview = () => {
                  const visitSoap = visit.soap;
                  if (!visitSoap) {
                    return;
                  }
                  const visitDateLabel = visit.date?.toLocaleDateString?.() || '';
                  const nextSelectedSoap = {
                    ...visitSoap,
                    date: visitDateLabel,
                  };
                  setSelectedSOAP(nextSelectedSoap);
                };
                const navigateToResumeWorkflow = () => {
                  const isSessionSource = visit.source === 'session';
                  const sessionIdForResume = isSessionSource ? visit.id : visit.sessionIdForResume;
                  if (!sessionIdForResume) {
                    return false;
                  }
                  const workflowType = visit.type === 'follow-up' ? 'followup' : 'initial';
                  const workflowUrl = `/workflow?type=${workflowType}&patientId=${patientId}&sessionId=${sessionIdForResume}&resume=true`;
                  navigate(workflowUrl);
                  return true;
                };
                const handleVisitClick = () => {
                  if (visit.source === 'consultation') {
                    navigate(`/notes/${visit.id}`);
                  } else if (isResumableInitial) {
                    navigate(`/workflow?type=initial&patientId=${patientId}&sessionId=${visit.id}&resume=true`);
                  } else if (visit.source === 'encounter' && visit.soap) {
                    openSoapPreview();
                  }
                };
                const navigateToEditFinalizedVisit = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const source = visit.source;
                  if (source === 'consultation') {
                    const notesPath = `/notes/${visit.id}`;
                    navigate(notesPath);
                    return;
                  }
                  if (source === 'encounter') {
                    const linkedNoteId = visit.noteId;
                    const hasLinkedNoteId =
                      typeof linkedNoteId === 'string' &&
                      linkedNoteId.trim() !== '';
                    if (hasLinkedNoteId) {
                      const notesPath = `/notes/${linkedNoteId}`;
                      navigate(notesPath);
                      return;
                    }
                    openSoapPreview();
                    return;
                  }
                  if (source === 'session') {
                    const isInitialVisit = visit.type === 'initial';
                    if (isInitialVisit) {
                      const initialWorkflowUrl = `/workflow?type=initial&patientId=${patientId}&sessionId=${visit.id}&resume=true`;
                      navigate(initialWorkflowUrl);
                      return;
                    }
                    const sessionSoap = visit.soap;
                    if (sessionSoap) {
                      const sessionDateLabel = visit.date?.toLocaleDateString?.() || '';
                      setSelectedSOAP({ ...sessionSoap, date: sessionDateLabel });
                      return;
                    }
                    const followWorkflowUrl = `/workflow?type=followup&patientId=${patientId}`;
                    navigate(followWorkflowUrl);
                  }
                };
                const archiveVisitInFirestore = async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const confirmationMessage = t('patientDashboard.confirmArchiveVisit');
                  const userConfirmed = window.confirm(confirmationMessage);
                  if (!userConfirmed) {
                    return;
                  }
                  try {
                    const archivableSource = visit.source as ArchivableVisitSource;
                    const visitRowId = visit.id;
                    await archivePatientVisitRecord(visitRowId, archivableSource);
                    setArchivedVisitIds((previousIds) => {
                      const nextIds = new Set(previousIds);
                      nextIds.add(visitRowId);
                      return nextIds;
                    });
                  } catch (archiveErr) {
                    console.error('[PatientDashboard] archive visit failed', archiveErr);
                    const errMsg = t('patientDashboard.archiveVisitError');
                    window.alert(errMsg);
                  }
                };
                const isExpanded = expandedVisitIds.has(visit.id);
                const canEmitCertificate =
                  isSpainPilot() &&
                  visit.soapNote?.status === 'finalized' &&
                  !!visit.soap;
                const emitCertificateFromVisit = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const visitSoap = visit.soap;
                  if (!visitSoap) {
                    return;
                  }
                  const visitDateLabel = visit.date?.toLocaleDateString?.() ?? '';
                  const nextCertificateSourceSOAP = {
                    ...visitSoap,
                    date: visitDateLabel,
                  };
                  setCertificateSourceSOAP(nextCertificateSourceSOAP);
                  setShowCertificateModal(true);
                };
                return (
                <div
                  key={visit.id}
                  className="bg-slate-50 rounded-lg border border-slate-200 hover:border-brand-in-500 hover:shadow-md transition-all"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleVisitExpanded(visit.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        visit.type === 'initial' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                      <span className="text-sm font-semibold text-slate-900">
                        {visit.type === 'initial'
                          ? t('patientDashboard.initialEvaluation')
                          : t('patientDashboard.followUpVisit')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(visit.date).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {showPendingClosure && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          {t('patientDashboard.pendingClosure')}
                        </span>
                      )}
                      {initialClosedByBaseline && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {t('patientDashboard.closed')}
                        </span>
                      )}
                      {visit.status === 'signed' && !initialClosedByBaseline && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {t('patientDashboard.signed')}
                        </span>
                      )}
                      {visit.type === 'follow-up' && visit.soapNote?.status === 'finalized' && !showPendingClosure && visit.status !== 'signed' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {t('patientDashboard.closed')}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <div className="flex items-start justify-between pt-4">
                        <div className="flex-1">
                          {visit.chiefComplaint && (
                            <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                              <span className="font-medium">{t('patientDashboard.chiefComplaint')}:</span> {visit.chiefComplaint}
                            </p>
                          )}

                          {visit.diagnosis && (
                            <p className="text-sm text-slate-600 mb-2 line-clamp-1">
                              <span className="font-medium">{t('patientDashboard.assessment')}:</span> {visit.diagnosis}
                            </p>
                          )}

                          {visit.soap?.plan && (
                            <p className="text-sm text-slate-600 line-clamp-1">
                              <span className="font-medium">{t('patientDashboard.plan')}:</span> {visit.soap.plan.substring(0, 100)}...
                            </p>
                          )}
                        </div>

                        <div className="ml-4 flex flex-col items-end gap-2 shrink-0">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {isFamilyA ? (
                              <button
                                type="button"
                                onClick={navigateToEditFinalizedVisit}
                                className={`${VISIT_ACTION_SHELL} border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 focus-visible:ring-slate-400`}
                              >
                                {t('patientDashboard.editSoap')}
                              </button>
                            ) : null}
                            {isFamilyB && canArchiveSource ? (
                              <button
                                type="button"
                                onClick={archiveVisitInFirestore}
                                className={`${VISIT_ACTION_SHELL} border border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100/90 hover:border-rose-300 hover:text-rose-800 focus-visible:ring-rose-400`}
                              >
                                {t('patientDashboard.removeFromHistory')}
                              </button>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVisitClick();
                            }}
                            className={`${VISIT_ACTION_SHELL} border border-brand-in-200 bg-white text-brand-in-600 shadow-sm hover:bg-brand-in-50 hover:border-brand-in-300 hover:text-brand-in-700 focus-visible:ring-brand-in-400`}
                          >
                            {t('patientDashboard.viewSoap')} →
                          </button>
                        </div>
                      </div>

                      {canEmitCertificate && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={emitCertificateFromVisit}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-colors"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Emitir certificado
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600 mb-2">{t('patientDashboard.noVisitHistoryFound')}</p>
              <p className="text-sm text-slate-500 mb-4">{t('patientDashboard.noVisitHistoryBody')}</p>
              <button
                onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}`)}
                className="bg-brand-in-500 hover:bg-brand-in-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
              >
                {t('shell.startInitialAssessment')}
              </button>
              <button
                onClick={() => navigate(`/notes/new?patientId=${patientId}`)}
                className="ml-3 rounded-lg border border-slate-300 bg-white px-6 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                Documentar atención pasada
              </button>
            </div>
          )}
        </div>

        {/* Active Episode Info (if exists) */}
            {activeEpisode.data && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('patientDashboard.activeTreatmentPlan')}</h2>
                  {activeEpisode.data.goals?.shortTerm && activeEpisode.data.goals.shortTerm.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">{t('patientDashboard.shortTermGoals')}:</h3>
                      <ul className="space-y-1">
                        {activeEpisode.data.goals.shortTerm.map((goal, index) => (
                          <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-brand-in-500 mt-1">•</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {activeEpisode.data.goals?.longTerm && activeEpisode.data.goals.longTerm.length > 0 && (
                    <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">{t('patientDashboard.longTermGoals')}:</h3>
                      <ul className="space-y-1">
                        {activeEpisode.data.goals.longTerm.map((goal, index) => (
                          <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-brand-in-500 mt-1">•</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
          </div>
        )}

      </div>

      {showCertificateModal && isSpainPilot() && (() => {
        const completedVisits = visitsForDisplay.filter(v => (v.status === 'completed' || v.status === 'signed') && v.soapNote?.status === 'finalized');
        const mostRecentVisit = completedVisits[0];
        const soapAssessment = certificateSourceSOAP?.assessment || mostRecentVisit?.soap?.assessment || mostRecentVisit?.diagnosis || '';
        const patientName = `${String(patient.firstName || '').trim()} ${String(patient.lastName || '').trim()}`.trim();
        const patientBirthDate = String((patient as { birthDate?: string }).birthDate || '');
        const professionalName = professionalProfile?.fullName || professionalProfile?.displayName || '';
        const professionalLicense = professionalProfile?.licenseNumber || '';
        const professionalSpecialty = professionalProfile?.specialty || professionalProfile?.profession || '';
        return (
          <CertificateEsModal
            isOpen={showCertificateModal}
            onClose={() => {
              setShowCertificateModal(false);
              setCertificateSourceSOAP(null);
            }}
            soapAssessment={soapAssessment}
            professional={{ nombre: professionalName, numeroColegiado: professionalLicense, especialidad: professionalSpecialty }}
            patient={{ nombre: patientName, fechaNacimiento: patientBirthDate }}
            defaultClinicName={professionalProfile?.clinic?.name}
          />
        );
      })()}

      {selectedSOAP && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSOAP(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 rounded-t-2xl p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{t('patientDashboard.soapNote')}</h2>
              <button onClick={() => setSelectedSOAP(null)} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {selectedSOAP.date && <p className="text-xs text-slate-500">{t('patientDashboard.sessionDate')}: {selectedSOAP.date}</p>}
              {(['subjective','objective','assessment','plan'] as const).map(key => selectedSOAP[key] ? (
                <div key={key} className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">{t(`patientDashboard.soapSections.${key}`)}</h3>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedSOAP[key]}</p>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}
      {isEditPatientModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!isSavingPatient) {
              setIsEditPatientModalOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Editar datos del paciente</h2>
                <p className="text-sm text-slate-500">Actualiza nombre, contacto y dirección sin alterar el historial clínico.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPatientModalOpen(false)}
                className="text-2xl leading-none text-slate-400 hover:text-slate-600"
                disabled={isSavingPatient}
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="editPatientFirstName" className="mb-2 block text-sm font-medium text-slate-700">
                    Nombre
                  </label>
                  <input
                    id="editPatientFirstName"
                    type="text"
                    value={editPatientForm.firstName}
                    onChange={(event) => handleEditPatientField('firstName', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                  />
                </div>
                <div>
                  <label htmlFor="editPatientLastName" className="mb-2 block text-sm font-medium text-slate-700">
                    Apellido
                  </label>
                  <input
                    id="editPatientLastName"
                    type="text"
                    value={editPatientForm.lastName}
                    onChange={(event) => handleEditPatientField('lastName', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                  />
                </div>
                <div>
                  <label htmlFor="editPatientEmail" className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="editPatientEmail"
                    type="email"
                    value={editPatientForm.email}
                    onChange={(event) => handleEditPatientField('email', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                  />
                </div>
                <div>
                  <label htmlFor="editPatientPhone" className="mb-2 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    id="editPatientPhone"
                    type="text"
                    value={editPatientForm.phone}
                    onChange={(event) => handleEditPatientField('phone', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                  />
                </div>
                <div>
                  <label htmlFor="editPatientDateOfBirth" className="mb-2 block text-sm font-medium text-slate-700">
                    Fecha de nacimiento
                  </label>
                  <input
                    id="editPatientDateOfBirth"
                    type="date"
                    value={editPatientForm.dateOfBirth}
                    onChange={(event) => handleEditPatientField('dateOfBirth', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Dirección</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="editPatientStreet" className="mb-2 block text-sm font-medium text-slate-700">
                      Calle
                    </label>
                    <input
                      id="editPatientStreet"
                      type="text"
                      value={editPatientForm.street}
                      onChange={(event) => handleEditPatientField('street', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPatientCity" className="mb-2 block text-sm font-medium text-slate-700">
                      Ciudad
                    </label>
                    <input
                      id="editPatientCity"
                      type="text"
                      value={editPatientForm.city}
                      onChange={(event) => handleEditPatientField('city', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPatientState" className="mb-2 block text-sm font-medium text-slate-700">
                      Provincia / Estado
                    </label>
                    <input
                      id="editPatientState"
                      type="text"
                      value={editPatientForm.state}
                      onChange={(event) => handleEditPatientField('state', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPatientZipCode" className="mb-2 block text-sm font-medium text-slate-700">
                      Código postal
                    </label>
                    <input
                      id="editPatientZipCode"
                      type="text"
                      value={editPatientForm.zipCode}
                      onChange={(event) => handleEditPatientField('zipCode', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPatientCountry" className="mb-2 block text-sm font-medium text-slate-700">
                      País
                    </label>
                    <input
                      id="editPatientCountry"
                      type="text"
                      value={editPatientForm.country}
                      onChange={(event) => handleEditPatientField('country', event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                    />
                  </div>
                </div>
              </div>

              {editPatientError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editPatientError}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsEditPatientModalOpen(false)}
                disabled={isSavingPatient}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePatientDetails}
                disabled={isSavingPatient}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingPatient ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TODO: Modales para episodio nuevo y grabación de audio */}
    </div>
  );
};
