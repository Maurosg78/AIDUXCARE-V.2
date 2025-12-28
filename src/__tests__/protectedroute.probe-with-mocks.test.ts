import { describe, it, expect, vi } from 'vitest';

function mark(label: string) {
  console.error(`[PROBE] ${label}`);
}

mark('start');

// Replicar mocks del test original
mark('before mocks');
vi.mock('../../../firebase', () => ({
  auth: {},
  db: {},
}));

vi.mock('firebase/auth', () => ({
  initializeAuth: () => ({}),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  getAuth: () => ({}),
  onAuthStateChanged: (_auth: any, cb: any) => {
    cb({ uid: 'test-user' });
    return () => { };
  },
}));

vi.mock('../../../hooks/useAuth');
vi.mock('../../../utils/sessionPersistence');
mark('after mocks');

mark('before imports');
import { cleanup } from '@testing-library/react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/navigation/ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';
import * as sessionPersistence from '../../../utils/sessionPersistence';
mark('after imports');

describe('probe with mocks', () => {
  it('baseline', () => {
    expect(true).toBe(true);
  });
});

