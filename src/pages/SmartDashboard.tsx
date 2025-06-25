/**
 * TARGET: SMART DASHBOARD - Centro de Comando IA
 * Dashboard inteligente con insights en tiempo real
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

interface DashboardState {
  greeting: string;
  todayStats: {
    scheduledPatients: number;
    completedSessions: number;
    pendingNotes: number;
    riskAlerts: number;
  };
  priorityAlerts: Array<{
    id: string;
    patientName: string;
    type: 'critical' | 'high' | 'medium';
    message: string;
    time: string;
  }>;
  upcomingPatients: Array<{
    id: string;
    name: string;
    time: string;
    condition: string;
    riskLevel: 'low' | 'medium' | 'high';
    lastVisit: string;
    aiInsights: string[];
  }>;
  isLoading: boolean;
}

const SmartDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState>({
    greeting: '',
    todayStats: {
      scheduledPatients: 0,
      completedSessions: 0,
      pendingNotes: 0,
      riskAlerts: 0
    },
    priorityAlerts: [],
    upcomingPatients: [],
    isLoading: true
  });

  useEffect(() => {
    // Simulación de carga de datos inteligente
    const loadDashboardData = async () => {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? '¡Buenos días!' : hour < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';

      // Simulación de datos en tiempo real
      const mockData: DashboardState = {
        greeting,
        todayStats: {
          scheduledPatients: 12,
          completedSessions: 7,
          pendingNotes: 2,
          riskAlerts: 3
        },
        priorityAlerts: [
          {
            id: '1',
            patientName: 'María González',
            type: 'critical',
            message: 'Dolor lumbar severo (9/10) - Requiere evaluación inmediata',
            time: '10:30'
          },
          {
            id: '2',
            patientName: 'Carlos Ruiz',
            type: 'high',
            message: 'Falta a 3 sesiones consecutivas - Riesgo de abandono',
            time: '11:15'
          },
          {
            id: '3',
            patientName: 'Ana Martín',
            type: 'medium',
            message: 'Progreso lento en rehabilitación - Revisar plan',
            time: '14:00'
          }
        ],
        upcomingPatients: [
          {
            id: '1',
            name: 'María González',
            time: '10:30',
            condition: 'Lumbalgia crónica',
            riskLevel: 'high',
            lastVisit: 'Hace 3 días',
            aiInsights: [
              'Dolor aumentó de 6/10 a 9/10',
              'Posible exacerbación aguda',
              'Considerar derivación a especialista'
            ]
          },
          {
            id: '2',
            name: 'Pedro Sánchez',
            time: '11:30',
            condition: 'Rehabilitación post-cirugía',
            riskLevel: 'medium',
            lastVisit: 'Hace 1 semana',
            aiInsights: [
              'Progreso dentro de lo esperado',
              'Adherencia al tratamiento: 85%',
              'Continuar con protocolo actual'
            ]
          },
          {
            id: '3',
            name: 'Laura Jiménez',
            time: '12:30',
            condition: 'Cervicalgia',
            riskLevel: 'low',
            lastVisit: 'Hace 2 días',
            aiInsights: [
              'Excelente evolución',
              'Dolor reducido de 7/10 a 3/10',
              'Considerar alta en 2-3 sesiones'
            ]
          }
        ],
        isLoading: false
      };

      // Simular carga
      setTimeout(() => {
        setState(mockData);
      }, 1500);
    };

    loadDashboardData();
  }, []);

  const handlePatientSelect = (patientId: string) => {
    navigate(`/patient/${patientId}/consultation`);
  };

  const handleNewSession = () => {
    navigate('/patient-selection');
  };

  const handleViewAlert = (alertId: string) => {
    const alert = state.priorityAlerts.find(a => a.id === alertId);
    if (alert) {
      navigate(`/patient/${alert.patientName}/priority-review`);
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-[#2C3E50] font-medium">Cargando tu dashboard inteligente...</div>
          <div className="text-[#2C3E50]/60 text-sm">Analizando datos de pacientes y generando insights</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header inteligente */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AiDuxCareLogo size="sm" />
              <div>
                <h1 className="text-xl font-bold text-[#2C3E50]">{state.greeting}</h1>
                <p className="text-[#2C3E50]/60 text-sm">Centro de Comando IA</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleNewSession}
                className="btn-primary px-6 py-2 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Sesión
              </button>
              
              <div className="relative">
                <button className="p-2 text-[#2C3E50] hover:bg-[#5DA5A3]/10 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5H7.5" />
                  </svg>
                </button>
                {state.todayStats.riskAlerts > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6F61] text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {state.todayStats.riskAlerts}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas del día */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#2C3E50]/60 text-sm font-medium">Pacientes Hoy</p>
                <p className="text-3xl font-bold text-[#2C3E50]">{state.todayStats.scheduledPatients}</p>
              </div>
              <div className="w-12 h-12 bg-[#5DA5A3]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-[#A8E6CF] font-medium">{state.todayStats.completedSessions} completadas</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#2C3E50]/60 text-sm font-medium">Notas Pendientes</p>
                <p className="text-3xl font-bold text-[#2C3E50]">{state.todayStats.pendingNotes}</p>
              </div>
              <div className="w-12 h-12 bg-[#A8E6CF]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#A8E6CF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-[#5DA5A3] font-medium">IA generará automáticamente</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#2C3E50]/60 text-sm font-medium">Alertas de Riesgo</p>
                <p className="text-3xl font-bold text-[#FF6F61]">{state.todayStats.riskAlerts}</p>
              </div>
              <div className="w-12 h-12 bg-[#FF6F61]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#FF6F61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-[#FF6F61] font-medium">Requieren atención</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#2C3E50]/60 text-sm font-medium">Eficiencia IA</p>
                <p className="text-3xl font-bold text-[#5DA5A3]">98%</p>
              </div>
              <div className="w-12 h-12 bg-[#5DA5A3]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-[#5DA5A3] font-medium">Precisión transcripción</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alertas de Prioridad */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2C3E50]">ALERT Alertas Prioritarias</h2>
                <div className="w-6 h-6 bg-[#FF6F61] text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {state.priorityAlerts.length}
                </div>
              </div>

              <div className="space-y-4">
                {state.priorityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all hover:shadow-md ${
                      alert.type === 'critical'
                        ? 'bg-[#FF6F61]/10 border-[#FF6F61] hover:bg-[#FF6F61]/20'
                        : alert.type === 'high'
                        ? 'bg-[#FFA726]/10 border-[#FFA726] hover:bg-[#FFA726]/20'
                        : 'bg-[#FFD54F]/10 border-[#FFD54F] hover:bg-[#FFD54F]/20'
                    }`}
                    role="button" tabIndex={0} onClick={() => handleViewAlert(alert.id)} onKeyDown={(e) => e.key === "Enter" && handleViewAlert(alert.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-[#2C3E50]">{alert.patientName}</span>
                          <span className="text-xs text-[#2C3E50]/60">{alert.time}</span>
                        </div>
                        <p className="text-sm text-[#2C3E50]/80">{alert.message}</p>
                      </div>
                      <svg className="w-4 h-4 text-[#2C3E50]/40 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Próximos Pacientes */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2C3E50]">👥 Próximos Pacientes</h2>
                <button
                  onClick={handleNewSession}
                  className="text-[#5DA5A3] hover:text-[#4A8280] font-medium text-sm transition-colors"
                >
                  Ver todos
                </button>
              </div>

              <div className="space-y-4">
                {state.upcomingPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-4 rounded-xl border border-[#BDC3C7]/20 hover:border-[#5DA5A3]/30 cursor-pointer transition-all hover:shadow-md"
                    role="button" tabIndex={0} onClick={() => handlePatientSelect(patient.id)} onKeyDown={(e) => e.key === "Enter" && handlePatientSelect(patient.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-[#2C3E50]">{patient.name}</h3>
                          <span className="text-sm text-[#2C3E50]/60">{patient.time}</span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            patient.riskLevel === 'high'
                              ? 'bg-[#FF6F61]/20 text-[#FF6F61]'
                              : patient.riskLevel === 'medium'
                              ? 'bg-[#FFA726]/20 text-[#FFA726]'
                              : 'bg-[#A8E6CF]/20 text-[#5DA5A3]'
                          }`}>
                            {patient.riskLevel === 'high' ? 'Alto Riesgo' : patient.riskLevel === 'medium' ? 'Riesgo Medio' : 'Bajo Riesgo'}
                          </div>
                        </div>
                        
                        <p className="text-sm text-[#2C3E50]/80 mb-2">{patient.condition}</p>
                        <p className="text-xs text-[#2C3E50]/60 mb-3">Última visita: {patient.lastVisit}</p>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-[#5DA5A3] mb-1">BOT: Insights IA:</p>
                          {patient.aiInsights.map((insight, index) => (
                            <p key={index} className="text-xs text-[#2C3E50]/70 pl-2 border-l-2 border-[#5DA5A3]/20">
                              • {insight}
                            </p>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-2 ml-4">
                        <button className="btn-primary px-3 py-1 text-xs">
                          Iniciar Sesión
                        </button>
                        <button className="text-[#2C3E50]/60 hover:text-[#2C3E50] text-xs transition-colors">
                          Ver Historial
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SmartDashboard; 