import { vi } from "vitest";
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { patientDataSourceSupabase } from "@/core/dataSources/patientDataSourceSupabase";
import { visitDataSourceSupabase } from "@/core/dataSources/visitDataSourceSupabase";
import { Patient } from "@/core/domain/patientType";
import { Visit, VisitStatus } from "@/core/domain/visitType";
import { AuditLogger } from '@/core/audit/AuditLogger';
import { v4 as uuidv4 } from 'uuid';
import LongitudinalMetricsViewer from "@/shared/components/Metrics/LongitudinalMetricsViewer";
import AgentLongitudinalImpact from "@/shared/components/Agent/AgentLongitudinalImpact";
import MCPContextDiffDashboard from "@/shared/components/MCP/MCPContextDiffDashboard";

// Contexto de usuario simulado para pruebas
const mockUser = {
  id: 'professional-1',
  email: 'demo@aiduxcare.com'
};

interface PatientDetailPageProps {}

const PatientDetailPage: React.FC<PatientDetailPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Usar usuario simulado para pruebas
  const user = mockUser;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingVisit, setIsCreatingVisit] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [newVisitNotes, setNewVisitNotes] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);

  // Cargar datos del paciente y sus visitas
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) {
        setError('ID de paciente no proporcionado');
        setLoading(false);
        return;
      }

      try {
        const patientData = await patientDataSourceSupabase.getPatientById(id);
        if (!patientData) {
          setError('Paciente no encontrado');
          setLoading(false);
          return;
        }

        setPatient(patientData);

        // Obtener visitas
        const visitsData = await visitDataSourceSupabase.getVisitsByPatientId(id);
        setVisits(visitsData);

        setLoading(false);
      } catch (err) {
        console.error('Error al obtener datos:', err);
        setError('Error al cargar la información del paciente');
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  // Crear una nueva visita
  const handleCreateVisit = async () => {
    if (!id || !user?.id) return;

    try {
      const visitId = uuidv4();
      const newVisit: Visit = {
        id: visitId,
        patient_id: id,
        professional_id: user.id,
        date: new Date(newVisitDate).toISOString(),
        status: VisitStatus.IN_PROGRESS,
        notes: newVisitNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await visitDataSourceSupabase.createVisit(newVisit);
      
      // Registrar en el log de auditoría
      await AuditLogger.log('visit_created', {
        user_id: user.id,
        entity_id: visitId,
        entity_type: 'visit',
        visit_date: newVisit.date,
        patient_id: id
      });

      // Navegar a la página de la nueva visita
      navigate(`/visits/${visitId}`);
    } catch (err) {
      console.error('Error al crear visita:', err);
      // Aquí podrías mostrar un mensaje de error
    }
  };

  // Función helper para formatear fechas
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  // Badge para mostrar el estado de la visita
  const getStatusBadge = (status: VisitStatus) => {
    let color = 'bg-gray-100 text-gray-800';
    let text = 'Desconocido';

    switch (status) {
      case VisitStatus.SCHEDULED:
        color = 'bg-blue-100 text-blue-800';
        text = 'Programada';
        break;
      case VisitStatus.IN_PROGRESS:
        color = 'bg-yellow-100 text-yellow-800';
        text = 'En progreso';
        break;
      case VisitStatus.COMPLETED:
        color = 'bg-green-100 text-green-800';
        text = 'Completada';
        break;
      case VisitStatus.CANCELLED:
        color = 'bg-red-100 text-red-800';
        text = 'Cancelada';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-600">{error || 'Paciente no encontrado'}</p>
        </div>
      </div>
    );
  }

  // Ordenar visitas por fecha (más recientes primero)
  const sortedVisits = [...visits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {patient && (
        <>
          <div className="bg-white shadow-sm rounded-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Ficha de Paciente</h1>
              <Link
                to="/"
                className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition"
              >
                Volver al inicio
              </Link>
            </div>
            
            <div className="flex items-start space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{patient.full_name || patient.name}</h2>
                <p className="text-gray-600">ID: {patient.id}</p>
                <p className="text-gray-600">
                  {patient.date_of_birth && `Fecha de nacimiento: ${formatDate(patient.date_of_birth)}`}
                </p>
                {patient.email && <p className="text-gray-600">Email: {patient.email}</p>}
              </div>
            </div>
            
            {/* Información adicional del paciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Datos demográficos</h3>
                <p className="text-sm text-gray-600">Género: {patient.gender || 'No especificado'}</p>
                <p className="text-sm text-gray-600">Teléfono: {patient.phone || 'No especificado'}</p>
                <p className="text-sm text-gray-600">Dirección: {patient.address || 'No especificada'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Datos clínicos</h3>
                <p className="text-sm text-gray-600">Alergias: {patient.allergies || 'No registradas'}</p>
                <p className="text-sm text-gray-600">Medicación actual: {patient.current_medication || 'No registrada'}</p>
              </div>
            </div>

            {/* Control para mostrar métricas longitudinales */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className={`px-4 py-2 text-sm rounded-md font-medium flex items-center ${
                  showMetrics 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showMetrics ? 'Ocultar Métricas' : 'Mostrar Métricas de Evolución'}
              </button>
            </div>
          </div>
          
          {/* Sección de métricas longitudinales (condicional) */}
          {showMetrics && patient.id && (
            <div className="mb-6">
              <LongitudinalMetricsViewer patientId={patient.id} />
            </div>
          )}
          
          {/* Sección de historial de visitas */}
          <div className="bg-white shadow-sm rounded-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Historial de Visitas</h2>
              
              <button
                onClick={() => setIsCreatingVisit(!isCreatingVisit)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                {isCreatingVisit ? 'Cancelar' : 'Nueva Visita'}
              </button>
            </div>
            
            {/* Formulario para crear una nueva visita */}
            {isCreatingVisit && (
              <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-3">Crear nueva visita para {patient.full_name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de la visita</label>
                    <input
                      id="visitDate"
                      type="date"
                      value={newVisitDate}
                      onChange={(e) => setNewVisitDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Seleccionar fecha de visita"
                    />
                  </div>
                  <div>
                    <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                    <input
                      id="visitNotes"
                      type="text"
                      value={newVisitNotes}
                      onChange={(e) => setNewVisitNotes(e.target.value)}
                      placeholder="Motivo de la consulta, etc."
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateVisit}
                    disabled={!newVisitDate}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Crear Visita
                  </button>
                </div>
              </div>
            )}
            
            {/* Lista de visitas */}
            {sortedVisits.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-md text-center border border-gray-200">
                <p className="text-gray-600">No hay visitas registradas para este paciente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sortedVisits.map((visit, index) => (
                  <div key={visit.id} className="border rounded-md p-4 hover:border-blue-300 transition">
                    <div className="flex justify-between items-center">
                      <Link
                        to={`/visits/${visit.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 transition"
                      >
                        Visita del {formatDate(visit.date)}
                      </Link>
                      {getStatusBadge(visit.status)}
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row sm:justify-between">
                      <div className="text-sm text-gray-600">
                        {visit.notes || 'Sin notas adicionales'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 sm:mt-0">
                        Creada: {format(new Date(visit.created_at || visit.date), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-3">
                      <Link
                        to={`/visits/${visit.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 transition"
                      >
                        Ver detalles
                      </Link>
                    </div>
                    
                    {/* Mostrar métricas resumidas para la visita más reciente si hay más de una visita */}
                    {index === 0 && sortedVisits.length > 1 && (
                      <div className="mt-4">
                        <LongitudinalMetricsViewer visitId={visit.id} compactView={true} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Nuevo componente: Impacto longitudinal del agente */}
          {patient.id && (
            <div className="mb-6">
              <AgentLongitudinalImpact patientId={patient.id} />
            </div>
          )}
          
          {/* Nuevo componente: Comparador de Contexto MCP */}
          {patient.id && visits.length > 1 && (
            <div className="mb-6">
              <MCPContextDiffDashboard 
                visits={visits} 
                patientId={patient.id} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientDetailPage; 