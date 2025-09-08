import { getLanguage } from "@/utils/translations";
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import AppRouter from './router';
import { LanguageSelector } from "./components/LanguageSelector";

function App() {
  return (
    <div key={lang}>
    <AuthProvider>
      <SessionProvider>
        <LanguageSelector />
        <AppRouter />
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;
