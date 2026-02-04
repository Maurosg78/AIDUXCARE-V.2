/**
 * Start Session — Modal en 2 pasos (CTO: Propuesta A)
 *
 * Fisio recibe paciente: debe elegir o crear y luego el tipo de sesión, sin salir del flujo.
 * Paso 1: ¿Quién es el paciente? (buscar / crear).
 * Paso 2: ¿Qué tipo de sesión? (Initial Assessment | Follow-up | Ongoing first time in AiDuxCare).
 *
 * Justificación: Un solo funnel — quien + tipo + ir. ≤3 acciones. Las 3 alternativas en un solo lugar.
 */

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, ArrowLeft, Play, RefreshCw, FileText } from 'lucide-react';
import { Patient } from '@/services/patientService';
import { usePatientsList, type PatientListItem } from '../hooks/usePatientsList';
import { usePatientHistory } from '../hooks/usePatientHistory';
import { SessionTypeService } from '@/services/sessionTypeService';

export type StartSessionType = 'initial' | 'followup' | 'ongoing';

export type StartSessionModalMode = 'start_now' | 'add_to_today';

export interface StartSessionTwoStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Step 1: user clicks "Create New Patient" (hidden in add_to_today mode — only existing patients) */
  onCreateNew: () => void;
  /** Step 2: user chooses Initial or Follow-up → go to workflow */
  onStartSession: (patient: Patient, type: 'initial' | 'followup') => void;
  /** Step 2: user chooses Ongoing first time → open intake, then follow-up workflow */
  onStartOngoing: (patient: Patient) => void;
  /** Step 2 in add_to_today mode: add patient + type to today's quick list */
  onAddToToday?: (patient: Patient, type: 'initial' | 'followup' | 'ongoing') => void;
  /** When 'add_to_today', step 2 shows "Add as Initial/Follow-up/Ongoing" instead of Start now; step 1 hides Create New (only list) */
  mode?: StartSessionModalMode;
  /** When reopening after creating a patient, show step 2 with this patient */
  initialStep?: 1 | 2;
  initialPatient?: Patient | null;
  /** New patient: show only Initial Assessment + Ongoing (no Follow-up — only for registered patients) */
  isNewlyCreatedPatient?: boolean;
}

