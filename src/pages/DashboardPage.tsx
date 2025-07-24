/**
 * 📊 **Enterprise Dashboard Page**
 * 
 * Dashboard enterprise con:
 * - Información del usuario autenticado
 * - Navegación profesional
 * - Estado de conexión Firebase
 * - Acciones básicas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthRepository } from '../infrastructure/repositories/FirebaseAuthRepository';
import { firebaseClient } from '../infrastructure/firebase/FirebaseClient';
import type { UserIdentity } from '../core/types/auth.types';
import { AppError } from '../core/errors/AppError';

// =====================================================
// DASHBOARD PAGE COMPONENT
// =====================================================

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const authRepository = new FirebaseAuthRepository();

  const [user, setUser] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase connection info
  const [connectionInfo, setConnectionInfo] = useState(
    firebaseClient.getConnectionInfo()
  );

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    loadUserInfo();
  }, []);

  // =====================================================
  // USER MANAGEMENT
  // =====================================================

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const currentUser = await authRepository.getCurrentUser();
      
      if (!currentUser) {
        navigate('/', { replace: true });
        return;
      }

      setUser(currentUser);
      
    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
      
      if (error instanceof AppError) {
        setError(error.getUserMessage());
      } else {
        setError('Error cargando información del usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authRepository.logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  };

  // =====================================================
  // RENDER LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER ERROR
  // =====================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">AiDuxCare</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Bienvenido, <span className="font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard Profesional
          </h2>
          <p className="text-gray-600">
            Bienvenido a tu espacio de trabajo profesional. Esta es la base sólida de AiDuxCare Enterprise.
          </p>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Usuario
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ID de Usuario</dt>
                <dd className="text-sm text-gray-900 font-mono">{user?.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Verificado</dt>
                <dd className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.emailVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.emailVerified ? 'Verificado' : 'Pendiente'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Último Acceso</dt>
                <dd className="text-sm text-gray-900">
                  {user?.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleString('es-ES')
                    : 'Primer acceso'
                  }
                </dd>
              </div>
            </dl>
          </div>

          {/* Firebase Connection Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estado del Sistema
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Firebase</dt>
                <dd className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    connectionInfo.appInitialized 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {connectionInfo.appInitialized ? 'Conectado' : 'Desconectado'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Entorno</dt>
                <dd className="text-sm text-gray-900 capitalize">{connectionInfo.environment}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Emuladores</dt>
                <dd className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    connectionInfo.emulatorsConnected 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {connectionInfo.emulatorsConnected ? 'Activos' : 'Inactivos'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Proyecto</dt>
                <dd className="text-sm text-gray-900 font-mono">{connectionInfo.projectId}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Próximas Funcionalidades
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Pacientes</h4>
              <p className="text-sm text-gray-500">Gestión de expedientes</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Notas Clínicas</h4>
              <p className="text-sm text-gray-500">Registro de consultas</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Análisis IA</h4>
              <p className="text-sm text-gray-500">Asistente inteligente</p>
            </div>
          </div>
        </div>

        {/* Enterprise Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                AiDuxCare Enterprise - Base Sólida
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Esta es la arquitectura enterprise base con estándares profesionales. 
                  Incluye tipado estricto, manejo de errores robusto, audit logging y 
                  escalabilidad preparada para funcionalidades avanzadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};