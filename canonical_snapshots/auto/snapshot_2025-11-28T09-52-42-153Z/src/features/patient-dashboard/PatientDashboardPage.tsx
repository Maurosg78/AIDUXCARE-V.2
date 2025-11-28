import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ClinicalAssistantPanel from "../../shared/components/Assistant/ClinicalAssistantPanel";

import { PatientHeaderCard } from './components/PatientHeaderCard';
import { LastTherapyCard } from './components/LastTherapyCard';
import { usePatientCore } from './hooks/usePatientCore';
import { useActiveEpisode } from './hooks/useActiveEpisode';
import { useLastEncounter } from './hooks/useLastEncounter';

export const PatientDashboardPage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // TODO: Implementar lógica para pacientes nuevos con searchParams

  // Hooks de datos
  const patientCore = usePatientCore(patientId!);
  const activeEpisode = useActiveEpisode(patientId!);
  const lastEncounter = useLastEncounter(patientId!);
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
              Volver al Command Center
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Encabezado del paciente */}
        <PatientHeaderCard 
          patient={patient} 
          episode={activeEpisode.data}
          loading={patientCore.loading}
        />

        {/* Contenido según tipo de paciente */}
        {isEstablishedPatient ? (
          /* PACIENTE ESTABLECIDO */
          <div className="space-y-6 mt-6">
            {/* Última terapia aplicada */}
            {lastEncounter.data && (
              <LastTherapyCard 
                encounter={lastEncounter.data}
                loading={lastEncounter.loading}
              />
            )}

            {/* Plan y objetivos */}
            {activeEpisode.data && (
              <div className="card p-6 rounded-[1rem] shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Plan y objetivos
                </h2>
                <div className="space-y-4">
                  {activeEpisode.data.goals?.shortTerm && activeEpisode.data.goals.shortTerm.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-2">Objetivos a corto plazo:</h3>
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
                      <h3 className="text-sm font-medium text-slate-700 mb-2">Objetivos a largo plazo:</h3>
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
              </div>
            )}

            {/* Línea de tiempo breve */}
            <div className="card p-6 rounded-[1rem] shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Línea de tiempo
              </h2>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">
                  {activeEpisode.data ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-brand-in-500 rounded-full"></span>
                      <span>Episodio iniciado: {activeEpisode.data.startDate.toDate().toLocaleDateString('es-ES')}</span>
                    </div>
                  ) : (
                    <span>No hay episodios activos</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PACIENTE NUEVO */
          <div className="space-y-6 mt-6">
            <div className="card p-6 rounded-[1rem] shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Paciente nuevo - Checklist inicial
              </h2>
              
              <div className="space-y-4">
                {/* Identidad y contacto */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-slate-700">Identidad y contacto</span>
                </div>

                {/* Consentimiento */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">?</span>
                  </div>
                  <span className="text-slate-700">Consentimiento informado</span>
                </div>

                {/* Motivo de consulta */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">?</span>
                  </div>
                  <span className="text-slate-700">Motivo de consulta</span>
                </div>
              </div>

              {/* Botón grabar anamnesis */}
              <div className="mt-6">
                <button
                  onClick={() => {/* TODO: Implementar grabación de audio */}}
                  className="w-full bg-brand-in-500 hover:bg-brand-in-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Grabar anamnesis por audio
                </button>
              </div>

              {/* Crear episodio inicial */}
              <div className="mt-4">
                <button
                  onClick={() => {/* TODO: Implementar modal de episodio */}}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  ➕ Crear Episodio Inicial
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de acciones fija */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={() => navigate(`/encounters/new?patientId=${patientId}`)}
                className="bg-brand-in-500 hover:bg-brand-in-600 text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Continuar sesión
              </button>
              
              <button
                onClick={() => {/* TODO: Modal registrar outcome */}}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Registrar outcome
              </button>
              
              <button
                onClick={() => {/* TODO: Selector protocolo */}}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Protocolo
              </button>
              
              <button
                onClick={() => {/* TODO: Implementar grabación de audio */}}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Grabar anamnesis
              </button>
            </div>
          </div>
        </div>

        {/* Espacio para barra fija */}
        <div className="h-24"></div>

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
