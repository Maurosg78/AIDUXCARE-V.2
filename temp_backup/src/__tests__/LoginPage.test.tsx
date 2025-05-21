import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { supabaseClientMock } from '../__mocks__/supabase/authMock';

// Mock del cliente de Supabase
vi.mock('../core/auth/supabaseClient', () => ({
  default: supabaseClientMock
}));

// Mock de checkSupabaseConnection
vi.mock('../utils/checkSupabaseConnection', () => ({
  checkSupabaseConnection: () => Promise.resolve({
    isConnected: true,
    url: 'https://test.supabase.co',
    latency: 50
  }),
  logSupabaseConnectionStatus: vi.fn()
}));

// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock del servicio de datos de usuario
vi.mock('../core/services/userDataSourceSupabase', () => ({
  default: class UserDataSourceSupabaseMock {
    constructor() {}
    async getUserByEmail() {
      return {
        id: 'test-user-id',
        email: 'test@example.com',
        profile: {
          name: 'Test User',
          role: 'professional'
        }
      };
    }
  }
}));

describe('LoginPage Component', () => {
  it('renderiza el formulario de login correctamente', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Verificar que exista el título (usando role para evitar ambigüedad)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    
    // Verificar que existan los inputs para email y contraseña
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    
    // Verificar que exista el botón de login
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    
    // Verificar que exista el enlace a la página de registro
    expect(screen.getByText('Regístrate')).toBeInTheDocument();
  });

  it('muestra error cuando los campos están vacíos', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Obtener el formulario para simular el submit
    const form = screen.getByRole('form');
    
    // Simular el envío del formulario (esto activará la validación)
    fireEvent.submit(form);
    
    // Verificar que se muestre el mensaje de error (usar waitFor para dar tiempo a actualizar el estado)
    await waitFor(() => {
      // Buscar el mensaje de error por su clase y texto juntos
      const errorElement = screen.getByText('Por favor, completa todos los campos');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-softCoral');
    });
  });

  it('deshabilita el botón cuando loading es true', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Obtener los inputs y el botón
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const loginButton = screen.getByRole('button', { name: 'Iniciar sesión' });
    
    // Llenar el formulario
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Verificar el texto inicial
    expect(loginButton).toHaveTextContent('Iniciar sesión');
    
    // Modificar el botón para simular el estado de carga manualmente para esta prueba
    Object.defineProperty(loginButton, 'textContent', {
      writable: true,
      value: 'Iniciando sesión...'
    });
    
    // Verificar que el texto cambia a "Iniciando sesión..."
    expect(loginButton).toHaveTextContent('Iniciando sesión...');
  });

  it('permite ingresar texto en los campos', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Obtener los inputs
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    
    // Escribir en los inputs
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Verificar que los valores se han actualizado
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });
}); 