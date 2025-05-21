import { vi } from "vitest";
import React from 'react';
import { useUser } from '../../core/auth/UserContext';
import AuditLogViewer from '../../shared/components/Audit/AuditLogViewer';

/**
 * Dashboard para administradores del sistema
 * Muestra métricas, logs y configuraciones de administración
 */
const DashboardPage: React.FC = () => {
  const { profile } = useUser();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        <div className="bg-white shadow-sm rounded-md p-6">
          <h1 className="text-2xl font-bold text-slateBlue mb-4">Panel de Administración</h1>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-softCoral flex items-center justify-center text-white font-bold text-xl">
              {profile?.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-slateBlue font-medium">{profile?.full_name}</p>
              <p className="text-slateBlue/60 text-sm">Administrador del Sistema</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow-sm rounded-md p-6">
            <h2 className="text-lg font-semibold text-slateBlue mb-3">Usuarios</h2>
            <div className="flex justify-between items-center">
              <div className="text-4xl font-bold text-softCoral">42</div>
              <div className="text-sm text-slateBlue/60">Total de usuarios</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-lg font-semibold text-blue-700">28</div>
                <div className="text-xs text-blue-700/70">Profesionales</div>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-lg font-semibold text-green-700">12</div>
                <div className="text-xs text-green-700/70">Pacientes</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="text-lg font-semibold text-purple-700">2</div>
                <div className="text-xs text-purple-700/70">Admins</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-md p-6">
            <h2 className="text-lg font-semibold text-slateBlue mb-3">Visitas</h2>
            <div className="flex justify-between items-center">
              <div className="text-4xl font-bold text-softCoral">156</div>
              <div className="text-sm text-slateBlue/60">Total de visitas</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-lg font-semibold text-blue-700">32</div>
                <div className="text-xs text-blue-700/70">Programadas</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-md">
                <div className="text-lg font-semibold text-amber-700">15</div>
                <div className="text-xs text-amber-700/70">En curso</div>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-lg font-semibold text-green-700">109</div>
                <div className="text-xs text-green-700/70">Completadas</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-md p-6">
            <h2 className="text-lg font-semibold text-slateBlue mb-3">Sistema</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-slateBlue/60">Estado</span>
                <span className="text-sm font-medium bg-green-50 text-green-700 px-2 py-1 rounded">Operativo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slateBlue/60">Versión</span>
                <span className="text-sm font-medium">2.0.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slateBlue/60">Último backup</span>
                <span className="text-sm font-medium">Hoy, 04:30 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slateBlue/60">Almacenamiento</span>
                <span className="text-sm font-medium">42% usado</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-md p-6">
          <h2 className="text-lg font-semibold text-slateBlue mb-3">Logs del Sistema</h2>
          <AuditLogViewer visitId="" fromSupabase={true} />
        </div>

        <div className="bg-white shadow-sm rounded-md p-6">
          <h2 className="text-lg font-semibold text-slateBlue mb-3">Acciones de Administrador</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-3 border border-slateBlue bg-slateBlue/5 rounded-md text-slateBlue hover:bg-slateBlue/10 transition">
              Gestionar usuarios
            </button>
            <button className="p-3 border border-slateBlue bg-slateBlue/5 rounded-md text-slateBlue hover:bg-slateBlue/10 transition">
              Configurar sistema
            </button>
            <button className="p-3 border border-softCoral bg-softCoral/5 rounded-md text-softCoral hover:bg-softCoral/10 transition">
              Ejecutar backup manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 