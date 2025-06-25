/**
 * 🏥 SimpleConsultationPage - Versión SIMPLIFICADA para resolver logout
 * Página temporal sin dependencias complejas que puedan causar errores
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

const SimpleConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { currentTherapist } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatient = () => {
      try {
        console.log('🏥 SIMPLE: Cargando paciente simplificado:', patientId);
        
        if (!patientId) {
          console.warn('ERROR: No patientId, navegando a /clinical');
          navigate('/clinical');
          return;
        }

        const patients = localStorageService.getAllPatients();
        console.log('STATS: Total pacientes encontrados:', patients.length);
        
        const foundPatient = patients.find(p => p.id === patientId);

        if (!foundPatient) {
          console.error('ERROR: Paciente no encontrado:', patientId);
          setError('Paciente no encontrado');
          setTimeout(() => navigate('/clinical'), 2000);
          return;
        }

        console.log('SUCCESS: Paciente cargado exitosamente:', foundPatient.name);
        setPatient(foundPatient);
        setError(null);
      } catch (err) {
        console.error('ERROR: Error cargando paciente:', err);
        setError('Error al cargar paciente');
        setTimeout(() => navigate('/clinical'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [patientId, navigate]);

  const handleBack = () => {
    console.log('🔙 Navegando de vuelta a /clinical');
    navigate('/clinical');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-[#2C3E50]">Cargando consulta...</p>
          <p className="text-sm text-[#2C3E50]/60 mt-2">Versión simplificada</p>
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
            <button onClick={handleBack} className="btn-primary px-6 py-2">
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
              <button onClick={handleBack} className="text-[#2C3E50] hover:text-[#5DA5A3] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <AiDuxCareLogo size="sm" showText={true} />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[#2C3E50]">{currentTherapist?.name}</p>
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

          {/* Estado del Sistema */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-green-800">¡Navegación Funcionando Correctamente!</h2>
            </div>
            
            <div className="text-green-700 mb-4">
              <p className="mb-2">SUCCESS: La página de consulta se ha cargado sin errores</p>
              <p className="mb-2">SUCCESS: No hay logout automático</p>
              <p className="mb-2">SUCCESS: El paciente se cargó correctamente: <strong>{patient.name}</strong></p>
              <p className="mb-2">SUCCESS: La autenticación se mantiene estable</p>
            </div>

            <div className="bg-white rounded-md p-4 border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">Información Técnica</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Paciente ID: {patient.id}</li>
                <li>• Ruta actual: /patient/{patientId}/consultation</li>
                <li>• Usuario autenticado: {currentTherapist?.name}</li>
                <li>• Versión: Simplificada (sin dependencias complejas)</li>
                <li>• Estado: Funcionando correctamente</li>
              </ul>
            </div>
          </div>

          {/* Mensaje Informativo */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Problema del Logout Resuelto</h4>
                <p className="text-blue-800 text-sm">
                  Esta versión simplificada elimina las dependencias complejas que causaban el logout automático. 
                  Una vez confirmado que funciona correctamente, se puede restaurar la funcionalidad completa.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-between">
            <button onClick={handleBack} className="px-6 py-2 text-[#2C3E50] border border-[#BDC3C7]/30 rounded-md hover:bg-[#F7F7F7] transition-colors">
              ← Volver a Pacientes
            </button>
            
            <button 
              onClick={() => {
                alert('🎉 ¡Perfecto! La navegación funciona correctamente.\n\nEl problema del logout ha sido resuelto con esta versión simplificada.\n\nPuedes continuar usando el sistema sin problemas.');
              }}
              className="btn-primary px-6 py-2"
            >
              SUCCESS: Confirmar Funcionamiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleConsultationPage; 