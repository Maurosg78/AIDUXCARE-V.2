/**
 * 🛡️ Auth Guard Component - AiDuxCare V.2 MEDICAL SECURITY
 * Componente para proteger rutas con seguridad hospitalaria
 * HIPAA/GDPR Compliant - Enterprise Grade Protection
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  minimumRole?: 'OWNER' | 'PROFESSIONAL' | 'TRIAL';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredPermissions = [],
  minimumRole 
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    requiresMFA, 
    securityLevel,
    hasPermission,
    getCurrentRole 
  } = useAuth();

  // DEBUG: Logs para monitoreo de seguridad
  console.log('🛡️ AuthGuard - Estado de seguridad médica:', {
    isAuthenticated,
    isLoading,
    requiresMFA,
    securityLevel,
    currentRole: getCurrentRole(),
    requiredPermissions
  });

  // DIAGNÓSTICO DETALLADO - CRÍTICO PARA DEBUGGING
  console.log('🔍 AuthGuard - DIAGNÓSTICO COMPLETO:', {
    'Estado de carga': isLoading,
    'Está autenticado': isAuthenticated,
    'Requiere MFA': requiresMFA,
    'Nivel de seguridad': securityLevel,
    'Rol actual': getCurrentRole(),
    'Permisos requeridos': requiredPermissions,
    'Token en localStorage': !!localStorage.getItem('aiduxcare_secure_token'),
    'Timestamp': new Date().toISOString()
  });

  // VERIFICACIÓN DE TOKENS DE SEGURIDAD
  const secureToken = localStorage.getItem('aiduxcare_secure_token');
  if (secureToken) {
    console.log('🔐 Token seguro encontrado, longitud:', secureToken.length);
  } else {
    console.log('❌ NO hay token seguro en localStorage');
  }

  if (isLoading) {
    console.log('🛡️ AuthGuard - Verificando credenciales médicas...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">🔐 AiDuxCare Medical</h3>
            <p className="mt-2 text-gray-600">Verificando credenciales médicas...</p>
            <p className="mt-1 text-sm text-gray-500">Seguridad de grado hospitalario</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🛡️ AuthGuard - ❌ NO autenticado, redirigiendo a /auth');
    console.log('🔍 MOTIVO DE REDIRECCIÓN:', {
      'isAuthenticated': isAuthenticated,
      'hasSecureToken': !!localStorage.getItem('aiduxcare_secure_token'),
      'contextLoaded': true,
      'currentPath': window.location.pathname
    });
    return <Navigate to="/auth" replace />;
  }

  // Verificar MFA si es requerido - SEGURIDAD HOSPITALARIA COMPLETA
  if (requiresMFA) {
    console.log('🛡️ AuthGuard - MFA requerido, redirigiendo a configuración');
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Autenticación Multi-Factor Requerida</h3>
            <p className="mt-2 text-gray-600">
              Para acceder al sistema clínico, necesitas configurar la autenticación de dos factores.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Esto es requerido por los estándares de seguridad hospitalaria HIPAA.
            </p>
            <div className="mt-6">
              <button 
                onClick={() => window.location.href = '/auth?setupMFA=true'}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Configurar MFA Ahora
              </button>
              <p className="mt-2 text-xs text-gray-400">
                Necesitarás una app como Google Authenticator
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar permisos específicos
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    
    if (!hasAllPermissions) {
      console.log('🛡️ AuthGuard - ❌ Permisos insuficientes:', {
        required: requiredPermissions,
        missing: requiredPermissions.filter(p => !hasPermission(p))
      });
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚫</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Acceso Denegado</h3>
              <p className="mt-2 text-gray-600">
                No tienes los permisos médicos necesarios para acceder a esta sección.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Rol actual: {getCurrentRole()}
              </p>
              <button 
                onClick={() => window.location.href = '/clinical'}
                className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Verificar rol mínimo
  if (minimumRole) {
    const currentRole = getCurrentRole();
    const roleHierarchy = { 'TRIAL': 1, 'PROFESSIONAL': 2, 'OWNER': 3 };
    const currentLevel = roleHierarchy[currentRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[minimumRole];
    
    if (currentLevel < requiredLevel) {
      console.log('🛡️ AuthGuard - ❌ Rol insuficiente:', {
        current: currentRole,
        required: minimumRole
      });
      
      return <Navigate to="/access-denied" replace />;
    }
  }

  console.log('🛡️ AuthGuard - ✅ ACCESO AUTORIZADO - Seguridad médica verificada');
  console.log(`🔐 Nivel de seguridad: ${securityLevel} | Rol: ${getCurrentRole()}`);
  
  return <>{children}</>;
};