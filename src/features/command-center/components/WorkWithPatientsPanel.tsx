/**
 * Work with Patients Panel
 * 
 * Sprint 3: Unified Command Centre - Rediseñado para UX optimizada
 * 
 * Flujo:
 * 1. Sin paciente: Muestra listado de pacientes para seleccionar
 * 2. Con paciente seleccionado: Muestra tarjetas de acciones (colapsadas)
 * 3. Click en tarjeta: Expande opciones específicas
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  History,
  ChevronDown,
  ChevronUp,
  UserPlus,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Patient } from '@/services/patientService';
import { SessionType, SessionTypeService } from '@/services/sessionTypeService';
import { usePatientHistory } from '../hooks/usePatientHistory';
import { useToast } from '@/hooks/useToast';

export interface WorkWithPatientsPanelProps {
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onStartSession: (sessionType: SessionType) => void;
  onViewHistory: () => void;
  onViewAnalytics: () => void;
  onOpenPatientSelector: () => Promise<Patient | null>;
  onCreatePatient: () => void;
  /** Opens Ongoing Patient Intake form (baseline + then workflow follow-up) — when patient already selected */
  onOngoingPatientFirstTime?: () => void;
  /** When no patient selected: start Ongoing flow (select or create patient, then intake form) */
  onStartOngoingNoPatient?: () => void;
  /** When no patient selected: single entry point — opens same 2-step modal (who? → what type?). One modality only. */
  onOpenStartSessionModal?: () => void;
  /** New patient — Initial Assessment: go directly to Create Patient form, no list */
  onCreatePatientForInitial?: () => void;
  /** New patient — Ongoing: go directly to Create Patient form, then Ongoing intake, no list */
  onCreatePatientForOngoing?: () => void;
  isNewlyCreated?: boolean; // Flag to indicate if patient was just created
}

