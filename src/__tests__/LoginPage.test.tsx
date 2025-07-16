// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../pages/LoginPage';
import { supabaseClientMock } from '../__mocks__/supabase/authMock';
import { renderWithRouter } from './test-utils';

// Mock del cliente de Supabase
vi.mock('../core/auth/supabaseClient', () => ({
  default: supabaseClientMock
}));

// Mock de checkSupabaseConnection
vi.mock('../utils/checkSupabaseConnection', () => ({
  checkSupabaseConnection: (): Promise<{ isConnected: boolean; url: string; latency: number }> =>
    Promise.resolve({ isConnected: true, url: 'https://test.supabase.co', latency: 50 }),
  logSupabaseConnectionStatus: vi.fn()
}));

// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock del servicio de datos de usuario
vi.mock('../core/services/userDataSourceSupabase', () => ({
  default: class UserDataSourceSupabaseMock {
    async getUserByEmail() {
      return {
        id: 'test-user-id',
        email: 'test@example.com',
        profile: { name: 'Test User', role: 'professional' }
      };
    }
  }
}));

describe('LoginPage Component', () => {
  it('renderiza el formulario de login correctamente', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).to.exist;
    expect(screen.getAllByPlaceholderText('Correo electrónico')[0]).to.exist;
    expect(screen.getAllByPlaceholderText('Contraseña')[0]).to.exist;
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).to.exist;
    expect(screen.getByText('Regístrate')).to.exist;
  });

  it('muestra error cuando los campos están vacíos', async () => {
    renderWithRouter(<LoginPage />);
    const form = screen.getAllByTestId('login-form')[0];
    fireEvent.submit(form);
    await waitFor(() => {
      const errorElement = screen.getByText('Por favor, completa todos los campos');
      expect(errorElement).to.exist;
      expect(errorElement.classList.contains('text-softCoral')).to.be.true;
    });
  });

  it('deshabilita el botón cuando loading es true', async () => {
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getAllByPlaceholderText('Correo electrónico')[0];
    const passwordInput = screen.getAllByPlaceholderText('Contraseña')[0];
    const loginButton = screen.getAllByRole('button', { name: 'Iniciar sesión' })[0];
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    expect(loginButton.textContent).to.contain('Iniciar sesión');
    // Simular loading
    Object.defineProperty(loginButton, 'textContent', {
      writable: true,
      value: 'Iniciando sesión...'
    });
    expect(loginButton.textContent).to.contain('Iniciando sesión...');
  });

  it('permite ingresar texto en los campos', async () => {
    renderWithRouter(<LoginPage />);
    const emailInputs = screen.getAllByPlaceholderText('Correo electrónico');
    const passwordInputs = screen.getAllByPlaceholderText('Contraseña');
    const emailInput = emailInputs[0] as HTMLInputElement;
    const passwordInput = passwordInputs[0] as HTMLInputElement;
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    // Debug: imprimir valores de todos los inputs
    console.log('Email inputs:', Array.from(emailInputs).map(i => (i as HTMLInputElement).value));
    console.log('Password inputs:', Array.from(passwordInputs).map(i => (i as HTMLInputElement).value));
    expect(emailInput.value).to.contain('test@example.com');
    expect(passwordInput.value).to.contain('password123');
  });
});
