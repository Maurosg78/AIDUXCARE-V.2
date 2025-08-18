import React, { useMemo, useState } from 'react';
import { sanitizeForLLM } from '../../../core/assistant/rails';
import { AssistantEntity, isMedication, DiagnosisEntity, ProcedureEntity, InstructionEntity } from '../../../core/assistant/entities';
import { extractEntities } from '../../../core/assistant/extractEntities';
import { appendPlanSnippet } from '../../../core/emr/SoapNoteService';
import { addMedicationToVisit, formatSoapFromMedication } from '../../../core/emr/MedicationService';
import { routeQuery as localRoute, lookupPatientAge, lookupLatestMRI, lookupPendingNotes, lookupTodayAppointments } from '../../../core/assistant/dataLookup';
import { runAssistantQuery } from '../../../core/assistant/assistantAdapter';

type Props = {
  patientId?: string;
  visitId?: string;
};

type TabType = 'data' | 'knowledge';

export const ClinicalAssistantPanel: React.FC<Props> = ({ patientId, visitId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState<AssistantEntity[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const disabled = useMemo(() => query.trim().length === 0 || busy, [query, busy]);

  async function handleAsk() {
    setBusy(true);
    setError(undefined);
    try {
      // 1) Intento por Functions (adapter)
      try {
        const res = await runAssistantQuery({ input: query, ctx: { patientId, visitId } });
        if (res.ok) {
          setAnswer(res.answerMarkdown ?? '');
          setEntities((res.entities as AssistantEntity[]) ?? []);
          setBusy(false);
          return;
        }
      } catch (_) { /* fallback local */ }

      // 2) Fallback local (sin Functions)
      if (activeTab === 'data') {
        const routed = localRoute(query);
        if (routed.startsWith('data')) {
          let ans;
          if (routed === 'data:age') ans = await lookupPatientAge(patientId);
          else if (routed === 'data:mri') ans = await lookupLatestMRI(patientId);
          else if (routed === 'data:appointments') ans = await lookupTodayAppointments();
          else ans = await lookupPendingNotes();
          setEntities([]);
          setAnswer(ans.answerMarkdown);
        } else {
          setAnswer('Para consultas de datos, usa palabras clave como "edad", "resonancia", "citas hoy", "notas pendientes"');
        }
      } else {
        // Tab Conocimiento - LLM local
        const sanitized = sanitizeForLLM(query);
        if (sanitized === 'Fuera de alcance clínico') {
          setAnswer('Esta consulta está fuera del dominio médico. Por favor, reformula tu pregunta en términos clínicos.');
          setEntities([]);
        } else {
          const detected = extractEntities(sanitized);
          setEntities(detected);
          setAnswer('Entidades detectadas. Usa "Integrar al SOAP" para medicamentos.');
        }
      }
    } catch (_e) {
      setError('No se pudo procesar la consulta');
    } finally {
      setBusy(false);
    }
  }

  async function handleIntegrate(entity: AssistantEntity) {
    if (!isMedication(entity) || !visitId) return;
    setBusy(true);
    setError(undefined);
    try {
      const medicationId = await addMedicationToVisit(visitId, entity);
      const snippet = formatSoapFromMedication(entity);
      await appendPlanSnippet(visitId, snippet);
      console.info('Medicamento integrado', { medicationId });
      setAnswer('Medicamento integrado exitosamente al SOAP');
      setEntities([]);
    } catch (_e) {
      setError('No se pudo integrar al SOAP');
    } finally {
      setBusy(false);
    }
  }

  const getPlaceholder = () => {
    if (activeTab === 'data') {
      return 'Ej.: ¿Cuál es la edad del paciente? ¿Qué dice su última resonancia?';
    }
    return 'Ej.: ibuprofeno 400 mg por 7 días cada 12 horas';
  };

  const getEntityDescription = (entity: AssistantEntity): string => {
    if (entity.kind === 'diagnosis') {
      const diag = entity as DiagnosisEntity;
      return diag.label || 'Sin descripción';
    }
    if (entity.kind === 'procedure') {
      const proc = entity as ProcedureEntity;
      return proc.label || 'Sin descripción';
    }
    if (entity.kind === 'instruction') {
      const inst = entity as InstructionEntity;
      return inst.text || 'Sin descripción';
    }
    return 'Sin descripción';
  };

  return (
    <div className="card p-4 rounded-[1rem] shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">AiDux Assistant</h3>
        <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              activeTab === 'data' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Datos
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              activeTab === 'knowledge' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Conocimiento
          </button>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 mb-3">
        {activeTab === 'data' 
          ? 'Consulta datos internos del paciente y sistema'
          : 'Análisis clínico con IA local. Nunca se envía PII a LLMs externos.'
        }
      </p>
      
      <div className="flex items-start gap-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 rounded-lg border border-slate-300 p-3 text-sm"
          rows={2}
        />
        <button
          onClick={handleAsk}
          disabled={disabled}
          className="bg-brand-in-500 hover:bg-brand-in-600 disabled:opacity-60 text-white rounded-lg px-4 py-2 h-10"
        >
          {busy ? 'Procesando...' : 'Consultar'}
        </button>
      </div>

      {answer && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-800 whitespace-pre-wrap">{answer}</div>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {entities.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Resultados detectados</h4>
          <ul className="space-y-2">
            {entities.map((e, idx) => (
              <li key={idx} className="rounded-lg border border-slate-200 p-3">
                {isMedication(e) ? (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-800">
                      <span className="font-medium text-brand-in-600">💊 Medicamento:</span> {e.name}
                      {e.strength && ` · ${e.strength}`}
                      {e.frequency && ` · ${e.frequency}`}
                      {e.durationDays && ` · ${e.durationDays} días`}
                    </div>
                    <button
                      onClick={() => handleIntegrate(e)}
                      disabled={!visitId}
                      className="btn-in px-3 py-1.5 text-sm disabled:opacity-50"
                      title={!visitId ? 'Se requiere una visita activa' : 'Integrar al SOAP'}
                    >
                      Integrar al SOAP
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-brand-in-600">🔍 Entidad:</span> {e.kind} - {getEntityDescription(e)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>💡 Tipos de consulta:</strong> edad, resonancia/MRI, citas hoy, notas pendientes
          </p>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>🔒 Seguridad:</strong> Procesamiento local, sin envío de datos a servicios externos
          </p>
        </div>
      )}
    </div>
  );
};


