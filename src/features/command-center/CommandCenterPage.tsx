// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../shared/ui';
import { FloatingAssistant } from '../../components/FloatingAssistant';

// import { useUserProfile } from './hooks/useUserProfile';
import { logAction } from '../../analytics/events';
import NewAppointmentModal from '../appointments/NewAppointmentModal';
import PendingNotesModal from '../notes/PendingNotesModal';
import { AuditWidget } from '../../components/AuditWidget';

import { Greeting } from './components/Greeting';
import { usePendingNotesCount } from './hooks/usePendingNotesCount';
import { CreatePatientModal } from './components/CreatePatientModal';

import logger from '@/shared/utils/logger';

export const CommandCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  // Estados para modales
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showPendingNotes, setShowPendingNotes] = useState(false);
  const [showAuditWidget, setShowAuditWidget] = useState(false);

  // Hooks de datos reales
  // const userProfile = useUserProfile(); // Saludo ahora lo maneja <Greeting/>
  const pendingNotesCount = usePendingNotesCount();

  // Redirigir si no está autenticado
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Verificar si es admin (placeholder - implementar lógica real)
  const isAdmin = user?.email?.includes('admin') || user?.uid === 'admin-uid';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado personalizado */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <header className="mb-2">
            <h1 className="sr-only">Centro de Mando</h1>
            <Greeting />
          </header>
          <div className="flex gap-3">
            {/* Botón de Auditoría solo para admins */}
            {isAdmin && (
              <button
                onClick={() => { 
                  setShowAuditWidget(true); 
                  logAction('open_audit_widget', '/command-center'); 
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                📊 Auditoría
              </button>
            )}
            <button
              onClick={async () => {
                try {
                  await logout();
                  navigate('/login');
                } catch (error) {
                  logger.error('Error al cerrar sesión:', error);
                  // Fallback: navegación directa
                  navigate('/login');
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* 4 Botones Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Mis Citas de Hoy */}
          <Link to="/appointments?scope=today" className="block group">
            <Card className="p-6 rounded-[1rem] shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-in-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-brand-in-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Mis Citas de Hoy</h3>
                    <p className="text-slate-500 text-sm">Revisa y gestiona tu agenda</p>
                  </div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-in-500 text-xl">→</span>
              </div>
            </Card>
          </Link>

          {/* Nueva cita (sustituye card Pacientes) */}
          <button 
            onClick={() => { setShowNewAppt(true); logAction('open_new_appointment', '/command-center'); }}
            className="block group w-full"
          >
            <Card className="p-6 rounded-[1rem] shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-in-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-brand-in-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Nueva cita</h3>
                    <p className="text-slate-500 text-sm">Crea una cita buscando al paciente</p>
                  </div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-in-500 text-xl">→</span>
              </div>
            </Card>
          </button>

          {/* Notas Pendientes (abre modal) */}
          <button onClick={() => { setShowPendingNotes(true); logAction('open_pending_notes', '/command-center'); }} className="block group w-full">
            <Card className="p-6 rounded-[1rem] shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-in-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-brand-in-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">Notas pendientes</h3>
                      <span className="min-w-[28px] h-6 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center ml-2">
                        {pendingNotesCount.loading ? '...' : pendingNotesCount.error ? '--' : pendingNotesCount.data || 0}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">Finaliza borradores y revisiones</p>
                  </div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-in-500 text-xl">→</span>
              </div>
            </Card>
          </button>

          {/* Crear Paciente */}
          <button 
            onClick={() => { setShowCreatePatient(true); logAction('open_create_patient', '/command-center'); }}
            className="block group w-full"
          >
            <Card className="p-6 rounded-[1rem] shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-in-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-brand-in-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Registrar un nuevo paciente</h3>
                    <p className="text-slate-500 text-sm">Alta rápida de un nuevo paciente</p>
                  </div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-in-500 text-xl">→</span>
              </div>
            </Card>
          </button>
        </div>

        {/* Métricas rápidas eliminadas por simplicidad y evitar duplicación */}
      </div>

      {/* Modales */}
      {showCreatePatient && (
        <CreatePatientModal 
          isOpen={showCreatePatient}
          onClose={() => setShowCreatePatient(false)}
        />
      )}

      <NewAppointmentModal
        open={showNewAppt}
        onClose={()=>setShowNewAppt(false)}
      />
      <PendingNotesModal open={showPendingNotes} onClose={()=>setShowPendingNotes(false)} />

      {/* Widget de Auditoría */}
      <AuditWidget 
        isVisible={showAuditWidget}
        onClose={() => setShowAuditWidget(false)}
      />

      {/* Asistente Flotante */}
      <FloatingAssistant />
    </div>
  );
};