import React from 'react';
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Logo from '../../components/Logo';

const Layout = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
    { name: '🎯 MVP Core', href: '/mvp-core', icon: 'target' },
    { name: 'Calendario', href: '/professional-workflow', icon: 'calendar' },
    { name: 'Pacientes', href: '/patients', icon: 'users' },
    { name: 'Notas', href: '/notes', icon: 'document' },
    { name: 'Demo', href: '/audio-processing', icon: 'microphone' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Top Navigation */}
      <header className="bg-white border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/">
                <Logo size="md" showText={true} />
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isActive(item.href) ? '#FF6F61' : 'transparent',
                    color: isActive(item.href) ? 'white' : '#2C3E50',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {item.icon === 'calendar' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
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
                  {item.icon === 'microphone' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                    </svg>
                  )}
                  {item.icon === 'target' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  )}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="relative">
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
                  Dr. Juan Pérez
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm border-b" style={{ color: '#2C3E50', borderColor: '#BDC3C7' }}>
                      <div className="font-medium">Dr. Juan Pérez</div>
                      <div style={{ color: '#BDC3C7' }}>Fisioterapeuta</div>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm hover:opacity-80"
                      style={{ color: '#2C3E50' }}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm hover:opacity-80"
                      style={{ color: '#2C3E50' }}
                    >
                      Configuración
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:opacity-80"
                      style={{ color: '#2C3E50' }}
                      onClick={() => {
                        window.location.href = '/';
                      }}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 