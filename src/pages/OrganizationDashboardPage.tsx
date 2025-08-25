/**
 * 🏢 Organization Dashboard Page
 * Dashboard principal para organizaciones con métricas y resumen
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useOrganization } from '../core/hooks/useOrganization';

interface DashboardMetric {
  name: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
}

interface RecentActivity {
  id: string;
  type: 'member_joined' | 'member_left' | 'invitation_sent' | 'patient_added' | 'visit_completed';
  description: string;
  timestamp: Date;
  user?: string;
}

const OrganizationDashboardPage: React.FC = () => {
  const { 
    organization, 
    members, 
    invitations, 
    canManageTeam, 
    canManagePatients,
    canAccessAnalytics,
    isLoading 
  } = useOrganization();

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    // Simular actividad reciente
    if (organization) {
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'member_joined',
          description: 'Dr. María González se unió a la organización',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          user: 'Dr. María González'
        },
        {
          id: '2',
          type: 'invitation_sent',
          description: 'Invitación enviada a dr.perez@clinic.com',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
          user: 'dr.perez@clinic.com'
        },
        {
          id: '3',
          type: 'patient_added',
          description: 'Nuevo paciente registrado: Juan Carlos López',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
          user: 'Juan Carlos López'
        },
        {
          id: '4',
          type: 'visit_completed',
          description: 'Consulta completada para paciente ID: 12345',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 horas atrás
          user: 'Paciente ID: 12345'
        }
      ];
      setRecentActivity(mockActivity);
    }
  }, [organization]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        );
      case 'member_left':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        );
      case 'invitation_sent':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        );
      case 'patient_added':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        );
      case 'visit_completed':
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        );
    }
  };

  const metrics: DashboardMetric[] = [
    {
      name: 'Total Miembros',
      value: members.length,
      change: '+2 este mes',
      changeType: 'increase',
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      name: 'Invitaciones Pendientes',
      value: invitations.length,
      change: invitations.length > 0 ? `${invitations.length} pendientes` : 'Todas aceptadas',
      changeType: invitations.length > 0 ? 'decrease' : 'increase',
      icon: (
        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Miembros Activos',
      value: members.filter(m => m.status === 'ACTIVE').length,
      change: '95% tasa de actividad',
      changeType: 'increase',
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Pacientes Registrados',
      value: '1,247',
      change: '+12 esta semana',
      changeType: 'increase',
      icon: (
        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No tienes acceso a una organización
          </h1>
          <p className="text-gray-600">
            Contacta al administrador para ser agregado a una organización.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido a {organization.name} - Resumen de actividad y métricas
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {metric.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                {metric.change && (
                  <p className={`text-sm ${
                    metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Acciones Rápidas</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {canManageTeam && (
              <Link
                to="/organization/team"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Invitar Miembro</h3>
                  <p className="text-sm text-gray-500">Agregar nuevo profesional al equipo</p>
                </div>
              </Link>
            )}
            
            {canManagePatients && (
              <Link
                to="/organization/patients"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Gestionar Pacientes</h3>
                  <p className="text-sm text-gray-500">Ver y administrar pacientes</p>
                </div>
              </Link>
            )}
            
            {canAccessAnalytics && (
              <Link
                to="/organization/analytics"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Ver Analytics</h3>
                  <p className="text-sm text-gray-500">Analizar métricas y reportes</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Actividad Reciente</h2>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.timestamp.toISOString()}>
                            {activity.timestamp.toLocaleDateString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboardPage; 