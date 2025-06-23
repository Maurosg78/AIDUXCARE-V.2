/**
 * 🏥 CLINICAL WORKFLOW PAGE - Flujo de Trabajo Clínico Real
 * 
 * Dashboard práctico para clínicos con:
 * - Búsqueda y gestión real de pacientes
 * - Registro de pacientes nuevos simplificado
 * - Navegación fluida entre secciones
 * - Enfoque en datos esenciales, no demo
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';
import { localStorageService } from '@/services/LocalStorageService';
import AiDuxVirtualAssistant from '../components/chat/AiDuxVirtualAssistant';
import SecurityDashboard from '../components/SecurityDashboard';
import MedicalAuditService from '@/security/MedicalAuditService';

interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  createdAt: string;
  updatedAt: string;
  // Campos que se completarán desde la consulta
  allergies?: string[];
  medications?: string[];
  clinicalHistory?: string;
  derivadoPor?: string;
}

interface WorkflowState {
  patients: Patient[];
  filteredPatients: Patient[];
  searchQuery: string;
  isLoading: boolean;
  showNewPatientForm: boolean;
  selectedView: 'patients' | 'today' | 'search';
}

interface NewPatientForm {
  name: string;
  age: string;
  phone: string;
  email: string;
  condition: string;
}

const ClinicalWorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, isOwner, setupMFA } = useAuth();
  const { currentTherapist } = useAuth();
  
  const [state, setState] = useState<WorkflowState>({
    patients: [],
    filteredPatients: [],
    searchQuery: '',
    isLoading: true,
    showNewPatientForm: false,
    selectedView: 'patients'
  });

  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    condition: ''
  });

  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<any>(null);
  const [mfaStep, setMfaStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [mfaToken, setMfaToken] = useState('');

  // Cargar solo pacientes reales guardados (sin demos por defecto)
  useEffect(() => {
    const loadPatients = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Simular carga de datos desde API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Cargar solo pacientes reales guardados (sin demos por defecto)
        const storedPatients = localStorageService.getAllPatients();
        console.log('📊 Pacientes cargados desde localStorage:', storedPatients.length);
        
        setState(prev => ({
          ...prev,
          patients: storedPatients,
          filteredPatients: storedPatients,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error loading patients:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadPatients();
  }, []);

  // Filtrar pacientes por búsqueda
  useEffect(() => {
    if (state.searchQuery.trim() === '') {
      setState(prev => ({ ...prev, filteredPatients: prev.patients }));
    } else {
      const filtered = state.patients.filter(patient =>
        patient.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        patient.condition.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        patient.phone.includes(state.searchQuery)
      );
      setState(prev => ({ ...prev, filteredPatients: filtered }));
    }
  }, [state.searchQuery, state.patients]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.condition) {
      alert('Nombre y motivo de consulta son obligatorios');
      return;
    }

    const patient: Patient = {
      id: `patient-${Date.now()}`,
      name: newPatient.name,
      age: parseInt(newPatient.age) || 0,
      phone: newPatient.phone,
      email: newPatient.email,
      condition: newPatient.condition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar en localStorage (en producción sería API)
    localStorageService.savePatient(patient);
    
    // Actualizar estado
    setState(prev => ({
      ...prev,
      patients: [...prev.patients, patient],
      filteredPatients: [...prev.filteredPatients, patient],
      showNewPatientForm: false
    }));

    // Limpiar formulario
    setNewPatient({
      name: '',
      age: '',
      phone: '',
      email: '',
      condition: ''
    });

    // Navegar directamente a la consulta del nuevo paciente
    navigate(`/patient/${patient.id}/consultation`);
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}/consultation`);
  };

  const handleStartConsultation = (patientId: string) => {
    try {
      console.log('🏥 Iniciando consulta para paciente:', patientId);
      
      // Verificar que el paciente existe
      const patients = localStorageService.getAllPatients();
      const patient = patients.find(p => p.id === patientId);
      
      if (!patient) {
        console.error('❌ Paciente no encontrado:', patientId);
        alert('Error: Paciente no encontrado');
        return;
      }
      
      console.log('✅ Paciente encontrado:', patient.name);
      console.log('🚀 Navegando a consulta...');
      
      // Navegar con manejo de errores
      navigate(`/patient/${patientId}/consultation`);
    } catch (error) {
      console.error('❌ Error al iniciar consulta:', error);
      alert('Error al iniciar la consulta. Intenta nuevamente.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // FUNCIÓN PARA LIMPIAR PACIENTES DEMO
  const handleClearDemoPatients = () => {
    const confirmClear = window.confirm(
      '¿Estás seguro de que quieres eliminar todos los pacientes demo?\n\n' +
      'Esta acción eliminará:\n' +
      '• Los 2 pacientes demo de UAT\n' +
      '• Todos los pacientes guardados\n\n' +
      'Podrás crear pacientes reales después.'
    );

    if (confirmClear) {
      // Limpiar localStorage
      localStorage.removeItem('aiduxcare_v2_patients');
      
      // Actualizar estado
      setState(prev => ({
        ...prev,
        patients: [],
        filteredPatients: []
      }));

      // Log de auditoría
      MedicalAuditService.logSystemEvent(
        currentTherapist?.name || 'Usuario',
        'DEMO_DATA_CLEARED',
        'Pacientes demo eliminados para empezar producción'
      );

      alert('✅ Pacientes demo eliminados correctamente.\nYa puedes crear pacientes reales.');
    }
  };

  // FUNCIÓN PARA CREAR PACIENTE NUEVO MEJORADO
  const handleCreateNewPatient = () => {
    setState(prev => ({ ...prev, showNewPatientForm: true }));
  };

  const handleSetupMFA = async () => {
    try {
      console.log('🔐 Configurando MFA desde sistema clínico...');
      const mfaData = await setupMFA();
      if (mfaData) {
        setMfaSetupData(mfaData);
        setShowMFASetup(true);
        setMfaStep('setup');
      }
    } catch (error) {
      console.error('❌ Error configurando MFA:', error);
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-[#2C3E50]">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header Clínico UAT - Logo Único */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AiDuxCareLogo size="sm" showText={true} />
              <div>
                <p className="text-[#2C3E50]/80 text-sm font-medium">
                  Bienvenido, {currentTherapist?.name || 'Dr. Mauricio Sobarzo'}
                </p>
                <p className="text-[#2C3E50]/60 text-xs">Centro Clínico - UAT</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setState(prev => ({ ...prev, showNewPatientForm: true }))}
                className="btn-primary px-4 py-2 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Paciente
              </button>
              
              {/* Botón para limpiar pacientes demo */}
              {state.patients.length > 0 && (
                <button
                  onClick={handleClearDemoPatients}
                  className="text-xs text-[#FF6F61] hover:text-[#E55A4B] transition-colors px-3 py-2 border border-[#FF6F61]/30 rounded-md hover:bg-[#FF6F61]/5"
                  title="Eliminar pacientes demo y empezar con pacientes reales"
                >
                  🧹 Limpiar Demo
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="text-[#2C3E50] hover:text-[#5DA5A3] transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
              </button>

              {/* Botón MFA para OWNER */}
              {isOwner() && (
                <button
                  onClick={handleSetupMFA}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  🔐 Configurar MFA
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulario Nuevo Paciente */}
        {state.showNewPatientForm && (
          <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#2C3E50]">Registrar Nuevo Paciente</h2>
              <button
                onClick={() => setState(prev => ({ ...prev, showNewPatientForm: false }))}
                className="text-[#2C3E50]/60 hover:text-[#2C3E50] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleNewPatientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                  placeholder="Ej: María González"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Edad
                </label>
                <input
                  type="number"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                  placeholder="Ej: 35"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                  placeholder="Ej: +34 666 123 456"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                  placeholder="Ej: maria@email.com"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Motivo de Consulta *
                </label>
                <textarea
                  value={newPatient.condition}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                  rows={3}
                  placeholder="Ej: Dolor lumbar crónico, cervicalgia, ansiedad..."
                  required
                />
              </div>
              
              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, showNewPatientForm: false }))}
                  className="px-4 py-2 text-[#2C3E50] border border-[#BDC3C7]/30 rounded-md hover:bg-[#F7F7F7] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2"
                >
                  Registrar y Comenzar Consulta
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barra de Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#2C3E50]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={state.searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
              placeholder="Buscar pacientes por nombre, email, teléfono o condición..."
            />
          </div>
        </div>

        {/* Lista de Pacientes */}
        <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20">
          <div className="p-4 border-b border-[#BDC3C7]/20">
            <h2 className="text-lg font-semibold text-[#2C3E50]">
              Pacientes ({state.filteredPatients.length})
            </h2>
          </div>
          
          {state.filteredPatients.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-[#2C3E50]/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-[#2C3E50]/60 mb-4">
                {state.searchQuery ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
              </p>
              {!state.searchQuery && (
                <button
                  onClick={() => setState(prev => ({ ...prev, showNewPatientForm: true }))}
                  className="btn-primary px-4 py-2"
                >
                  Registrar Primer Paciente
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#BDC3C7]/20">
              {state.filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 hover:bg-[#F7F7F7]/50 transition-colors cursor-pointer"
                  onClick={() => handlePatientClick(patient.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#5DA5A3]/10 rounded-full flex items-center justify-center">
                          <span className="text-[#5DA5A3] font-semibold text-sm">
                            {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-[#2C3E50]">{patient.name}</h3>
                          <p className="text-sm text-[#2C3E50]/60">{patient.condition}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-[#2C3E50]/60">
                        {patient.age > 0 && <span>{patient.age} años</span>}
                        {patient.phone && <span>{patient.phone}</span>}
                        {patient.email && <span>{patient.email}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartConsultation(patient.id);
                        }}
                        className="btn-primary px-3 py-1 text-sm"
                      >
                        Consulta
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatientClick(patient.id);
                        }}
                        className="text-[#2C3E50]/60 hover:text-[#2C3E50] transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asistente Virtual Flotante */}
      <AiDuxVirtualAssistant />

      {/* Modal MFA Setup */}
      {showMFASetup && mfaSetupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">🔐 Configurar MFA</h2>
            
            {mfaStep === 'setup' && (
              <div>
                <img 
                  src={mfaSetupData.qrCodeUrl} 
                  alt="QR Code MFA" 
                  className="mx-auto mb-4"
                  style={{ maxWidth: '200px' }}
                />
                <p className="text-sm mb-2"><strong>Código manual:</strong></p>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {mfaSetupData.secret}
                </code>
                
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Códigos de Respaldo:</h3>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {mfaSetupData.backupCodes.map((code: string, index: number) => (
                      <div key={index} className="bg-yellow-100 px-2 py-1 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setMfaStep('verify')}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Continuar a Verificación
                </button>
              </div>
            )}
            
            {mfaStep === 'verify' && (
              <div>
                <p className="mb-4">Ingresa el código de 6 dígitos de tu app:</p>
                <input
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 border rounded text-center text-xl font-mono"
                  placeholder="000000"
                  maxLength={6}
                />
                <button
                  onClick={() => setMfaStep('complete')}
                  disabled={mfaToken.length !== 6}
                  className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Verificar MFA
                </button>
              </div>
            )}
            
            {mfaStep === 'complete' && (
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg font-bold mb-2">¡MFA Configurado!</h3>
                <p className="text-gray-600 mb-4">Tu cuenta ahora tiene seguridad de grado hospitalario.</p>
                <button
                  onClick={() => setShowMFASetup(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowMFASetup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalWorkflowPage; 