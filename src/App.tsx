import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { EnhancedToastProvider } from './hooks/useEnhancedToast';
import AppRouter from './router';

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <EnhancedToastProvider>
          <AppRouter />
        </EnhancedToastProvider>
      </SessionProvider>
    </AuthProvider>
  );
}