export const StartSessionTwoStepModal: React.FC<StartSessionTwoStepModalProps> = ({
  isOpen,
  onClose,
  onCreateNew,
  onStartSession,
  onStartOngoing,
  onAddToToday,
  mode = 'start_now',
  initialStep = 1,
  initialPatient = null,
  isNewlyCreatedPatient = false,
}) => {
  const { patients, loading } = usePatientsList();
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient);
  const [searchQuery, setSearchQuery] = useState('');
  // Ongoing only for patients not yet in AiDuxCare (no baseline, no prior sessions)
  const patientHistory = usePatientHistory(step === 2 && !isNewlyCreatedPatient ? selectedPatient?.id ?? null : null);
  const hasHistory = patientHistory.data || false;
  const isLoadingHistory = patientHistory.loading;
  const ongoingDisabled =
    !!selectedPatient &&
    (isLoadingHistory || // Disable while loading (assume may have history)
      !!(selectedPatient as Patient & { activeBaselineId?: string }).activeBaselineId ||
      hasHistory);
  // Follow-up only for registered patients (have baseline or prior sessions)
  const followUpDisabled = !ongoingDisabled; // when ongoing is enabled (new patient), follow-up is disabled

  // When modal opens or initialPatient/initialStep change, sync state
  useEffect(() => {
    if (!isOpen) return;
    setStep(initialPatient && initialStep === 2 ? 2 : initialStep);
    setSelectedPatient(initialPatient ?? null);
    if (!initialPatient) setSearchQuery('');
  }, [isOpen, initialStep, initialPatient]);

  if (!isOpen) return null;

  const filteredPatients = patients.filter(patient => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = (patient.fullName || `${patient.firstName} ${patient.lastName || ''}`).toLowerCase();
    const email = (patient.email || '').toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const handleSelectPatient = (patient: PatientListItem) => {
    setSelectedPatient(patient as unknown as Patient);
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSelectedPatient(null);
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  const handleStartInitial = () => {
    if (!selectedPatient) return;
    if (!SessionTypeService.isPilotAvailable('initial')) return;
    onStartSession(selectedPatient, 'initial');
    onClose();
  };

  const handleStartFollowup = () => {
    if (!selectedPatient) return;
    if (!SessionTypeService.isPilotAvailable('followup')) return;
    onStartSession(selectedPatient, 'followup');
    onClose();
  };

  const handleStartOngoing = () => {
    if (!selectedPatient) return;
    if (!SessionTypeService.isPilotAvailable('followup')) return;
    onStartOngoing(selectedPatient);
    onClose();
  };

  const handleAddAsInitial = () => {
    if (!selectedPatient || !onAddToToday) return;
    if (!SessionTypeService.isPilotAvailable('initial')) return;
    onAddToToday(selectedPatient, 'initial');
    onClose();
  };
  const handleAddAsFollowup = () => {
    if (!selectedPatient || !onAddToToday) return;
    if (!SessionTypeService.isPilotAvailable('followup')) return;
    onAddToToday(selectedPatient, 'followup');
    onClose();
  };
  const handleAddAsOngoing = () => {
    if (!selectedPatient || !onAddToToday) return;
    if (!SessionTypeService.isPilotAvailable('followup') || ongoingDisabled) return;
    onAddToToday(selectedPatient, 'ongoing');
    onClose();
  };

  const patientName = selectedPatient?.fullName || selectedPatient?.firstName || 'Patient';
  const isAddToTodayMode = mode === 'add_to_today';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          {step === 1 ? (
            <h2 className="text-xl font-semibold text-gray-900 font-apple">
              Who is the patient?
            </h2>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToStep1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Back to patient list"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 font-apple">
                  What type of session?
                </h2>
                <p className="text-sm text-gray-500 font-apple font-light mt-0.5">
                  {patientName}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* Step 1: Search */}
            <div className="p-4 pt-0 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={isAddToTodayMode ? "Search patient by name or email..." : "Search by name or email..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-apple"
                />
              </div>
            </div>

            {/* Step 1: Patient list — in add_to_today mode, show results only when user has typed (no full list) */}
            <div className="flex-1 overflow-y-auto p-6 min-h-[200px]">
              {loading ? (
                <div className="text-center text-gray-500 font-apple py-8">
                  Loading patients...
                </div>
              ) : isAddToTodayMode && !searchQuery.trim() ? (
                <div className="text-center text-gray-500 font-apple py-8">
                  <p className="mb-2">Type to search for a patient</p>
                  <p className="text-sm font-light">Select only from search results to add to today&apos;s list</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center text-gray-500 font-apple py-8">
                  {searchQuery.trim() ? 'No patients found' : 'No patients yet'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full p-4 bg-white border border-gray-200 hover:border-primary-blue/50 hover:bg-primary-blue/5 rounded-xl transition-all text-left font-apple"
                    >
                      <div className="font-semibold text-gray-900">
                        {patient.fullName || `${patient.firstName} ${patient.lastName || ''}`}
                      </div>
                      {patient.email && (
                        <div className="text-sm text-gray-600 font-light mt-1">{patient.email}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 1: Footer — Create new (hidden in add_to_today: solo pacientes de la lista) */}
            {!isAddToTodayMode && (
              <div className="p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={handleCreateNew}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all font-apple"
                >
                  <UserPlus className="w-5 h-5" />
                  Create New Patient
                </button>
              </div>
            )}
          </>
        ) : isAddToTodayMode && onAddToToday ? (
          /* Step 2: Add to today — solo pacientes existentes; 3 opciones (Follow-up solo si registrado) */
          <div className="p-6 space-y-3 flex-1 overflow-y-auto">
            <p className="text-sm text-gray-600 font-apple font-light mb-4">
              Add this patient to today&apos;s list with the selected session type. When it&apos;s time, press Start on that row.
            </p>
            <button
              onClick={handleAddAsInitial}
              disabled={!SessionTypeService.isPilotAvailable('initial')}
              className="w-full p-4 rounded-xl border-2 border-primary-blue/40 bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 hover:border-primary-blue/60 hover:shadow-md transition-all text-left font-apple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-blue/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-primary-blue" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Add as Initial Assessment</div>
                  <div className="text-sm text-gray-600 font-light">First visit — full evaluation and SOAP</div>
                </div>
              </div>
            </button>
            <button
              onClick={handleAddAsFollowup}
              disabled={!SessionTypeService.isPilotAvailable('followup') || followUpDisabled}
              title={followUpDisabled ? 'Only for patients already registered (with baseline)' : undefined}
              className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-blue/30 bg-gray-50/80 hover:bg-primary-blue/5 transition-all text-left font-apple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-primary-blue" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Add as Follow-up</div>
                  <div className="text-sm text-gray-600 font-light">
                    {followUpDisabled
                      ? 'Patient needs Initial Assessment or Ongoing intake first'
                      : 'Next visit — update and SOAP'}
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={handleAddAsOngoing}
              disabled={!SessionTypeService.isPilotAvailable('followup') || ongoingDisabled}
              title={ongoingDisabled ? 'Only for patients not yet in AiDuxCare' : undefined}
              className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-blue/30 bg-gray-50/80 hover:bg-primary-blue/5 transition-all text-left font-apple disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-blue" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Add as Ongoing (first time in AiDuxCare)</div>
                  <div className="text-sm text-gray-600 font-light">
                    {ongoingDisabled
                      ? 'This patient already has sessions — use Initial or Follow-up'
                      : 'Existing treatment — fill intake, then session'}
                  </div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* Step 2: Session type — Start now. New patient: solo Initial + Ongoing; otherwise 3 opciones */
          <div className="p-6 space-y-3 flex-1 overflow-y-auto">
            <button
              onClick={handleStartInitial}
              disabled={!SessionTypeService.isPilotAvailable('initial')}
              className="w-full p-4 rounded-xl border-2 border-primary-blue/40 bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 hover:border-primary-blue/60 hover:shadow-md transition-all text-left font-apple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-blue/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-primary-blue" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Initial Assessment</div>
                  <div className="text-sm text-gray-600 font-light">First visit — full evaluation and SOAP</div>
                </div>
                <Play className="w-5 h-5 text-primary-blue ml-auto flex-shrink-0" />
              </div>
            </button>

            {!isNewlyCreatedPatient && (
              <button
                onClick={handleStartFollowup}
                disabled={!SessionTypeService.isPilotAvailable('followup') || followUpDisabled}
                title={followUpDisabled ? 'Only for patients already registered (with baseline)' : undefined}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-blue/30 bg-gray-50/80 hover:bg-primary-blue/5 transition-all text-left font-apple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-primary-blue" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Follow-up</div>
                    <div className="text-sm text-gray-600 font-light">
                      {followUpDisabled ? 'Patient needs Initial Assessment or Ongoing intake first' : 'Next visit — update and SOAP'}
                    </div>
                  </div>
                  <Play className="w-5 h-5 text-gray-400 ml-auto flex-shrink-0" />
                </div>
              </button>
            )}

            <button
              onClick={handleStartOngoing}
              disabled={!SessionTypeService.isPilotAvailable('followup') || ongoingDisabled}
              title={ongoingDisabled ? 'Only for patients not yet in AiDuxCare (this patient already has history)' : undefined}
              className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-blue/30 bg-gray-50/80 hover:bg-primary-blue/5 transition-all text-left font-apple disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-blue" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Ongoing patient, first time in AiDuxCare</div>
                  <div className="text-sm text-gray-600 font-light">
                    {ongoingDisabled
                      ? 'This patient already has sessions in AiDuxCare — use Initial or Follow-up'
                      : isNewlyCreatedPatient
                        ? 'Existing treatment elsewhere — fill intake, then session'
                        : 'Existing treatment — fill intake to create baseline, then session'}
                  </div>
                </div>
                <Play className="w-5 h-5 text-gray-400 ml-auto flex-shrink-0" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
