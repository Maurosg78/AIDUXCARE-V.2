import React from 'react';
import { ToastProvider } from '../hooks/useToast';
export default function AppToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
