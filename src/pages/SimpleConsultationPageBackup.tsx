/**
 * 🏥 SimpleConsultationPage BACKUP - Versión simplificada sin errores
 * Página de consulta básica para debugging del problema de logout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';
import { localStorageService } from '@/services/LocalStorageService';

interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  createdAt: string;
  updatedAt: string;
}

const SimpleConsultationPageBackup: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { currentTherapist } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatient = () => {
      try {
        console.log('🏥 BACKUP: Cargando paciente simplificado:', patientId);
        
        if (!patientId) {
          setError('No se proporcionó ID de paciente');
          return;
        }

        const patients = localStorageService.getAllPatients();
        const foundPatient = patients.find(p => p.id === patientId);

        if (!foundPatient) {
          setError('Paciente no encontrado');
          return;
        }

        console.log('SUCCESS: BACKUP: Paciente cargado:', foundPatient.name);
        setPatient(foundPatient);
        setError(null);
      } catch (err) {
        console.error('ERROR: BACKUP: Error cargando paciente:', err);
        setError('Error al cargar paciente');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [patientId]);

  const handleBack = () => {
    console.log('🔙 BACKUP: Navegando de vuelta a /clinical');
    navigate('/clinical');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-[#2C3E50]">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error en la Consulta</h2>
            <p className="text-gray-600 mb-6">{error || 'Paciente no encontrado'}</p>
            <button
              onClick={handleBack}
              className="btn-primary px-6 py-2"
            >
              Volver a Pacientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-[#2C3E50] hover:text-[#5DA5A3] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <AiDuxCareLogo size="sm" showText={true} />
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-[#2C3E50]">{currentTherapist?.name || 'Dr. Usuario'}</p>
              <p className="text-xs text-[#2C3E50]/60">Consulta Simplificada</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
          {/* Info del Paciente */}
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-[#BDC3C7]/20">
            <div className="w-16 h-16 bg-[#5DA5A3]/10 rounded-full flex items-center justify-center">
              <span className="text-[#5DA5A3] font-semibold text-lg">
                {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#2C3E50]">{patient.name}</h1>
              <p className="text-[#2C3E50]/60">{patient.condition}</p>
              <div className="flex items-center space-x-4 mt-1 text-sm text-[#2C3E50]/60">
                {patient.age > 0 && <span>{patient.age} años</span>}
                {patient.phone && <span>{patient.phone}</span>}
              </div>
            </div>
          </div>

          {/* Contenido de la Consulta */}
          <div className="space-y-6">
            <div className="bg-[#5DA5A3]/5 rounded-lg p-6 border border-[#5DA5A3]/20">
              <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">
                🏥 Consulta Simplificada
              </h2>
              <p className="text-[#2C3E50]/70 mb-4">
                Esta es una versión simplificada de la página de consulta para debugging. 
                La funcionalidad completa será restaurada una vez resuelto el problema de logout.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-md p-4 border border-[#BDC3C7]/20">
                  <h3 className="font-medium text-[#2C3E50] mb-2">Información del Paciente</h3>
                  <ul className="text-sm text-[#2C3E50]/70 space-y-1">
                    <li>Nombre: {patient.name}</li>
                    <li>Edad: {patient.age > 0 ? `${patient.age} años` : 'No especificada'}</li>
                    <li>Condición: {patient.condition}</li>
                    <li>Registrado: {new Date(patient.createdAt).toLocaleDateString()}</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-md p-4 border border-[#BDC3C7]/20">
                  <h3 className="font-medium text-[#2C3E50] mb-2">Estado de la Consulta</h3>
                  <div className="text-sm text-[#2C3E50]/70 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Página cargada correctamente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Paciente encontrado</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Sin errores de autenticación</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-2 text-[#2C3E50] border border-[#BDC3C7]/30 rounded-md hover:bg-[#F7F7F7] transition-colors"
              >
                ← Volver a Pacientes
              </button>
              
              <button
                onClick={() => {
                  console.log('LAUNCH: Navegando a consulta completa para paciente:', patient.id);
                  // Navegar a la página de consulta completa
                  navigate(`/patient/${patient.id}/consultation/complete`);
                }}
                className="btn-primary px-6 py-2"
              >
                Iniciar Consulta Completa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleConsultationPageBackup; 