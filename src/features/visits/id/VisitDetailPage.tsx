import { vi } from "vitest";
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MCPContext } from '@/core/mcp/schema';
import { MCPManager } from '@/core/mcp/MCPManager';
import { buildAgentContext } from '@/core/agent/AgentContextBuilder';
import { getAgentSuggestions } from '@/core/agent/ClinicalAgent';
import { visitDataSourceSupabase } from '@/core/dataSources/visitDataSourceSupabase';
import { Visit } from '@/core/domain/visitType';
import { patientDataSourceSupabase } from '@/core/dataSources/patientDataSourceSupabase';
import AgentContextDiffViewer from '@/shared/components/Agent/AgentContextDiffViewer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeftIcon, CalendarIcon, UserIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ChartBarIcon } from '@heroicons/react/24/solid';
import MCPEditor from '@/core/mcp/components/MCPEditor';
import AudioCaptureSection from '@/shared/components/Audio/AudioCaptureSection';
import Tabs from '@/shared/components/UI/Tabs';
import ActionPanel from '@/shared/components/UI/ActionPanel';
import LoadingSpinner from '@/shared/components/UI/LoadingSpinner';
import LongitudinalMetricsViewer from '@/shared/components/Metrics/LongitudinalMetricsViewer';
import { runClinicalAgent } from '@/core/agent/runClinicalAgent';

/**
 * Página de detalle de una visita clínica
 * Incluye la visualización del contexto MCP generado para esta visita
 */
