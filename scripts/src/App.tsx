import React, { useState } from 'react';
import WelcomePage from './pages/WelcomePage';
import ClinicalFormPage from './pages/ClinicalFormPage';
import { Button, PageContainer, colors, spacing } from './shared/components/UI';

type AppView = 'welcome' | 'clinical';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('welcome');

  // Navegación simple para demo
  const NavigationBar: React.FC = () => {
    const navStyle: React.CSSProperties = {
      backgroundColor: colors.gray[900],
      padding: spacing[4],
      display: 'flex',
      justifyContent: 'center',
      gap: spacing[4],
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
    };

    const buttonStyle: React.CSSProperties = {
      backgroundColor: colors.white,
      color: colors.gray[900],
      border: 'none',
      padding: `${spacing[2]} ${spacing[4]}`,
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
    };

    const activeButtonStyle: React.CSSProperties = {
      ...buttonStyle,
      backgroundColor: colors.primary[500],
      color: colors.white,
    };

    return (
      <nav style={navStyle}>
        <button
          style={currentView === 'welcome' ? activeButtonStyle : buttonStyle}
          onClick={() => setCurrentView('welcome')}
        >
          📋 Página de Bienvenida
        </button>
        <button
          style={currentView === 'clinical' ? activeButtonStyle : buttonStyle}
          onClick={() => setCurrentView('clinical')}
        >
          🏥 Ficha Clínica
        </button>
      </nav>
    );
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <NavigationBar />
      
      {/* Espaciado para la barra de navegación fija */}
      <div style={{ paddingTop: '70px' }}>
        {currentView === 'welcome' && <WelcomePage />}
        {currentView === 'clinical' && <ClinicalFormPage />}
      </div>
    </div>
  );
};

export default App; 