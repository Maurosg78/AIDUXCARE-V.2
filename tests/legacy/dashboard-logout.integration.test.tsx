/**
 * Test de integración para Dashboard y Logout
 * Verifica que el dashboard muestra datos del perfil y el logout limpia contexto y sesión
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfessionalWorkflowPage } from '../../pages/ProfessionalWorkflowPage';
import { ProfessionalProfileProvider } from '../../context/ProfessionalProfileContext';
import { useProfessionalProfile } from '../../hooks/useProfessionalProfile';
import { useAuth } from '../../hooks/useAuth';
import { firebaseAuthService } from '../../services/firebaseAuthService';

// Mock de los hooks y servicios
vi.mock('../../hooks/useProfessionalProfile');
vi.mock('../../hooks/useAuth');
vi.mock('../../services/firebaseAuthService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock de Firebase
vi.mock('../../lib/firebase', () => ({
  auth: {},
  db: {}
}));

describe('Dashboard y Logout - Tests de Integración', () => {
  const mockProfile = {
    fullName: 'Dr. María González',
    professionalTitle: 'Fisioterapeuta',
    email: 'maria@aiduxcare.com',
    country: 'España',
    province: 'Madrid',
    city: 'Madrid',
    specialty: 'Fisioterapia Ortopédica',
    consentGranted: true
  };

  const mockUser = {
    displayName: 'Dr. María González',
    email: 'maria@aiduxcare.com',
    professionalTitle: 'Fisioterapeuta',
    specialty: 'Fisioterapia Ortopédica'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar datos del perfil profesional en el dashboard', async () => {
    // Mock del hook useProfessionalProfile
    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null
    });

    // Mock del hook useAuth
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    // Verificar que se muestran los datos del perfil
    await waitFor(() => {
      expect(screen.getByText(/Fisioterapeuta\. Dr\. María González/)).toBeInTheDocument();
      expect(screen.getByText(/Fisioterapia Ortopédica/)).toBeInTheDocument();
    });
  });

  it('debe mostrar estado de carga mientras se obtiene el perfil', async () => {
    // Mock del hook useProfessionalProfile con loading
    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({
      profile: null,
      loading: true,
      error: null
    });

    // Mock del hook useAuth
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    // Verificar que se muestra el estado de carga
    expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();
  });

  it('debe mostrar error si falla la carga del perfil', async () => {
    // Mock del hook useProfessionalProfile con error
    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: 'Error al cargar perfil'
    });

    // Mock del hook useAuth
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    // Verificar que se muestra el error
    expect(screen.getByText(/Error: Error al cargar perfil/)).toBeInTheDocument();
  });

  it('debe ejecutar logout correctamente al hacer clic en el botón', async () => {
    // Mock del hook useProfessionalProfile
    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null
    });

    // Mock del hook useAuth
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    });

    // Mock del servicio de auth
    const mockFirebaseAuthService = vi.mocked(firebaseAuthService);
    mockFirebaseAuthService.logout.mockResolvedValue({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    // Buscar y hacer clic en el botón de logout
    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);

    // Verificar que se llamó al servicio de logout
    await waitFor(() => {
      expect(mockFirebaseAuthService.logout).toHaveBeenCalledTimes(1);
    });
  });

  it('debe manejar error en logout', async () => {
    // Mock del hook useProfessionalProfile
    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null
    });

    // Mock del hook useAuth
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    });

    // Mock del servicio de auth con error
    const mockFirebaseAuthService = vi.mocked(firebaseAuthService);
    mockFirebaseAuthService.logout.mockResolvedValue({
      success: false,
      message: 'Error al cerrar sesión'
    });

    // Mock de console.error para capturar el error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    // Buscar y hacer clic en el botón de logout
    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);

    // Verificar que se capturó el error
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error en logout:', 'Error al cerrar sesión');
    });

    consoleSpy.mockRestore();
  });
});
