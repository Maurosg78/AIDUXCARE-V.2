import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientApiService } from '../core/api/patientApi';
import { Patient } from '../core/types/patient';
import { ApiError } from '../core/api/patientApi';

export default function PatientCompletePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) {
        navigate('/');
        return;
      }
      
      try {
        const patientData = await PatientApiService.getPatient(id);
        setPatient(patientData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Error al cargar los datos del paciente');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Paciente no encontrado
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <button
            onClick={() => navigate('/')}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Volver
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Información Personal</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Correo Electrónico</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(patient.birthDate).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Motivo de la Consulta</h2>
            <p className="text-sm text-gray-900">{patient.reasonForConsultation}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Información del Registro</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(patient.createdAt._seconds * 1000).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(patient.updatedAt._seconds * 1000).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 