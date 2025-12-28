/**
 * Import Probe Test - Static Imports (Top-Level)
 * 
 * Test para verificar si el problema ocurre con imports estáticos en top-level
 * (como en el test original ProtectedRoute.test.tsx)
 */

import { describe, it, expect } from 'vitest';

// Imports estáticos en top-level (como en el test original)
import { cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/navigation/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import * as sessionPersistence from '@/utils/sessionPersistence';
import { AuthProvider } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';

describe('import-probe-static', () => {
  it('runs', async () => {
    console.error('[PROBE-STATIC] inside test - start');
    expect(true).toBe(true);
    console.error('[PROBE-STATIC] inside test - end');
  });
});

