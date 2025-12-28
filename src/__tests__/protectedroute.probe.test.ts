import { describe, it, expect } from 'vitest';

function mark(label: string) {
  console.error(`[PROBE] ${label}`);
}

mark('start');

mark('before import @testing-library/react');
import { cleanup } from '@testing-library/react';
mark('after import @testing-library/react');

mark('before import react-router-dom');
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
mark('after import react-router-dom');

mark('before import ProtectedRoute');
import { ProtectedRoute } from '@/components/navigation/ProtectedRoute';
mark('after import ProtectedRoute');

mark('before import useAuth');
import { useAuth } from '@/hooks/useAuth';
mark('after import useAuth');

mark('before import sessionPersistence');
import * as sessionPersistence from '@/utils/sessionPersistence';
mark('after import sessionPersistence');

mark('before import AuthContext');
import { AuthProvider } from '@/context/AuthContext';
mark('after import AuthContext');

mark('before import firebase/lib/firebase');
import { auth } from '@/lib/firebase';
mark('after import firebase/lib/firebase');

// Paso 0: nada de app
describe('probe', () => {
  it('baseline', () => {
    expect(true).toBe(true);
  });
});