const VisitDetailPage: React.FC = () => {
  const { id: visitId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [context, setContext] = useState<MCPContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | boolean>(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const userId = "admin-test-001"; // En una implementación real, vendría del contexto de autenticación

  // Estados para manejo de pestañas
  const [activeTab, setActiveTab] = useState('contexto');
  
  // Estados para las visitas previas
  const [previousVisits, setPreviousVisits] = useState<Visit[]>([]);
  const [previousVisit, setPreviousVisit] = useState<Visit | null>(null);
  const [previousContext, setPreviousContext] = useState<MCPContext | null>(null);
  const [patientInfo, setPatientInfo] = useState<{ id: string; name: string; } | null>(null);

  // Referencia al MCPManager
  const mcpManager = new MCPManager();

  // Opciones para las pestañas
  const tabOptions = [
    { id: 'contexto', label: 'Contexto Clínico', icon: <ClipboardDocumentIcon className="h-5 w-5" /> },
    { id: 'audio', label: 'Audio', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg> },
    { id: 'comparacion', label: 'Comparación', icon: <ArrowPathIcon className="h-5 w-5" />, disabled: previousVisits.length === 0 },
    { id: 'metricas', label: 'Evolución y métricas', icon: <ChartBarIcon className="h-5 w-5" />, disabled: previousVisits.length === 0 },
  ];

  useEffect(() => {
    const loadVisitData = async () => {
      if (!visitId) return;
      setLoading(true);
      setError(false);

      try {
        // 1. Obtener datos de la visita
        const visitData = await visitDataSourceSupabase.getVisitById(visitId);
        if (!visitData) {
          setError('No se pudo encontrar la visita solicitada');
          setLoading(false);
          return;
        }

        setContext({
          contextual: {
            source: 'visit',
            data: []
          },
          persistent: {
            source: 'visit',
            data: []
          },
          semantic: {
            source: 'visit',
            data: []
          },
          // Guardamos los datos originales de la visita para acceso
          visitData: visitData
        });
        
        setError(false);

        // 2. Obtener datos del paciente
        const patientData = await patientDataSourceSupabase.getPatientById(visitData.patient_id);
        if (patientData) {
          setPatientInfo({
            id: patientData.id,
            name: patientData.full_name || patientData.name || 'Paciente'
          });
        }

        // 3. Obtener visitas previas del mismo paciente
        const patientVisits = await visitDataSourceSupabase.getVisitsByPatientId(visitData.patient_id);
        
        // Filtrar la visita actual y ordenar por fecha descendente
        const previousVisitsList = patientVisits
          .filter(v => v.id !== visitId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setPreviousVisits(previousVisitsList);

        // Si hay visitas previas, preparar para comparación
        if (previousVisitsList.length > 0) {
          setPreviousVisit(previousVisitsList[0]);
          // Cargar el contexto de la primera visita previa
          await loadPreviousContext(previousVisitsList[0].id);
        }

      } catch (err) {
        console.error('Error cargando datos de la visita:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadVisitData();
  }, [visitId]);

// Eliminada la carga de logs de auditoría para simplificar

  // Función para cargar el contexto de una visita previa
  const loadPreviousContext = async (prevVisitId: string) => {
    try {
      // Usar MCPManager para cargar el contexto de la visita previa
      const prevContext = await mcpManager.getContextForVisit(prevVisitId);
      setPreviousContext(prevContext);
      
    } catch (error) {
      console.error('Error cargando contexto previo:', error);
    }
  };
  
  // Función para guardar el contexto con persistencia real en Supabase
  const handleSaveContext = async (updatedContext: MCPContext): Promise<void> => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      
      // Usando la persistencia real en Supabase
      await mcpManager.saveContext(
        visitId || '', 
        updatedContext
      );
      
      // Actualizamos el estado local para reflejar los cambios
      setContext(updatedContext);
      setSaveSuccess(true);

      // Actualizar sugerencias del agente con el contexto actualizado
      if (updatedContext && visitId) {
        await runClinicalAgent(visitId);
      }
    } catch (err) {
      console.error('Error al guardar el contexto MCP:', err);
    } finally {
      setSaving(false);
      
      // Ocultar el mensaje de éxito después de 3 segundos
      if (saveSuccess) {
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    }
  };

  // Estas funciones no se usan activamente en esta versión simplificada del componente

  // Manejar cambio de visita para comparación
  const handleComparisonVisitChange = async (visitId: string) => {
    if (!mcpManager || !visitId) return;
    
    try {
      const prevContext = await mcpManager.getContextForVisit(visitId);
      setPreviousContext(prevContext);
    } catch (err) {
      console.error('Error al cargar contexto para comparación:', err);
    }
  };

  // Copiar campos seleccionados de una visita previa
  const handleCopyFromPreviousVisit = async () => {
    if (!mcpManager || !previousVisit || !context) return;
    
    try {
      // Esta función se implementaría para permitir copiar campos específicos
      // de la visita seleccionada para comparación a la visita actual
      alert('Funcionalidad de copiar campos en desarrollo');
    } catch (err) {
      console.error('Error al copiar campos:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando detalles de la visita..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-300 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <Link 
            to="/dashboard"
            className="mt-4 inline-flex items-center text-sm font-medium text-red-700 hover:text-red-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" /> Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!context || !previousVisit) {
    return <div className="text-center p-8">No se encontraron datos.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Encabezado */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
                aria-label="Volver atrás"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Consulta: {format(new Date(context?.visitData?.date || new Date()), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </h1>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <Link to={`/patients/${patientInfo?.id || 'unknown'}`} className="hover:text-blue-600">
                    {patientInfo?.name}
                  </Link>
                  <span className="mx-2">•</span>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>{format(new Date(context?.visitData?.created_at || context?.visitData?.date || new Date()), "dd/MM/yyyy HH:mm")}</span>
                </div>
              </div>
            </div>
            
            {/* Acciones para esta visita */}
            <ActionPanel 
              visitId={visitId || ''}
              patientId={context?.visitData?.patient_id || ''}
              hasPreviousVisits={previousVisits.length > 0}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sistema de pestañas */}
        <Tabs 
          options={tabOptions} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />

        {/* Contenido de las pestañas */}
        <div className="mt-6">
          {/* Pestaña: Contexto Clínico */}
          {activeTab === 'contexto' && context && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <MCPEditor 
                  initialContext={context} 
                  onSave={handleSaveContext}
                  saving={saving}
                />
              </div>
            </div>
          )}

          {/* Pestaña: Audio */}
          {activeTab === 'audio' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <AudioCaptureSection visitId={visitId || ''} />
              </div>
            </div>
          )}

          {/* Pestaña: Comparación */}
          {activeTab === 'comparacion' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="mb-6">
                  <label htmlFor="compareVisit" className="block text-sm font-medium text-gray-700 mb-2">
                    Comparar con visita
                  </label>
                  <div className="flex gap-4">
                    <select
                      id="compareVisit"
                      value={previousVisit?.id}
                      onChange={(e) => handleComparisonVisitChange(e.target.value)}
                      className="block w-full max-w-lg border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {previousVisits.map(v => (
                        <option key={v.id} value={v.id}>
                          {format(new Date(v.date), "dd/MM/yyyy")} - {v.notes || 'Sin notas'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCopyFromPreviousVisit}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Copiar datos seleccionados
                    </button>
                  </div>
                </div>

                {context && previousContext && (
                  <AgentContextDiffViewer 
                    currentContext={context} 
                    previousContext={previousContext} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Pestaña: Métricas y Evolución */}
          {activeTab === 'metricas' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-medium text-gray-900">Métricas de Evolución Clínica</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Comparación de métricas clínicas y de uso entre visitas
                  </p>
                </div>
                
                <LongitudinalMetricsViewer visitId={visitId || ''} />
                
                {/* Si no hay métricas aún, ofrecer botón para generarlas */}
                <div className="mt-6 flex justify-end">
                  <p className="text-sm text-gray-500 mr-4 self-center">
                    Las métricas se generan automáticamente comparando esta visita con las anteriores
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitDetailPage; 