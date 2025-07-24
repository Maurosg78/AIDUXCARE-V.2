/**
 * 🚀 **Enterprise App Component**
 * 
 * Aplicación principal enterprise con:
 * - Routing limpio y minimalista
 * - Error boundary global
 * - Configuración centralizada
 * - Estilos Tailwind
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomePage } from './pages/WelcomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

// =====================================================
// APP COMPONENT
// =====================================================

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="font-sans antialiased">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<WelcomePage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Fallback Routes */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;