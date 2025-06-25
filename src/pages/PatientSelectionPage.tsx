/**
 * 👥 PATIENT SELECTION - Búsqueda Inteligente de Pacientes
 * Selección de pacientes con IA predictiva y filtros inteligentes
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastVisit: string;
  nextAppointment?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'new' | 'discharged';
  aiScore: number;
  aiInsights: string[];
  urgencyFlags: string[];
  avatar?: string;
  phone: string;
  email: string;
  treatmentProgress: number;
}

interface SearchState {
  query: string;
  filters: {
    riskLevel: string[];
    status: string[];
    condition: string[];
  };
  sortBy: 'name' | 'risk' | 'lastVisit' | 'aiScore';
  sortOrder: 'asc' | 'desc';
}

const PatientSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filters: {
      riskLevel: [],
      status: [],
      condition: []
    },
    sortBy: 'aiScore',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulación de carga de pacientes
    const loadPatients = async () => {
      const mockPatients: Patient[] = [
        {
          id: '1',
          name: 'María González',
          age: 45,
          condition: 'Lumbalgia crónica',
          lastVisit: '2024-01-10',
          nextAppointment: '2024-01-15 10:30',
          riskLevel: 'critical',
          status: 'active',
          aiScore: 95,
          aiInsights: [
            'Dolor aumentó significativamente (6→9/10)',
            'Posible exacerbación aguda',
            'Requiere evaluación inmediata',
            'Considerar derivación a especialista'
          ],
          urgencyFlags: ['Dolor severo', 'Empeoramiento rápido'],
          phone: '+34 666 123 456',
          email: 'maria.gonzalez@email.com',
          treatmentProgress: 65
        },
        {
          id: '2',
          name: 'Pedro Sánchez',
          age: 38,
          condition: 'Rehabilitación post-cirugía',
          lastVisit: '2024-01-08',
          nextAppointment: '2024-01-15 11:30',
          riskLevel: 'medium',
          status: 'active',
          aiScore: 78,
          aiInsights: [
            'Progreso dentro de lo esperado',
            'Adherencia al tratamiento: 85%',
            'Continuar con protocolo actual',
            'Revisar ejercicios en casa'
          ],
          urgencyFlags: [],
          phone: '+34 666 234 567',
          email: 'pedro.sanchez@email.com',
          treatmentProgress: 72
        },
        {
          id: '3',
          name: 'Laura Jiménez',
          age: 29,
          condition: 'Cervicalgia',
          lastVisit: '2024-01-12',
          nextAppointment: '2024-01-15 12:30',
          riskLevel: 'low',
          status: 'active',
          aiScore: 88,
          aiInsights: [
            'Excelente evolución',
            'Dolor reducido de 7/10 a 3/10',
            'Considerar alta en 2-3 sesiones',
            'Paciente muy colaborativa'
          ],
          urgencyFlags: [],
          phone: '+34 666 345 678',
          email: 'laura.jimenez@email.com',
          treatmentProgress: 90
        },
        {
          id: '4',
          name: 'Carlos Ruiz',
          age: 52,
          condition: 'Artritis reumatoide',
          lastVisit: '2024-01-05',
          riskLevel: 'high',
          status: 'inactive',
          aiScore: 92,
          aiInsights: [
            'Falta a 3 sesiones consecutivas',
            'Alto riesgo de abandono',
            'Contactar urgentemente',
            'Revisar motivación del paciente'
          ],
          urgencyFlags: ['Abandono de tratamiento', 'Sin contacto'],
          phone: '+34 666 456 789',
          email: 'carlos.ruiz@email.com',
          treatmentProgress: 45
        },
        {
          id: '5',
          name: 'Ana Martín',
          age: 34,
          condition: 'Fibromialgia',
          lastVisit: '2024-01-11',
          nextAppointment: '2024-01-15 14:00',
          riskLevel: 'medium',
          status: 'active',
          aiScore: 70,
          aiInsights: [
            'Progreso lento pero constante',
            'Necesita apoyo psicológico',
            'Revisar plan de tratamiento',
            'Considerar terapia multidisciplinar'
          ],
          urgencyFlags: ['Progreso lento'],
          phone: '+34 666 567 890',
          email: 'ana.martin@email.com',
          treatmentProgress: 55
        },
        {
          id: '6',
          name: 'Roberto López',
          age: 41,
          condition: 'Lesión deportiva',
          lastVisit: '2024-01-13',
          nextAppointment: '2024-01-15 16:00',
          riskLevel: 'low',
          status: 'new',
          aiScore: 60,
          aiInsights: [
            'Primera consulta',
            'Atleta amateur motivado',
            'Lesión reciente (< 1 semana)',
            'Buen pronóstico de recuperación'
          ],
          urgencyFlags: [],
          phone: '+34 666 678 901',
          email: 'roberto.lopez@email.com',
          treatmentProgress: 10
        }
      ];

      setTimeout(() => {
        setPatients(mockPatients);
        setFilteredPatients(mockPatients);
        setIsLoading(false);
      }, 1000);
    };

    loadPatients();
  }, []);

  useEffect(() => {
    // Filtrado y búsqueda inteligente
    const filtered = patients.filter(patient => {
      // Búsqueda por texto
      const matchesQuery = searchState.query === '' || 
        patient.name.toLowerCase().includes(searchState.query.toLowerCase()) ||
        patient.condition.toLowerCase().includes(searchState.query.toLowerCase()) ||
        patient.aiInsights.some(insight => insight.toLowerCase().includes(searchState.query.toLowerCase()));

      // Filtros por riesgo
      const matchesRisk = searchState.filters.riskLevel.length === 0 || 
        searchState.filters.riskLevel.includes(patient.riskLevel);

      // Filtros por estado
      const matchesStatus = searchState.filters.status.length === 0 || 
        searchState.filters.status.includes(patient.status);

      return matchesQuery && matchesRisk && matchesStatus;
    });

    // Ordenamiento inteligente
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (searchState.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'risk':
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
          break;
        case 'lastVisit':
          comparison = new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
          break;
        case 'aiScore':
          comparison = b.aiScore - a.aiScore;
          break;
      }

      return searchState.sortOrder === 'desc' ? comparison : -comparison;
    });

    setFilteredPatients(filtered);
  }, [patients, searchState]);

  const handlePatientSelect = (patientId: string) => {
    navigate(`/patient/${patientId}/consultation`);
  };

  const handleStartSession = (patientId: string) => {
    navigate(`/patient/${patientId}/session`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const toggleFilter = (category: keyof SearchState['filters'], value: string) => {
    setSearchState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [category]: prev.filters[category].includes(value)
          ? prev.filters[category].filter(item => item !== value)
          : [...prev.filters[category], value]
      }
    }));
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-[#FF6F61] bg-[#FF6F61]/10';
      case 'high': return 'text-[#FFA726] bg-[#FFA726]/10';
      case 'medium': return 'text-[#FFD54F] bg-[#FFD54F]/10';
      case 'low': return 'text-[#A8E6CF] bg-[#A8E6CF]/10';
      default: return 'text-[#2C3E50] bg-[#2C3E50]/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[#A8E6CF] bg-[#A8E6CF]/10';
      case 'inactive': return 'text-[#FF6F61] bg-[#FF6F61]/10';
      case 'new': return 'text-[#5DA5A3] bg-[#5DA5A3]/10';
      case 'discharged': return 'text-[#BDC3C7] bg-[#BDC3C7]/10';
      default: return 'text-[#2C3E50] bg-[#2C3E50]/10';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-[#2C3E50] font-medium">Cargando pacientes...</div>
          <div className="text-[#2C3E50]/60 text-sm">Analizando datos con IA</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="p-2 text-[#2C3E50] hover:bg-[#5DA5A3]/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <AiDuxCareLogo size="sm" />
              <div>
                <h1 className="text-xl font-bold text-[#2C3E50]">Selección de Pacientes</h1>
                <p className="text-[#2C3E50]/60 text-sm">Búsqueda inteligente con IA</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-[#2C3E50]/60">
                {filteredPatients.length} de {patients.length} pacientes
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Búsqueda y filtros */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20 mb-8">
          {/* Barra de búsqueda */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[#2C3E50]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, condición o insights de IA..."
              className="block w-full pl-10 pr-3 py-3 border border-[#BDC3C7]/30 rounded-xl leading-5 bg-white placeholder-[#2C3E50]/40 focus:outline-none focus:placeholder-[#2C3E50]/60 focus:ring-2 focus:ring-[#5DA5A3] focus:border-[#5DA5A3] text-[#2C3E50]"
              value={searchState.query}
              onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtro por riesgo */}
            <div>
              <h3 className="text-sm font-medium text-[#2C3E50] mb-3">Nivel de Riesgo</h3>
              <div className="space-y-2">
                {['critical', 'high', 'medium', 'low'].map(risk => (
                  <label key={risk} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-[#BDC3C7] text-[#5DA5A3] focus:ring-[#5DA5A3]"
                      checked={searchState.filters.riskLevel.includes(risk)}
                      onChange={() => toggleFilter('riskLevel', risk)}
                    />
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk)}`}>
                      {risk === 'critical' ? 'Crítico' : risk === 'high' ? 'Alto' : risk === 'medium' ? 'Medio' : 'Bajo'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por estado */}
            <div>
              <h3 className="text-sm font-medium text-[#2C3E50] mb-3">Estado</h3>
              <div className="space-y-2">
                {['active', 'inactive', 'new', 'discharged'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-[#BDC3C7] text-[#5DA5A3] focus:ring-[#5DA5A3]"
                      checked={searchState.filters.status.includes(status)}
                      onChange={() => toggleFilter('status', status)}
                    />
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status === 'active' ? 'Activo' : status === 'inactive' ? 'Inactivo' : status === 'new' ? 'Nuevo' : 'Alta'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ordenamiento */}
            <div>
              <h3 className="text-sm font-medium text-[#2C3E50] mb-3">Ordenar por</h3>
              <select
                className="block w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-lg bg-white text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-[#5DA5A3]"
                value={`${searchState.sortBy}-${searchState.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [typeof searchState.sortBy, typeof searchState.sortOrder];
                  setSearchState(prev => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <option value="aiScore-desc">IA Score (Mayor a menor)</option>
                <option value="risk-desc">Riesgo (Mayor a menor)</option>
                <option value="lastVisit-desc">Última visita (Reciente)</option>
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de pacientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20 hover:shadow-xl transition-all cursor-pointer"
                                                        role="button" tabIndex={0} onClick={() => handlePatientSelect(patient.id)} onKeyDown={(e) => e.key === "Enter" && handlePatientSelect(patient.id)}
            >
              {/* Header del paciente */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] rounded-full flex items-center justify-center text-white font-bold">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2C3E50]">{patient.name}</h3>
                    <p className="text-sm text-[#2C3E50]/60">{patient.age} años • {patient.condition}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(patient.riskLevel)}`}>
                    {patient.riskLevel === 'critical' ? 'Crítico' : patient.riskLevel === 'high' ? 'Alto' : patient.riskLevel === 'medium' ? 'Medio' : 'Bajo'}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                    {patient.status === 'active' ? 'Activo' : patient.status === 'inactive' ? 'Inactivo' : patient.status === 'new' ? 'Nuevo' : 'Alta'}
                  </div>
                </div>
              </div>

              {/* IA Score y progreso */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#5DA5A3]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13 10V3L4 14h7v7l9-11h-7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-[#2C3E50]">IA Score: {patient.aiScore}/100</span>
                </div>
                <div className="text-sm text-[#2C3E50]/60">
                  Progreso: {patient.treatmentProgress}%
                </div>
              </div>

              {/* Banderas de urgencia */}
              {patient.urgencyFlags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {patient.urgencyFlags.map((flag, index) => (
                      <span key={index} className="px-2 py-1 bg-[#FF6F61]/10 text-[#FF6F61] text-xs font-medium rounded-full">
                        ALERT {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights de IA */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-[#5DA5A3] mb-2">BOT: Insights IA:</h4>
                <div className="space-y-1">
                  {patient.aiInsights.slice(0, 2).map((insight, index) => (
                    <p key={index} className="text-xs text-[#2C3E50]/70 pl-2 border-l-2 border-[#5DA5A3]/20">
                      • {insight}
                    </p>
                  ))}
                  {patient.aiInsights.length > 2 && (
                    <p className="text-xs text-[#5DA5A3] font-medium">
                      +{patient.aiInsights.length - 2} insights más...
                    </p>
                  )}
                </div>
              </div>

              {/* Información de contacto */}
              <div className="text-xs text-[#2C3E50]/60 mb-4">
                <p>Última visita: {new Date(patient.lastVisit).toLocaleDateString('es-ES')}</p>
                {patient.nextAppointment && (
                  <p>Próxima cita: {new Date(patient.nextAppointment).toLocaleString('es-ES')}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSession(patient.id);
                  }}
                  className="flex-1 btn-primary py-2 text-sm"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePatientSelect(patient.id);
                  }}
                  className="flex-1 btn-secondary py-2 text-sm border border-[#5DA5A3]/30"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Estado vacío */}
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-[#2C3E50]/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-[#2C3E50] mb-2">No se encontraron pacientes</h3>
            <p className="text-[#2C3E50]/60">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientSelectionPage; 