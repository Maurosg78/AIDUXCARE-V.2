/**
 * 🏥 SimpleConsultationPage SIMPLE - Versión simplificada para debugging
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

const SimpleConsultationPageSimple: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { currentTherapist } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      console.log('🏥 SIMPLE: Cargando paciente:', patientId);
      
      if (!patientId) {
        navigate('/clinical');
        return;
      }

      const patients = localStorageService.getAllPatients();
      const foundPatient = patients.find(p => p.id === patientId);

      if (!foundPatient) {
        alert('Paciente no encontrado');
        navigate('/clinical');
        return;
      }

      setPatient(foundPatient);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      navigate('/clinical');
    }
  }, [patientId, navigate]);

  const handleBack = () => {
    navigate('/clinical');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-[#2C3E50]">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return <div>Error: Paciente no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
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
              <p className="text-xs text-[#2C3E50]/60">Consulta Simple</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
          <div className="flex items-center space-x-4 mb-6">
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

          <div className="bg-[#5DA5A3]/5 rounded-lg p-6 border border-[#5DA5A3]/20 mb-6">
            <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">SUCCESS: Consulta Cargada Correctamente</h2>
            <p className="text-[#2C3E50]/70 mb-4">
              Esta es una versión simplificada para verificar que la navegación funciona sin errores.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-md p-4 border border-[#BDC3C7]/20">
                <h3 className="font-medium text-[#2C3E50] mb-2">Estado del Sistema</h3>
                <div className="text-sm text-[#2C3E50]/70 space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Navegación funcionando</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Autenticación activa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Paciente cargado: {patient.name}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-md p-4 border border-[#BDC3C7]/20">
                <h3 className="font-medium text-[#2C3E50] mb-2">Información del Paciente</h3>
                <ul className="text-sm text-[#2C3E50]/70 space-y-1">
                  <li>ID: {patient.id}</li>
                  <li>Edad: {patient.age > 0 ? `${patient.age} años` : 'No especificada'}</li>
                  <li>Condición: {patient.condition}</li>
                  <li>Registrado: {new Date(patient.createdAt).toLocaleDateString()}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={handleBack} className="px-6 py-2 text-[#2C3E50] border border-[#BDC3C7]/30 rounded-md hover:bg-[#F7F7F7] transition-colors">
              ← Volver a Pacientes
            </button>
            <button 
              onClick={() => alert('¡Navegación funcionando correctamente! El problema del logout está resuelto.')}
              className="btn-primary px-6 py-2"
            >
              Probar Función
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleConsultationPageSimple;
