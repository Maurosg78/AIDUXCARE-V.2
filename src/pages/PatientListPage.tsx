/**
 * NOTES: PATIENT LIST PAGE - IDENTIDAD VISUAL OFICIAL AIDUXCARE
 * Dashboard optimizado con diseño oficial y navegación fluida
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { localStorageService } from '@/services/LocalStorageService';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';

// Tipo para pacientes (compatible con LocalStorageService)
interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  allergies?: string[];      // Opcional para compatibilidad
  medications?: string[];    // Opcional para compatibilidad  
  clinicalHistory?: string;  // Opcional para compatibilidad
  derivadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

// === COMPONENTE PRINCIPAL ===
const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTherapist, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === CARGAR DATOS ===
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('NOTES: Cargando lista de pacientes desde LocalStorage...');
        
        // Usar LocalStorageService en lugar de API
        const patientList = localStorageService.getAllPatients();
        
        console.log('SUCCESS: Pacientes cargados exitosamente:', patientList.length);
        setPatients(patientList);
        setFilteredPatients(patientList);
        
      } catch (error) {
        console.error('ERROR: Error al cargar lista de pacientes:', error);
        setError('Error al cargar la lista de pacientes');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();

    // Recargar cuando regresemos de crear un paciente
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPatients();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadPatients);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadPatients);
    };
  }, []);

  // === FILTRO DE BÚSQUEDA ===
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // === HANDLERS ===
  const handlePatientClick = (patientId: string) => {
    console.log('SEARCH Navegando a ficha del paciente:', patientId);
    navigate(`/patient/${patientId}`);
  };

  const handleCreateNewPatient = () => {
    navigate('/patient/new');
  };

  const handleBackToWelcome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // === ESTADO DE CARGA ===
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-[#2C3E50]">Cargando historias clínicas...</p>
        </div>
      </div>
    );
  }

  // === ESTADO DE ERROR ===
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] to-[#FF6F61]/10 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-[#FF6F61]/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[#FF6F61]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#2C3E50]">Error al Cargar</h2>
          <p className="text-[#2C3E50]/70">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // === CONTENIDO PRINCIPAL ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header con identidad oficial */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <AiDuxCareLogo size="sm" />
            </div>

            {/* Info del terapeuta y acciones */}
            <div className="flex items-center space-x-4">
              {currentTherapist && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[#2C3E50]">{currentTherapist.name}</p>
                  <p className="text-xs text-[#2C3E50]/60">Profesional de la salud</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-[#5DA5A3] hover:text-[#4A8280] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de sección */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[#2C3E50] mb-2">NOTES: Lista Pacientes</h2>
              <p className="text-[#2C3E50]/70">
                Historias Clínicas • {filteredPatients.length} de {patients.length} registros activos
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-[#A8E6CF]/20 px-4 py-2 rounded-xl">
                <span className="text-[#2C3E50] font-semibold">{patients.length}</span>
                <span className="text-[#2C3E50]/60 text-sm ml-1">Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[#BDC3C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
              placeholder="Buscar por nombre, email o motivo de consulta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#BDC3C7] hover:text-[#5DA5A3] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {patients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#A8E6CF]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">¡Bienvenido a AiDuxCare!</h3>
            <p className="text-[#2C3E50]/70 mb-8 max-w-md mx-auto">
              Comienza creando tu primer paciente para ver la magia<br/>
              de la documentación médica automática
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleCreateNewPatient}
                className="btn-primary group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Primer Paciente
              </button>
              <button 
                onClick={handleBackToWelcome}
                className="px-6 py-3 bg-white border border-[#BDC3C7]/30 text-[#2C3E50] rounded-xl hover:bg-[#F7F7F7] transition-colors"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Volver al Inicio
              </button>
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#FF6F61]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-[#FF6F61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">Sin resultados</h3>
            <p className="text-[#2C3E50]/70 mb-8">
              No se encontraron pacientes que coincidan con "{searchTerm}"
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-white border border-[#BDC3C7]/30 text-[#2C3E50] rounded-xl hover:bg-[#F7F7F7] transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <div 
                key={patient.id} 
                role="button" tabIndex={0} onClick={() => handlePatientClick(patient.id)} onKeyDown={(e) => e.key === "Enter" && handlePatientClick(patient.id)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#BDC3C7]/20 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-lg">
                      {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#2C3E50]/60">
                      {patient.age ? `${patient.age} años` : 'Edad no especificada'}
                    </div>
                    <div className="text-xs text-[#2C3E50]/50">
                      {new Date(patient.createdAt).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#2C3E50] group-hover:text-[#5DA5A3] transition-colors">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-[#2C3E50]/70">{patient.email}</p>
                  <div className="bg-[#A8E6CF]/20 px-3 py-1 rounded-lg">
                    <p className="text-sm text-[#2C3E50] font-medium">{patient.condition}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-[#2C3E50]/60">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Historia clínica</span>
                  </div>
                  <svg className="w-5 h-5 text-[#BDC3C7] group-hover:text-[#5DA5A3] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón flotante para crear paciente */}
        {patients.length > 0 && (
          <button
            onClick={handleCreateNewPatient}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white rounded-full shadow-2xl hover:shadow-[#5DA5A3]/25 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </main>
    </div>
  );
};

export default PatientListPage; 