import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientDataSourceSupabase } from '../../core/dataSources/patientDataSourceSupabase';
import { Patient } from '../../core/domain/patientType';
import EmptyState from '../../shared/components/UI/EmptyState';

const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const data = await patientDataSourceSupabase.getAllPatients();
        setPatients(data);
      } catch (err) {
        console.error('Error al cargar pacientes:', err);
        setError('Error al cargar la lista de pacientes');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleCreateVisit = (patientId: string) => {
    navigate(`/visits/new?patientId=${patientId}`);
  };

  // Formatear fecha de nacimiento
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="patients-loading">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="patients-error">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Pacientes</h1>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition"
        >
          Volver al Dashboard
        </Link>
      </div>

      {patients.length === 0 ? (
        <div data-testid="patients-empty">
          <EmptyState
            title="Aún no hay pacientes registrados"
            description="No se han encontrado pacientes en el sistema."
            actionLabel="Crear paciente"
            onActionClick={() => navigate('/patients/new')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md" data-testid="patients-list">
          <ul className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <li key={patient.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        <Link to={`/patient/${patient.id}`} className="hover:underline">
                          {patient.full_name || patient.name}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500">
                        Fecha de nacimiento: {formatDate(patient.date_of_birth)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateVisit(patient.id)}
                    className="ml-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                    data-testid={`create-visit-${patient.id}`}
                  >
                    Crear visita
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PatientListPage; 