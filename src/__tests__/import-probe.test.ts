/**
 * Import Probe Test - Hilo 1 Bisect
 * 
 * Test sistemático para aislar el import/side-effect que causa el hang.
 * Usa await import() dentro del test para poder instrumentar exactamente dónde se cuelga.
 */

import { describe, it, expect } from 'vitest';

describe('import-probe', () => {
  it('runs', async () => {
    console.error('[PROBE] inside test - start');
    
    // Paso 0: Baseline - sin imports de app
    expect(true).toBe(true);
    console.error('[PROBE] baseline check passed');
    
    // Paso 1: @testing-library/react (probablemente OK)
    console.error('[PROBE] before import @testing-library/react');
    await import('@testing-library/react');
    console.error('[PROBE] after import @testing-library/react');
    
    // Paso 2: react-router-dom (probablemente OK)
    console.error('[PROBE] before import react-router-dom');
    await import('react-router-dom');
    console.error('[PROBE] after import react-router-dom');
    
    // Paso 3: ProtectedRoute component (puede tener imports transitivos problemáticos)
    console.error('[PROBE] before import ProtectedRoute');
    await import('@/components/navigation/ProtectedRoute');
    console.error('[PROBE] after import ProtectedRoute');
    
    // Paso 4: useAuth hook (puede importar Firebase)
    console.error('[PROBE] before import useAuth');
    await import('@/hooks/useAuth');
    console.error('[PROBE] after import useAuth');
    
    // Paso 5: sessionPersistence (puede tener side effects)
    console.error('[PROBE] before import sessionPersistence');
    await import('@/utils/sessionPersistence');
    console.error('[PROBE] after import sessionPersistence');
    
    // Paso 6: AuthContext (puede importar Firebase)
    console.error('[PROBE] before import AuthContext');
    await import('@/context/AuthContext');
    console.error('[PROBE] after import AuthContext');
    
    // Paso 7: firebase/lib/firebase (MUY SOSPECHOSO - puede tener side effects al inicializarse)
    console.error('[PROBE] before import firebase/lib/firebase');
    await import('@/lib/firebase');
    console.error('[PROBE] after import firebase/lib/firebase');
    
    console.error('[PROBE] inside test - end');
  });
});

