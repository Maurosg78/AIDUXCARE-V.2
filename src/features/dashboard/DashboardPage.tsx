import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUser } from '../../core/auth/UserContext';
import { Visit } from '../../core/domain/visitType';
import { visitDataSourceSupabase } from '../../core/dataSources/visitDataSourceSupabase';
import { getLongitudinalMetricsByProfessional, getProfessionalActivitySummary, getWeeklyMetrics } from './dashboardServices';
import { VisitStatus } from '../../core/domain/visitType';

/**
 * Interfaz para los datos resumidos de actividad del profesional
 */
interface ActivitySummary {
  totalVisits: number;
  suggestionsGenerated: number;
  suggestionsAccepted: number;
  suggestionsIntegrated: number;
  timeSavedMinutes: number;
}

/**
 * Interfaz para datos de métricas semanales para gráficos
 */
interface WeeklyMetric {
  week: string;
  visits: number;
  suggestionsGenerated: number;
  suggestionsAccepted: number;
}

/**
 * Componente que muestra el panel de control para el profesional de salud
 */
const DashboardPage: React.FC = () => {
  const { user, profile } = useUser();
  const navigate = useNavigate();
  
  // Estados para almacenar datos
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    totalVisits: 0,
    suggestionsGenerated: 0,
    suggestionsAccepted: 0,
    suggestionsIntegrated: 0,
    timeSavedMinutes: 0
  });
  
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetric[]>([]);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Solo cargar datos si el usuario está autenticado
    if (user?.id) {
      loadDashboardData(user.id);
    }
  }, [user]);
  
  /**
   * Carga todos los datos necesarios para el panel de control
   */
  const loadDashboardData = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cargar resumen de actividad
      const summary = await getProfessionalActivitySummary(userId);
      setActivitySummary(summary);
      
      // Cargar métricas semanales para los gráficos
      const weeklyData = await getWeeklyMetrics(userId);
      setWeeklyMetrics(weeklyData);
      
      // Cargar visitas recientes
      const visits = await visitDataSourceSupabase.getVisitsByProfessionalId(userId);
      // Ordenar por fecha y limitar a las 5 más recientes
      setRecentVisits(visits.slice(0, 5));
      
    } catch (err) {
      setError("Error al cargar datos del panel de control: " + (err instanceof Error ? err.message : String(err)));
      console.error("Error cargando datos del panel:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Formatea minutos en horas y minutos
   */
  const formatTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  /**
   * Navega a la página de pacientes para crear una nueva visita
   */
  const handleNewVisit = () => {
    navigate('/patients');
  };
  
  /**
   * Formatea una fecha para mostrar
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };
  
  /**
   * Devuelve una clase de color según el estado de la visita
   */
  const getStatusClass = (status: VisitStatus): string => {
    switch (status) {
      case VisitStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case VisitStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case VisitStatus.SCHEDULED:
        return 'bg-yellow-100 text-yellow-800';
      case VisitStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Control Profesional</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          {/* Sección de resumen de actividad */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-500">Visitas totales</h2>
              <p className="text-3xl font-bold">{activitySummary.totalVisits}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-500">Sugerencias integradas</h2>
              <p className="text-3xl font-bold">{activitySummary.suggestionsIntegrated} <span className="text-sm text-gray-500">/ {activitySummary.suggestionsGenerated}</span></p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-500">Tasa de aceptación</h2>
              <p className="text-3xl font-bold">
                {activitySummary.suggestionsGenerated > 0 
                  ? Math.round((activitySummary.suggestionsAccepted / activitySummary.suggestionsGenerated) * 100)
                  : 0}%
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-500">Tiempo ahorrado</h2>
              <p className="text-3xl font-bold">{formatTimeString(activitySummary.timeSavedMinutes)}</p>
            </div>
          </div>
          
          {/* Sección de gráfico de evolución semanal */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Evolución de uso (últimas 4 semanas)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyMetrics}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="visits" 
                    name="Visitas" 
                    stroke="#3B82F6" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="suggestionsGenerated" 
                    name="Sugerencias generadas" 
                    stroke="#10B981" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="suggestionsAccepted" 
                    name="Sugerencias aceptadas" 
                    stroke="#F59E0B" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Sección de visitas recientes y botón de nueva visita */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visitas recientes */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="border-b px-6 py-3">
                <h2 className="text-xl font-bold">Visitas recientes</h2>
              </div>
              
              <div className="overflow-x-auto">
                {recentVisits.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paciente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sugerencias
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentVisits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/visits/${visit.id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Paciente {visit.patient_id.slice(-4)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(visit.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">N/A</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(visit.status)}`}>
                              {visit.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay visitas recientes
                  </div>
                )}
              </div>
            </div>
            
            {/* Panel de acciones rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Acciones rápidas</h2>
              
              <button
                onClick={handleNewVisit}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nueva visita
              </button>
              
              <div className="bg-blue-50 rounded-md p-4 mt-4">
                <h3 className="text-md font-medium text-blue-800 mb-2">Sugerencias clínicas</h3>
                <p className="text-sm text-blue-600">
                  Las sugerencias clínicas mejoran la eficiencia de la documentación y ayudan a identificar aspectos relevantes para la atención del paciente.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage; 