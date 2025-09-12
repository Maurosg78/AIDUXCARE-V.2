import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LanguageToggle } from './components/LanguageToggle';
import { SecretMetrics } from './components/SecretMetrics';
import AppRouter from './router';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SessionProvider>
          {/* Selector de idioma */}
          <div className="fixed top-4 right-4 z-50">
            <LanguageToggle />
          </div>
          
          {/* Widget secreto de métricas */}
          <SecretMetrics />
          
          <AppRouter />
        </SessionProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
