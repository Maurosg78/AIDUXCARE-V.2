import React from 'react';

import { AuditLogViewer } from '../../shared/components/Audit/AuditLogViewer';
import { useUser } from '../../core/auth/UserContext';

export const AuditPage: React.FC = () => {
  const { user, hasRole } = useUser();

  if (!user || !hasRole(['ADMIN', 'OWNER'])) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              Se requieren permisos de administrador para acceder a esta página.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Usuario actual:</strong> {user?.email || 'No autenticado'}<br />
                <strong>Rol:</strong> {user?.role || 'Sin rol'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
          <p className="mt-2 text-gray-600">
            Registro completo de actividades del sistema para cumplimiento HIPAA/GDPR
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con estadísticas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm text-green-700">Sistema Auditado</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">HIPAA</div>
                  <div className="text-sm text-blue-700">Compliant</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">GDPR</div>
                  <div className="text-sm text-purple-700">Compliant</div>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">6+</div>
                  <div className="text-sm text-indigo-700">Años Retención</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Información de Cumplimiento</h4>
                <ul className="text-xs text-gray-600 space-y-2">
                  <li>• Logs inmutables en Firestore</li>
                  <li>• Cifrado end-to-end</li>
                  <li>• Trazabilidad completa</li>
                  <li>• Exportación para auditorías</li>
                  <li>• Retención mínima 6 años</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <AuditLogViewer />
          </div>
        </div>
      </div>
    </div>
  );
}; 