import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../core/components/Layout';
import * as UserContext from '../core/auth/UserContext';
import { User } from '@supabase/supabase-js';
import React from 'react';

// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Outlet: () => <div data-testid="outlet">Outlet Content</div>
  };
});

// Mock del contexto de usuario
vi.mock('../core/auth/UserContext', () => ({
  useUser: vi.fn()
}));

describe('Layout Component', () => {
  // Configuración común para pruebas con usuario autenticado
  beforeEach(() => {
    // Crear un mock completo del tipo User
    const mockUser: Partial<User> = {
      id: 'test-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };

    vi.spyOn(UserContext, 'useUser').mockReturnValue({
      user: mockUser as User,
      isLoading: false,
      role: 'professional',
      session: null,
      error: null,
      setUser: vi.fn(),
      setSession: vi.fn(),
      logout: vi.fn()
    });
  });

  it('renderiza correctamente con usuario autenticado', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Verificar que se muestra el nombre AiDuxCare en el header
    expect(screen.getByText('AiDuxCare')).toBeInTheDocument();
    
    // Verificar que se muestra el outlet
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    
    // Verificar que se muestra el email del usuario
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('muestra el menú de navegación con las opciones correctas', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Verificar opciones de menú
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('contiene un botón de logout', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('muestra pantalla de carga cuando loading es true', () => {
    vi.spyOn(UserContext, 'useUser').mockReturnValue({
      user: null,
      isLoading: true,
      role: null,
      session: null,
      error: null,
      setUser: vi.fn(),
      setSession: vi.fn(),
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );
    
    // Verificar que se muestra el spinner de carga
    const loadingSpinner = screen.getByRole('status', { hidden: true });
    expect(loadingSpinner).toBeInTheDocument();
  });
}); 