import React from 'react';
import { LanguageProvider } from "./contexts/LanguageContext";import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import AppRouter from './router';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </AuthProvider>
  );
}
