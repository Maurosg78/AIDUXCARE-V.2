import { LanguageSwitcher } from "./components/i18n/LanguageSwitcher";
import { LanguageSelector } from './components/LanguageSelector';
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import AppRouter from './router';

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </AuthProvider>
  );
}
