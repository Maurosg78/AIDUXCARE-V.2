/**
 * 🧭 SIDEBAR NAVIGATION - AIDUXCARE V.2
 * Navegación lateral persistente para todas las páginas autenticadas
 * Incluye enlaces principales y funcionalidades de usuario
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarNavigationProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'patients',
      label: 'Pacientes',
      path: '/patients',
      icon: 'PATIENTS',
      category: 'main'
    },
    {
      id: 'new-patient',
      label: 'Nuevo Paciente',
      path: '/patients/new',
      icon: 'ADD',
      category: 'main'
    },
    {
      id: 'audio-demo',
      label: 'Demo Audio',
      path: '/audio-demo',
      icon: 'MICROPHONE',
      category: 'demo'
    },
    {
      id: 'advanced-demo',
      label: 'Demo Avanzado',
      path: '/advanced-demo',
      icon: 'ADVANCED',
      category: 'demo'
    },
    {
      id: 'real-world-demo',
      label: 'Real World Demo',
      path: '/real-world-demo',
      icon: 'WORLD',
      category: 'demo'
    },
    {
      id: 'test-integration',
      label: 'Test Integración',
      path: '/test-integration',
      icon: 'TEST',
      category: 'demo'
    },
    {
      id: 'settings',
      label: 'Configuración',
      path: '/settings',
      icon: 'SETTINGS',
      category: 'system'
    },
    {
      id: 'help',
      label: 'Ayuda',
      path: '/help',
      icon: 'HELP',
      category: 'system'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-lg transition-all duration-300 z-50 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header del Sidebar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#5DA5A3] to-[#A8E6CF] text-white">
        <div className="flex items-center">
          <AiDuxCareLogo size="sm" showText={!isCollapsed} />
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
          title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Menú Principal */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Navegación Principal
            </h3>
          )}
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-[#5DA5A3]/15 text-[#5DA5A3] border-r-2 border-[#5DA5A3]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Menú Secundario */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Sistema
            </h3>
          )}
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-[#5DA5A3]/15 text-[#5DA5A3] border-r-2 border-[#5DA5A3]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer del Sidebar - Usuario */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 bg-gradient-to-r from-[#5DA5A3] to-[#A8E6CF] rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 truncate">
                  {user?.email || 'Usuario'}
                </div>
                <div className="text-xs text-slate-500">
                  {user?.role || 'Profesional'}
                </div>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
              title="Menú de usuario"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Menú de Usuario */}
        {!isCollapsed && isUserMenuOpen && (
          <div className="mt-3 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              <span className="mr-2">USER:</span>
              <span>Mi Perfil</span>
            </button>
            <button
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              <span className="mr-2">SETTINGS</span>
              <span>Configuración</span>
            </button>
            <div className="border-t border-slate-200 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="mr-2">🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        {/* Botón de Logout para modo colapsado */}
        {isCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full p-2 text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarNavigation;
