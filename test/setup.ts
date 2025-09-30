import { vi } from 'vitest';
vi.mock('firebase/auth');

vi.mock('react-router-dom', async (importOriginal) => {
  const real = await importOriginal<any>();
  return { ...real, useNavigate: () => vi.fn() };
});

// Mock del servicio que consulta sesión
vi.mock('@/core/auth/firebaseAuthService', () => {
  return {
    __esModule: true,
    default: {
      // Simula "no logueado" para que WelcomePage muestre el formulario (inputs con placeholders)
      getCurrentSession: async () => ({ user: null, emailVerified: false, loading: false }),
    },
    getCurrentSession: async () => ({ user: null, emailVerified: false, loading: false }),
  };
});
