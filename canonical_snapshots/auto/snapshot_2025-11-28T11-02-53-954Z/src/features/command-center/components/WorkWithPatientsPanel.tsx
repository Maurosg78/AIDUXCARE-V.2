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
import { 
  Play, 
  History, 
  Scroll,
  FileCheck,
  BarChart3,
  ChevronDown,
  ChevronUp,
  UserPlus,
  RefreshCw,
  Search
} from 'lucide-react';
import { Patient } from '@/services/patientService';
import { SessionType } from '@/services/sessionTypeService';
import { usePatientHistory } from '../hooks/usePatientHistory';
import { usePatientsList } from '../hooks/usePatientsList';

export interface WorkWithPatientsPanelProps {
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onStartSession: (sessionType: SessionType) => void;
  onViewCertificates: () => void;
  onViewHistory: () => void;
  onViewDocuments: () => void;
  onViewAnalytics: () => void;
  onOpenPatientSelector: () => Promise<Patient | null>;
  onCreatePatient: () => void;
  isNewlyCreated?: boolean; // Flag to indicate if patient was just created
}

export const WorkWithPatientsPanel: React.FC<WorkWithPatientsPanelProps> = ({
  selectedPatient,
  onSelectPatient,
  onStartSession,
  onViewCertificates,
  onViewHistory,
  onViewDocuments,
  onViewAnalytics,
  onOpenPatientSelector,
  onCreatePatient,
  isNewlyCreated = false,
}) => {
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
  
  // Búsqueda de pacientes
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  
  // Get patients list
  const { patients: allPatients, loading: patientsLoading } = usePatientsList();
  
  // Check if patient has history
  const patientHistory = usePatientHistory(selectedPatient?.id || null);
  const hasHistory = patientHistory.data || false;

  // Filter patients by search query - prioritize last name search
  const filteredPatients = React.useMemo(() => {
    if (!patientSearchQuery.trim()) return []; // No mostrar pacientes hasta que el usuario escriba
    const query = patientSearchQuery.toLowerCase().trim();
    
    return allPatients
      .filter(patient => {
        // Priorizar búsqueda por apellido
        const lastNameMatch = patient.lastName?.toLowerCase().startsWith(query) || false;
        const firstNameMatch = patient.firstName?.toLowerCase().startsWith(query) || false;
        const fullNameMatch = patient.fullName.toLowerCase().includes(query);
        const emailMatch = (patient.email || '').toLowerCase().includes(query);
        
        return lastNameMatch || firstNameMatch || fullNameMatch || emailMatch;
      })
      .sort((a, b) => {
        // Ordenar: primero los que empiezan con el apellido, luego los demás
        const aLastNameStarts = a.lastName?.toLowerCase().startsWith(query) || false;
        const bLastNameStarts = b.lastName?.toLowerCase().startsWith(query) || false;
        
        if (aLastNameStarts && !bLastNameStarts) return -1;
        if (!aLastNameStarts && bLastNameStarts) return 1;
        
        // Si ambos empiezan con apellido o ninguno, mantener orden alfabético por apellido
        const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '', 'en', { sensitivity: 'base' });
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.firstName || '').localeCompare(b.firstName || '', 'en', { sensitivity: 'base' });
      });
  }, [allPatients, patientSearchQuery]);

  // Session types for "Start Clinical Session" card
  const sessionTypes: Array<{ type: SessionType; label: string; tokens: number }> = [
    { type: 'initial', label: 'Initial Assessment', tokens: 10 },
    { type: 'followup', label: 'Follow-up', tokens: 4 },
    { type: 'wsib', label: 'WSIB session', tokens: 13 },
    { type: 'mva', label: 'MVA session', tokens: 15 },
    { type: 'certificate', label: 'Certificate-only session', tokens: 6 },
  ];

  const handlePatientSelect = (patient: Patient) => {
    onSelectPatient(patient);
    setPatientSearchQuery(''); // Limpiar búsqueda
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
                Work with {selectedPatient.fullName || selectedPatient.firstName}
              </h2>
              <p className="text-base text-gray-600 font-apple font-light">
                {hasHistory ? 'Continue treatment' : 'Start new patient evaluation'}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
                Work with Patients
              </h2>
              <p className="text-base text-gray-600 font-apple font-light">
                Select a patient or create new
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
            /* NO PATIENT SELECTED: Show patient selection */
            <div className="pt-4">
              {/* Two main paths - Apple Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Path 1: Start New Patient */}
                <button
                  onClick={onCreatePatient}
                  className="group relative p-5 bg-gradient-to-br from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover rounded-xl transition-all duration-200 hover:shadow-lg text-left border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white font-apple mb-1">
                        Start New Patient Session
                      </h3>
                      <p className="text-sm text-white/80 font-apple font-light mb-2">
                        Initial Assessment • Where Aidux shines
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white font-apple">
                        <span>10 tokens</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Path 2: Continue Existing Patient */}
                <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  {/* Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                          Continue Existing Patient
                        </h3>
                        <p className="text-sm text-gray-500 font-apple font-light mb-2">
                          Select from list below
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full text-xs font-semibold text-gray-700 font-apple">
                          <span>4 tokens</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient List - Reduced 25% */}
                  <div className="p-3">
                    {/* Search Bar */}
                    <div className="mb-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Type last name to search (e.g., SO...)"
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          onFocus={(e) => {
                            // Si hay texto, mantenerlo; si no, dejar vacío para empezar a escribir
                            if (!e.target.value.trim()) {
                              setPatientSearchQuery('');
                            }
                          }}
                          className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue/30 text-xs font-apple bg-gray-50/50 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Patients List - Solo muestra cuando hay búsqueda */}
                    {patientSearchQuery.trim() && (
                      <div className="max-h-[180px] overflow-y-auto space-y-1">
                        {patientsLoading ? (
                          <div className="text-[11px] text-gray-400 font-apple py-3 text-center">
                            Loading patients...
                          </div>
                        ) : filteredPatients.length === 0 ? (
                          <div className="text-[11px] text-gray-400 font-apple py-3 text-center">
                            No patients found matching "{patientSearchQuery}"
                          </div>
                        ) : (
                          filteredPatients.map((patient) => (
                            <button
                              key={patient.id}
                              onClick={() => {
                                handlePatientSelect(patient as Patient);
                                setPatientSearchQuery(''); // Limpiar búsqueda al seleccionar
                              }}
                              className="w-full p-2 rounded-lg border border-gray-200/60 bg-white hover:border-primary-blue/40 hover:bg-primary-blue/3 transition-all duration-200 text-left group"
                            >
                              <div className="font-medium text-gray-900 font-apple text-xs group-hover:text-primary-blue transition-colors">
                                {patient.fullName}
                              </div>
                              {patient.email && (
                                <div className="text-[10px] text-gray-500 font-apple font-light mt-0.5">
                                  {patient.email}
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    
                    {/* Placeholder cuando no hay búsqueda */}
                    {!patientSearchQuery.trim() && !patientsLoading && (
                      <div className="text-[11px] text-gray-400 font-apple py-3 text-center">
                        Start typing to search patients by last name...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PATIENT SELECTED: Show action cards (collapsed by default) */
            <div className="pt-4">
              {/* Action Cards Grid - Apple Style Symmetry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Start Clinical Session */}
                <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col min-h-[120px]">
                  <button
                    onClick={() => handleCardToggle('session')}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left flex-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                          Start Clinical Session
                        </h3>
                        <p className="text-sm text-gray-500 font-apple font-light">
                          {hasHistory ? 'Follow-up' : 'Initial Assessment'}
                        </p>
                      </div>
                    </div>
                    {expandedCard === 'session' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {expandedCard === 'session' && (
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-2">
                      {sessionTypes.map((session) => {
                        const isInitialAssessment = session.type === 'initial';
                        const isHighlighted = isNewlyCreated && isInitialAssessment && !hasHistory;
                        
                        return (
                          <button
                            key={session.type}
                            onClick={() => onStartSession(session.type)}
                            className={`w-full p-3 rounded-xl transition-all duration-200 text-left group ${
                              isHighlighted
                                ? 'bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 border-2 border-primary-blue/40 hover:border-primary-blue/60 shadow-sm'
                                : 'bg-gray-50/50 hover:bg-primary-blue/5 border border-gray-200/60 hover:border-primary-blue/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium font-apple ${
                                isHighlighted
                                  ? 'text-primary-blue font-semibold'
                                  : 'text-gray-900 group-hover:text-primary-blue'
                              }`}>
                                {session.label}
                                {isHighlighted && (
                                  <span className="ml-2 text-xs text-primary-purple font-medium">⭐ Recommended</span>
                                )}
                              </span>
                              <span className={`text-xs font-medium rounded-full px-3 py-1 font-apple ${
                                isHighlighted
                                  ? 'bg-primary-blue/20 text-primary-blue'
                                  : 'bg-white text-gray-500'
                              }`}>
                                {session.tokens} tokens
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Certificates */}
                <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col min-h-[120px]">
                  <button
                    onClick={() => handleCardToggle('certificates')}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left flex-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-xl flex items-center justify-center">
                        <Scroll className="w-6 h-6 text-primary-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                          Certificates
                        </h3>
                        <p className="text-sm text-gray-500 font-apple font-light">
                          Generate after session
                        </p>
                      </div>
                    </div>
                    {expandedCard === 'certificates' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {expandedCard === 'certificates' && (
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-2">
                      <button
                        onClick={() => onViewCertificates()}
                        className="w-full p-3 bg-gray-50/50 hover:bg-primary-blue/5 border border-gray-200/60 hover:border-primary-blue/30 rounded-xl transition-all duration-200 text-left group"
                      >
                        <span className="text-sm font-medium text-gray-900 font-apple group-hover:text-primary-blue">Return-to-work certificate</span>
                      </button>
                      <button
                        onClick={() => onViewCertificates()}
                        className="w-full p-3 bg-gray-50/50 hover:bg-primary-blue/5 border border-gray-200/60 hover:border-primary-blue/30 rounded-xl transition-all duration-200 text-left group"
                      >
                        <span className="text-sm font-medium text-gray-900 font-apple group-hover:text-primary-blue">Activity restriction letter</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Patient History */}
                <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col min-h-[120px]">
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
                          Patient History
                        </h3>
                        <p className="text-sm text-gray-500 font-apple font-light">
                          Previous sessions & notes
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
                        View History
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Documents & Forms */}
                <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col min-h-[120px]">
                  <button
                    onClick={() => handleCardToggle('documents')}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left flex-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-xl flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-primary-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                          Documents & Forms
                        </h3>
                        <p className="text-sm text-gray-500 font-apple font-light">
                          WSIB/MVA forms & certificates
                        </p>
                      </div>
                    </div>
                    {expandedCard === 'documents' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {expandedCard === 'documents' && (
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => onViewDocuments()}
                        className="w-full px-4 py-3 bg-gray-50/50 hover:bg-primary-blue/5 border border-gray-200/60 hover:border-primary-blue/30 rounded-xl transition-all duration-200 text-sm font-medium text-gray-900 font-apple group hover:text-primary-blue"
                      >
                        Generate WSIB/MVA Forms
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


