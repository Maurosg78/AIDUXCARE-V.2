// @ts-nocheck
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