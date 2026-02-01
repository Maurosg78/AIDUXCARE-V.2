import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ClinicalAssistantPanel from "../../shared/components/Assistant/ClinicalAssistantPanel";

import { PatientHeaderCard } from './components/PatientHeaderCard';
import { LastTherapyCard } from './components/LastTherapyCard';
import { usePatientCore } from './hooks/usePatientCore';
import { useActiveEpisode } from './hooks/useActiveEpisode';
import { useLastEncounter } from './hooks/useLastEncounter';
import { usePatientVisits } from './hooks/usePatientVisits';
import { PatientService } from '@/services/patientService';
import { createBaseline } from '@/services/clinicalBaselineService';
import { useAuth } from '@/hooks/useAuth';

export const PatientDashboardPage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  // TODO: Implementar lógica para pacientes nuevos con searchParams

  // Hooks de datos
  const patientCore = usePatientCore(patientId!);
  const activeEpisode = useActiveEpisode(patientId!);
  const lastEncounter = useLastEncounter(patientId!);
  const patientVisits = usePatientVisits(patientId!);

  // WO-AUTO-BASELINE-01: Baseline effective = activeBaselineId OR at least one finalized initial SOAP.
  const [hasActiveBaseline, setHasActiveBaseline] = useState(false);
  const [baselineRecoveryLoading, setBaselineRecoveryLoading] = useState(false);
  const [baselineRecoveryError, setBaselineRecoveryError] = useState<string | null>(null);
  useEffect(() => {
    const checkBaseline = async () => {
      if (!patientId) return;
      const patient = await PatientService.getPatientById(patientId);
      setHasActiveBaseline(!!patient?.activeBaselineId);
    };
    checkBaseline();
  }, [patientId]);

  // WO-DASHBOARD-01 recovery: set baseline from last SOAP when note exists but activeBaselineId was never set (e.g. "Close Initial Assessment" was skipped or failed).
  const handleSetBaselineFromLastSOAP = async () => {
    const initialVisit = patientVisits.data?.find((v) => v.type === 'initial');
    if (!initialVisit?.soap || !patientId || !user?.uid) return;
    setBaselineRecoveryLoading(true);
    setBaselineRecoveryError(null);
    try {
      const baselineId = await createBaseline({
        patientId,
        sourceSoapId: initialVisit.id,
        sourceSessionId: initialVisit.sessionIdForResume || initialVisit.id,
        snapshot: {
          primaryAssessment: initialVisit.soap.assessment ?? '',
          keyFindings: [initialVisit.soap.subjective ?? '', initialVisit.soap.objective ?? ''].filter(Boolean),
          planSummary: initialVisit.soap.plan ?? '',
        },
        createdBy: user.uid,
      });
      await PatientService.updatePatient(patientId, { activeBaselineId: baselineId });
      setHasActiveBaseline(true);
    } catch (e) {
      setBaselineRecoveryError(e instanceof Error ? e.message : 'Failed to set baseline.');
    } finally {
      setBaselineRecoveryLoading(false);
    }
  };

  // const pendingReportsCount = usePendingReportsCountByPatient(patientId!); // TODO: Mostrar en UI

  // Estados para modales
  // const [showNewEpisodeModal, setShowNewEpisodeModal] = useState(false); // TODO: Implementar modal
  // const [showAudioRecording, setShowAudioRecording] = useState(false); // TODO: Implementar grabación

  if (!patientId) {
    return <div>ID de paciente no válido</div>;
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
              Error al cargar paciente
            </h1>
            <p className="text-slate-600 mb-4">
              {patientCore.error.message}
            </p>
            <button
              onClick={() => navigate('/command-center')}
              className="btn-primary"
            >
              Back to Command Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  const patient = patientCore.data!;
  const hasActiveEpisode = !!activeEpisode.data;
  const hasPreviousEncounters = !!lastEncounter.data;
  const isEstablishedPatient = hasActiveEpisode || hasPreviousEncounters;

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
              ← Back to Command Center
            </button>
            <h1 className="text-xl font-semibold text-slate-900">Patient History</h1>
            <div className="w-40"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
              <div className="text-2xl font-bold text-slate-900">{patientVisits.data?.length || 0}</div>
              <div className="text-xs text-slate-600 mt-1">Total Visits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {patientVisits.data?.filter(v =>
                  (v.status === 'completed' || v.status === 'signed') &&
                  v.soapNote?.status === 'finalized'
                ).length || 0}
              </div>
              <div className="text-xs text-slate-600 mt-1">Completed</div>
            </div>
            <div className="text-center">
              {(() => {
                const hasClosedInitial = patientVisits.data?.some(v =>
                  v.type === 'initial' &&
                  v.soapNote?.status === 'finalized' &&
                  hasActiveBaseline
                );
                const hasInitialPending = patientVisits.data?.some(v => v.type === 'initial');
                const symbol = hasClosedInitial ? '✓' : hasInitialPending ? '⟳' : '?';
                const colorClass = hasClosedInitial ? 'text-green-600' : hasInitialPending ? 'text-yellow-600' : 'text-yellow-600';
                return (
                  <>
                    <div className={`text-2xl font-bold ${colorClass}`}>{symbol}</div>
                    <div className="text-xs text-slate-600 mt-1">Initial Eval</div>
                  </>
                );
              })()}
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-900">
                {patientVisits.data && patientVisits.data.length > 0
                  ? new Date(patientVisits.data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Never'
                }
              </div>
              <div className="text-xs text-slate-600 mt-1">Last Visit</div>
            </div>
          </div>
        </div>

        {/* Visit History Timeline */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Visit History</h2>
            <button
              onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}`)}
              className="bg-brand-in-500 hover:bg-brand-in-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Start New Evaluation
            </button>
          </div>

          {patientVisits.loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg"></div>
              ))}
            </div>
          ) : patientVisits.data && patientVisits.data.length > 0 ? (
            <div className="space-y-4">
              {patientVisits.data.map((visit) => {
                // WO-STATE-ALIGN-01: Resumible = initial + SOAP not finalized + session/encounter (id is sessionId)
                const isResumableInitial = visit.type === 'initial' && visit.soapNote?.status !== 'finalized' && (visit.source === 'session' || visit.source === 'encounter');
                // Single source of truth: initial closed = hasActiveBaseline (from "Close Initial Assessment" button). Don't show Pending Closure when baseline says closed.
                const initialClosedByBaseline =
                  visit.type === 'initial' && (hasActiveBaseline || visit.soapNote?.status === 'finalized');
                const showPendingClosure = (visit.status === 'draft' || (visit.status === 'completed' && visit.soapNote?.status !== 'finalized')) && !initialClosedByBaseline;
                const handleVisitClick = () => {
                  if (visit.source === 'consultation') {
                    navigate(`/notes/${visit.id}`);
                  } else if (isResumableInitial) {
                    navigate(`/workflow?type=initial&patientId=${patientId}&sessionId=${visit.id}&resume=true`);
                  } else {
                    // Encounter/session already finalized — could open detail; for now no-op
                    console.log('View encounter/session:', visit.id);
                  }
                };
                return (
                <div
                  key={visit.id}
                  onClick={handleVisitClick}
                  className="bg-slate-50 rounded-lg border border-slate-200 p-4 hover:border-brand-in-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          visit.type === 'initial' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-sm font-semibold text-slate-900">
                          {visit.type === 'initial' ? 'Initial Evaluation' : 'Follow-up Visit'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(visit.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        {showPendingClosure && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            Pending Closure
                          </span>
                        )}
                        {initialClosedByBaseline && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Closed
                          </span>
                        )}
                        {visit.status === 'signed' && !initialClosedByBaseline && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Signed
                          </span>
                        )}
                        {visit.type === 'follow-up' && visit.soapNote?.status === 'finalized' && !showPendingClosure && visit.status !== 'signed' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Closed
                          </span>
                        )}
                      </div>

                      {visit.chiefComplaint && (
                        <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                          <span className="font-medium">Chief Complaint:</span> {visit.chiefComplaint}
                        </p>
                      )}

                      {visit.diagnosis && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-1">
                          <span className="font-medium">Assessment:</span> {visit.diagnosis}
                        </p>
                      )}

                      {visit.soap?.plan && (
                        <p className="text-sm text-slate-600 line-clamp-1">
                          <span className="font-medium">Plan:</span> {visit.soap.plan.substring(0, 100)}...
                        </p>
                      )}
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (visit.source === 'consultation') {
                            navigate(`/notes/${visit.id}`);
                          } else if (isResumableInitial) {
                            navigate(`/workflow?type=initial&patientId=${patientId}&sessionId=${visit.id}&resume=true`);
                          }
                        }}
                        className="text-sm text-brand-in-500 hover:text-brand-in-600 font-medium"
                      >
                        View SOAP →
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600 mb-2">No visit history found</p>
              <p className="text-sm text-slate-500 mb-4">Initial evaluations and follow-up visits will appear here</p>
              <button
                onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}`)}
                className="bg-brand-in-500 hover:bg-brand-in-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
              >
                Start Initial Evaluation
              </button>
            </div>
          )}
        </div>

        {/* Active Episode Info (if exists) */}
            {activeEpisode.data && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Treatment Plan</h2>
                  {activeEpisode.data.goals?.shortTerm && activeEpisode.data.goals.shortTerm.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Short-term Goals:</h3>
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
                <h3 className="text-sm font-medium text-slate-700 mb-2">Long-term Goals:</h3>
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

        {/* Quick Actions — WO-AUTO-BASELINE-01: hasEffectiveBaseline = activeBaselineId OR finalized initial SOAP; no "One step left" when effective baseline. */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          {(() => {
            const hasFinalizedInitialSOAP =
              (patientVisits.data?.some(
                (v) => v.type === 'initial' && v.soapNote?.status === 'finalized'
              ) ?? false);
            const hasEffectiveBaseline = hasActiveBaseline || hasFinalizedInitialSOAP;
            const initialVisit = patientVisits.data?.find((v) => v.type === 'initial');
            const hasInitial = !!initialVisit;
            const initialNeedsClosure = hasInitial && initialVisit.soapNote?.status !== 'finalized';
            const initialFinalizedButNotClosed =
              hasInitial && initialVisit.soapNote?.status === 'finalized' && !hasActiveBaseline;
            const resumeSessionId = initialVisit?.sessionIdForResume ?? initialVisit?.id;
            const pendingFollowUpVisit = patientVisits.data?.find(
              (v) => v.type === 'follow-up' && v.soapNote?.status !== 'finalized'
            );
            const hasClosedInitial = hasEffectiveBaseline;
            const canStartNewFollowUp = hasClosedInitial && !pendingFollowUpVisit;

            return (
              <>
                {initialFinalizedButNotClosed && !hasEffectiveBaseline && (
                  <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 space-y-1">
                    <p className="font-medium">One step left: finalize the baseline</p>
                    <p>
                      Your initial SOAP note is saved. To allow follow-up visits, the system still needs to record this assessment as the official baseline. You can do it here (one click) or open the workflow and press &quot;Close Initial Assessment&quot; there.
                    </p>
                    {baselineRecoveryError && (
                      <p className="text-red-700 text-xs mt-1">{baselineRecoveryError}</p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!hasInitial && (
                  <button
                    onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}`)}
                    className="bg-brand-in-500 hover:bg-brand-in-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Start Initial Evaluation
                  </button>
                )}

                {initialNeedsClosure && resumeSessionId && (
                  <button
                    onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}&sessionId=${resumeSessionId}&resume=true`)}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Resume Initial Assessment
                  </button>
                )}

                {initialFinalizedButNotClosed && !hasEffectiveBaseline && (
                  <>
                    <button
                      onClick={handleSetBaselineFromLastSOAP}
                      disabled={baselineRecoveryLoading || !user?.uid}
                      className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                      title="Set baseline from last SOAP note (no need to open workflow)"
                    >
                      {baselineRecoveryLoading ? 'Setting baseline…' : 'Set baseline from last SOAP (one click)'}
                    </button>
                    {resumeSessionId && (
                      <button
                        onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}&sessionId=${resumeSessionId}&resume=true`)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-3 px-4 rounded-lg transition-colors"
                        title="Open workflow to finalize the baseline (one click)"
                      >
                        Open workflow → Close Initial Assessment
                      </button>
                    )}
                  </>
                )}

                {hasClosedInitial && pendingFollowUpVisit && (
                  <button
                    onClick={() => navigate(`/workflow?type=follow-up&patientId=${patientId}`)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Complete Pending Follow-up
                  </button>
                )}

                {canStartNewFollowUp && (
                  <button
                    onClick={() => navigate(`/workflow?type=follow-up&patientId=${patientId}`)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Start Follow-up Visit
                  </button>
                )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Assistant clínico (panel básico) */}
        {lastEncounter.data && (
          <div className="mt-6">
            <ClinicalAssistantPanel
              patientId={patientId!}
              visitId={lastEncounter.data.id}
            />
          </div>
        )}
      </div>

      {/* TODO: Modales para episodio nuevo y grabación de audio */}
    </div>
  );
};
