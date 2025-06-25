/**
 * 🧭 NAVEGACIÓN GLOBAL - AIDUXCARE V.2
 * Componente de navegación que aparece en todas las páginas
 * Incluye menú desplegable para acceso rápido a todas las secciones
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GlobalNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { path: '/', label: 'HOME: Inicio', description: 'Página principal' },
    { path: '/patient/new', label: 'USER: Nuevo Paciente', description: 'Registrar paciente' },
    { path: '/patients', label: 'NOTES: Lista Pacientes', description: 'Ver todos los pacientes' },
    { path: '/session', label: 'MIC: Sesión Activa', description: 'Workflow principal' },
    { path: '/patient-complete', label: '📄 Ficha Completa', description: 'Ver ficha del paciente' },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="global-nav">
      <div className="nav-container">
        {/* Logo y Título */}
        <div className="nav-brand">
          <div className="brand-logo">
            <div className="logo-fallback" style={{ display: 'flex' }}>
              <div className="logo-circle"></div>
              <div className="logo-line"></div>
            </div>
          </div>
          <div className="brand-info">
            <div className="brand-name">AiDuxCare</div>
            <div className="brand-subtitle">EMR Inteligente</div>
          </div>
        </div>

        {/* Navegación Central */}
        <div className="nav-center">
          <div className="current-page">
            <span className="page-icon">{currentPage?.label.split(' ')[0] || 'HOME:'}</span>
            <span className="page-name">{currentPage?.label.split(' ').slice(1).join(' ') || 'Inicio'}</span>
          </div>
        </div>

        {/* Menú Desplegable */}
        <div className="nav-menu">
          <button 
            className={`menu-trigger ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="menu-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="menu-text">Menú</span>
          </button>

          {isMenuOpen && (
            <>
              <div className="menu-overlay" onClick={() => setIsMenuOpen(false)} />
              <div className="dropdown-menu">
                <div className="menu-header">
                  <h3>Navegación</h3>
                  <button 
                    className="close-menu"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="menu-items">
                  {menuItems.map((item) => (
                    <button
                      key={item.path}
                      className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <div className="item-content">
                        <div className="item-label">{item.label}</div>
                        <div className="item-description">{item.description}</div>
                      </div>
                      {location.pathname === item.path && (
                        <div className="active-indicator">●</div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="menu-footer">
                  <div className="system-status">
                    <span className="status-dot"></span>
                    <span>Sistema Activo</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default GlobalNavigation; 