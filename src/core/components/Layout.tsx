import React from 'react';
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

import { AiDuxCareLogo } from '../../components/branding/AiDuxCareLogo';
import { ProfessionalRoleSelector, ProfessionalRole } from '../../components/professional/ProfessionalRoleSelector';
import { EnhancedAudioCapture } from '../../components/professional/EnhancedAudioCapture';
import OrganizationNavigation from '../../components/OrganizationNavigation';

import logger from '@/shared/utils/logger';

const Layout = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProfessionalRole>('fisioterapeuta');
  const [activeTool, setActiveTool] = useState('assistant');
  const location = useLocation();
  
  // LIMPIO: Solo navegación esencial
  const navigation = [
    { name: 'Captura', href: '/professional-workflow', icon: 'microphone' },
    { name: 'Pacientes', href: '/patients', icon: 'users' },
    { name: 'Notas', href: '/notes', icon: 'document' },
  ];

  // Herramientas del panel derecho
  const tools = [
    { id: 'assistant', name: 'Asistente IA', icon: 'brain', active: activeTool === 'assistant' },
    { id: 'audio', name: 'Captura Audio', icon: 'microphone', active: activeTool === 'audio' },
    { id: 'history', name: 'Historial', icon: 'clock', active: activeTool === 'history' },
    { id: 'settings', name: 'Configuración', icon: 'settings', active: activeTool === 'settings' },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleRoleChange = (role: ProfessionalRole) => {
    setSelectedRole(role);
    // Aquí se puede agregar lógica adicional cuando cambie el rol
    logger.info('Rol profesional cambiado a:', role);
  };

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
  };

  const renderRightPanelContent = () => {
    switch (activeTool) {
      case 'assistant':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              <p className="text-sm" style={{ color: '#BDC3C7' }}>
                Asistente IA
              </p>
              <p className="text-xs mt-1" style={{ color: '#BDC3C7' }}>
                Próximamente
              </p>
            </div>
          </div>
        );
      case 'audio':
        return (
          <EnhancedAudioCapture
            onTranscriptionComplete={(segments: unknown) => {
              logger.info('Transcripción completada:', segments);
              // Aquí se puede integrar con el sistema de notas o historial
            }}
            onTranscriptionUpdate={(segments: unknown) => {
              logger.info('Transcripción actualizada:', segments);
            }}
            className="h-full"
          />
        );
      case 'history':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm" style={{ color: '#BDC3C7' }}>
                Historial de sesiones
              </p>
              <p className="text-xs mt-1" style={{ color: '#BDC3C7' }}>
                Próximamente
              </p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p className="text-sm" style={{ color: '#BDC3C7' }}>
                Configuración
              </p>
              <p className="text-xs mt-1" style={{ color: '#BDC3C7' }}>
                Próximamente
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Organization Navigation */}
      <OrganizationNavigation />
      
      {/* Top Navigation - Header Fijo */}
      <header className="bg-white border-b flex-shrink-0" style={{ borderColor: '#BDC3C7' }}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo y Toggle Sidebar */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2C3E50' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <AiDuxCareLogo size="sm" showText={true} />
          </div>

          {/* Navigation Central */}
          <nav className="hidden md:flex space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: isActive(item.href) ? '#5DA5A3' : 'transparent',
                  color: isActive(item.href) ? 'white' : '#2C3E50',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {item.icon === 'microphone' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                )}
                {item.icon === 'users' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                )}
                {item.icon === 'document' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                )}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu y Toggle Right Panel */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8E6CF' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2C3E50' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <span className="hidden md:block font-medium" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                Usuario
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8E6CF' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2C3E50' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <span className="hidden md:block font-medium" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                  Usuario
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm border-b" style={{ color: '#2C3E50', borderColor: '#BDC3C7' }}>
                      <div className="font-medium">Usuario</div>
                      <div style={{ color: '#BDC3C7' }}>Profesional</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - 3 Paneles Horizontales */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Sidebar */}
        <div 
          className={`bg-white border-r transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
          style={{ borderColor: '#BDC3C7' }}
        >
          <div className="p-4">
            {!sidebarCollapsed && (
              <>
                {/* Selector de Rol Profesional */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">ROL PROFESIONAL</h3>
                  <ProfessionalRoleSelector
                    selectedRole={selectedRole}
                    onRoleChange={handleRoleChange}
                  />
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">CONTROLES RÁPIDOS</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: '#2C3E50' }}>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span>Nueva Sesión</span>
                      </div>
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: '#2C3E50' }}>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Plantillas</span>
                      </div>
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors" style={{ color: '#2C3E50' }}>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span>Calendario</span>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {!sidebarCollapsed && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">ESTADO DEL SISTEMA</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">IA Local</span>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Audio</span>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Base de Datos</span>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Central - Contenido Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>

        {/* Panel Derecho - Información/Estado */}
        <div 
          className={`bg-white border-l transition-all duration-300 ease-in-out ${
            rightPanelCollapsed ? 'w-16' : 'w-80'
          }`}
          style={{ borderColor: '#BDC3C7' }}
        >
          {!rightPanelCollapsed && (
            <>
              {/* Tool Selector */}
              <div className="p-4 border-b" style={{ borderColor: '#BDC3C7' }}>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">HERRAMIENTAS</h3>
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolChange(tool.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        tool.active 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50'
                      }`}
                      style={{ color: tool.active ? '#1E40AF' : '#2C3E50' }}
                    >
                      <div className="flex items-center space-x-2">
                        {tool.icon === 'brain' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                          </svg>
                        )}
                        {tool.icon === 'clock' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        )}
                        {tool.icon === 'settings' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                        )}
                        <span>{tool.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Content */}
              <div className="flex-1 h-full">
                {renderRightPanelContent()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout; 