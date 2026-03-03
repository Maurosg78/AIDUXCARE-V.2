import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Play, History } from 'lucide-react';

import ClinicalAssistantPanel from "../../shared/components/Assistant/ClinicalAssistantPanel";

import { PatientHeaderCard } from './components/PatientHeaderCard';
import { LastTherapyCard } from './components/LastTherapyCard';
import { usePatientCore } from './hooks/usePatientCore';
import { useActiveEpisode } from './hooks/useActiveEpisode';
import { useLastEncounter } from './hooks/useLastEncounter';
import { usePatientVisits } from './hooks/usePatientVisits';
import { PatientService } from '@/services/patientService';

export const PatientDashboardPage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // TODO: Implementar lógica para pacientes nuevos con searchParams

  // Hooks de datos
  const patientCore = usePatientCore(patientId!);
  const activeEpisode = useActiveEpisode(patientId!);
  const lastEncounter = useLastEncounter(patientId!);
  const patientVisits = usePatientVisits(patientId!);

  // WO-AUTO-BASELINE-01: Baseline effective = activeBaselineId OR at least one finalized initial SOAP.
  const [hasActiveBaseline, setHasActiveBaseline] = useState(false);
  const [selectedSOAP, setSelectedSOAP] = useState<{subjective?:string;objective?:string;assessment?:string;plan?:string;date?:string} | null>(null);
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
  // Ongoing only for patients not yet in AiDuxCare (no baseline, no visits). Same logic as StartSessionTwoStepModal.
  const ongoingDisabled = hasActiveBaseline || (!!patientVisits.data && patientVisits.data.length > 0);

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
                  } else if (visit.source === 'encounter' && visit.soap) {
                    setSelectedSOAP({...visit.soap, date: visit.date?.toLocaleDateString?.() || ''});
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

        {/* 3 clinical actions: Initial Assessment, Follow-up, Ongoing patient */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Clinical actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate(`/workflow?type=initial&patientId=${patientId}`)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Initial Assessment
            </button>
            <button
              type="button"
              onClick={() => navigate(`/workflow?type=followup&patientId=${patientId}`)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-blue/10 hover:bg-primary-blue/20 border border-primary-blue/30 text-primary-blue text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Follow-up
            </button>
            <button
              type="button"
              onClick={() => !ongoingDisabled && navigate('/command-center', { state: { openOngoingForPatientId: patientId } })}
              disabled={ongoingDisabled}
              title={ongoingDisabled ? 'This patient already has sessions in AiDuxCare — use Initial Assessment or Follow-up' : undefined}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary-blue/5 hover:border-primary-blue/30 text-slate-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:border-slate-200"
            >
              <History className="w-4 h-4" />
              Ongoing patient
            </button>
          </div>
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

      {selectedSOAP && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSOAP(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 rounded-t-2xl p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">SOAP Note</h2>
              <button onClick={() => setSelectedSOAP(null)} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {selectedSOAP.date && <p className="text-xs text-slate-500">Session date: {selectedSOAP.date}</p>}
              {(['subjective','objective','assessment','plan'] as const).map(key => selectedSOAP[key] ? (
                <div key={key} className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">{key}</h3>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedSOAP[key]}</p>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}
      {/* TODO: Modales para episodio nuevo y grabación de audio */}
    </div>
  );
};