export const WorkWithPatientsPanel: React.FC<WorkWithPatientsPanelProps> = ({
  selectedPatient,
  onSelectPatient,
  onStartSession,
  onViewHistory,
  onViewAnalytics,
  onOpenPatientSelector,
  onCreatePatient,
  onOngoingPatientFirstTime,
  onStartOngoingNoPatient,
  onOpenStartSessionModal,
  onCreatePatientForInitial,
  onCreatePatientForOngoing,
  isNewlyCreated = false,
}) => {
  const { t } = useTranslation();
  // Panel siempre expandido
  const [isExpanded, setIsExpanded] = useState(true);

  // Estados para tarjetas de acciones (colapsadas por defecto, pero expandir "session" si es paciente nuevo)
  const [expandedCard, setExpandedCard] = useState<string | null>(isNewlyCreated ? 'session' : null);

  // Auto-expand session card when patient is newly created
  useEffect(() => {
    if (isNewlyCreated && selectedPatient) {
      setExpandedCard('session');
      // Scroll to the panel after a short delay to ensure it's rendered
      setTimeout(() => {
        const panel = document.getElementById('work-with-patients');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [isNewlyCreated, selectedPatient]);

  // Check if patient has history
  const patientHistory = usePatientHistory(selectedPatient?.id || null);
  const hasHistory = patientHistory.data || false;

  // Toast for showing messages
  const { notify } = useToast();

  // WO-UX-01: Primary session types (Initial, Follow-up) visible; rest in "More options"
  const primarySessionTypes: Array<{ type: SessionType; label: string }> = [
    { type: 'initial', label: t('shell.sessionType.initial') },
    { type: 'followup', label: t('shell.sessionType.followup') },
  ];
  const moreSessionTypes: Array<{ type: SessionType; label: string }> = [
    { type: 'wsib', label: t('shell.sessionType.wsib') },
    { type: 'mva', label: t('shell.sessionType.mva') },
    { type: 'certificate', label: t('shell.sessionType.certificate') },
  ];

  const handlePatientSelect = (patient: Patient) => {
    onSelectPatient(patient);
  };

  const handleCardToggle = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div id="work-with-patients" className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors rounded-t-2xl"
      >
        <div className="flex-1 text-left">
          {selectedPatient ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
                {t('shell.workWithPatients.workWithName', { name: selectedPatient.fullName || selectedPatient.firstName })}
              </h2>
              <p className="text-base text-gray-600 font-apple font-light">
                {hasHistory ? t('shell.workWithPatients.continueTreatment') : t('shell.workWithPatients.startNewEvaluation')}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
                {t('shell.workWithPatients.title')}
              </h2>
              <p className="text-base text-gray-600 font-apple font-light">
                {t('shell.workWithPatients.selectPatientOrCreate')}
              </p>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-gray-100">
          {!selectedPatient ? (
            /* NO PATIENT: 2 cards for NEW patients — go directly to forms, NO patient list */
            <div className="pt-4 space-y-3">
              <p className="text-sm text-gray-600 font-apple font-light mb-4">
                {t('shell.workWithPatients.newPatientHint')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => onCreatePatientForInitial?.()}
                  className="p-4 rounded-xl border-2 border-primary-blue/40 bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 hover:border-primary-blue/60 text-left font-apple transition-all duration-200 shadow-sm hover:shadow-md flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-blue/20 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-5 h-5 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 font-apple">{t('shell.workWithPatients.initialAssessment')}</h3>
                    <p className="text-sm text-gray-600 font-apple font-light mt-0.5">{t('shell.workWithPatients.initialAssessmentDesc')}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onCreatePatientForOngoing?.()}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-blue/30 bg-gray-50/80 hover:bg-primary-blue/5 text-left font-apple transition-all duration-200 shadow-sm hover:shadow-md flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 font-apple">{t('shell.workWithPatients.ongoingFirstTime')}</h3>
                    <p className="text-sm text-gray-600 font-apple font-light mt-0.5">{t('shell.workWithPatients.ongoingFirstTimeDesc')}</p>
                  </div>
                </button>
              </div>
              {onOpenStartSessionModal && (
                <button
                  type="button"
                  onClick={onOpenStartSessionModal}
                  className="text-sm text-primary-blue hover:text-primary-blue-hover font-apple font-medium pt-2"
                >
                  {t('shell.workWithPatients.orChooseExisting')}
                </button>
              )}
            </div>
          ) : (
            /* PATIENT SELECTED: WO-UX-01 — Both CTAs always visible; primary action on the RIGHT (left→right flow) */
            <div className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. LEFT: Patient History (secondary — consult first) */}
                <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col min-h-[120px] order-2 md:order-1">
                  <button
                    onClick={() => handleCardToggle('history')}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left flex-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-xl flex items-center justify-center">
                        <History className="w-6 h-6 text-primary-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                          {t('shell.workWithPatients.patientHistory')}
                        </h3>
                        <p className="text-sm text-gray-500 font-apple font-light">
                          {t('shell.workWithPatients.previousSessionsNotes')}
                        </p>
                      </div>
                    </div>
                    {expandedCard === 'history' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {expandedCard === 'history' && (
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => onViewHistory()}
                        className="w-full px-4 py-3 bg-gray-50/50 hover:bg-primary-blue/5 border border-gray-200/60 hover:border-primary-blue/30 rounded-xl transition-all duration-200 text-sm font-medium text-gray-900 font-apple group hover:text-primary-blue"
                      >
                        {t('shell.workWithPatients.viewHistory')}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. RIGHT: Primary session actions — both Initial and Follow-up always visible */}
                <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col order-1 md:order-2">
                  <div className="p-5 space-y-3">
                    <button
                      onClick={() => SessionTypeService.isPilotAvailable('initial') && onStartSession('initial')}
                      disabled={!SessionTypeService.isPilotAvailable('initial')}
                      className={`w-full p-4 rounded-xl border-2 text-left group transition-all duration-200 ${hasHistory
                        ? 'bg-gray-50/80 hover:bg-primary-blue/5 border-gray-200/60 hover:border-primary-blue/30'
                        : 'bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 border-primary-blue/40 hover:border-primary-blue/60'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${hasHistory ? 'bg-primary-blue/10' : 'bg-primary-blue/20'}`}>
                          <Play className="w-5 h-5 text-primary-blue" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 font-apple">{t('shell.workWithPatients.startInitialAssessment')}</h3>
                          <p className="text-sm text-gray-600 font-apple font-light">{t('shell.workWithPatients.firstVisitFullEval')}</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => SessionTypeService.isPilotAvailable('followup') && onStartSession('followup')}
                      disabled={!SessionTypeService.isPilotAvailable('followup')}
                      className={`w-full p-4 rounded-xl border-2 text-left group transition-all duration-200 ${hasHistory
                        ? 'bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 border-primary-blue/40 hover:border-primary-blue/60'
                        : 'bg-gray-50/80 hover:bg-primary-blue/5 border-gray-200/60 hover:border-primary-blue/30'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${hasHistory ? 'bg-primary-blue/20' : 'bg-primary-blue/10'}`}>
                          <Play className="w-5 h-5 text-primary-blue" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 font-apple">{t('shell.workWithPatients.startFollowup')}</h3>
                          <p className="text-sm text-gray-600 font-apple font-light">{t('shell.workWithPatients.nextVisitUpdate')}</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        if (onOngoingPatientFirstTime && !hasHistory) {
                          onOngoingPatientFirstTime();
                        } else if (SessionTypeService.isPilotAvailable('followup')) {
                          onStartSession('followup');
                        }
                      }}
                      disabled={!SessionTypeService.isPilotAvailable('followup') || hasHistory}
                      title={hasHistory ? t('shell.workWithPatients.ongoingPatientTooltipDisabled') : undefined}
                      className={`w-full p-4 rounded-xl border-2 text-left group transition-all duration-200 ${hasHistory ? 'opacity-50 cursor-not-allowed border-gray-200/60 bg-gray-50/50' : 'border-gray-200/60 hover:border-primary-blue/30 bg-gray-50/80 hover:bg-primary-blue/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-primary-blue/10">
                          <Play className="w-5 h-5 text-primary-blue" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 font-apple">{t('shell.workWithPatients.ongoingFirstTime')}</h3>
                          <p className="text-sm text-gray-600 font-apple font-light">
                            {hasHistory ? t('shell.workWithPatients.ongoingPatientTooltipDisabled') : t('shell.workWithPatients.ongoingFirstTimeDesc')}
                          </p>
                        </div>
                      </div>
                    </button>
                    {/* More session types (WSIB, MVA, Certificate) — secondary */}
                    <div className="border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleCardToggle('session')}
                        className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 font-apple"
                      >
                        <span>{t('shell.workWithPatients.moreSessionTypes')}</span>
                        {expandedCard === 'session' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedCard === 'session' && (
                        <div className="mt-2 space-y-1.5">
                          {moreSessionTypes.map((session) => {
                            const isPilotAvailable = SessionTypeService.isPilotAvailable(session.type);
                            return (
                              <button
                                key={session.type}
                                onClick={() => {
                                  if (!isPilotAvailable) {
                                    notify('Feature not available during pilot. We\'ll email you when it becomes available.');
                                    return;
                                  }
                                  onStartSession(session.type);
                                }}
                                disabled={!isPilotAvailable}
                                className={`w-full p-2.5 rounded-lg text-left text-sm font-apple ${!isPilotAvailable ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'
                                  }`}
                              >
                                <span className="text-gray-700">{session.label}</span>
                                {!isPilotAvailable && (
                                  <span className="ml-2 text-xs text-gray-400">Coming soon</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


