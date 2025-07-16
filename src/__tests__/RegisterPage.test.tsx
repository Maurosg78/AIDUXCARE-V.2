// @vitest-environment jsdom
// src/__tests__/RegisterPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../pages/RegisterPage';
import { renderWithRouter } from './test-utils';
import { supabaseClientMock } from '../__mocks__/supabase/authMock';

// Mock del cliente de Supabase
vi.mock('../core/auth/supabaseClient', () => ({
  default: supabaseClientMock
}));

// Mock de checkSupabaseConnection
vi.mock('../utils/checkSupabaseConnection', () => ({
  checkSupabaseConnection: () =>
    Promise.resolve({ isConnected: true, url: 'https://test.supabase.co', latency: 50 }),
  logSupabaseConnectionStatus: vi.fn()
}));

// Mock de useNavigate sin TS2698
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('RegisterPage Component', () => {
  it('renderiza el formulario de registro correctamente', () => {
    renderWithRouter(
      <RegisterPage />
    );
    expect(screen.getByRole('heading', { name: 'Registro' })).to.exist;
    expect(screen.getAllByPlaceholderText('Correo electrónico')[0]).to.exist;
    expect(screen.getAllByPlaceholderText('Nombre completo')[0]).to.exist;
    expect(screen.getAllByPlaceholderText('Contraseña')[0]).to.exist;
    expect(screen.getAllByRole('button', { name: 'Registrarme' })[0]).to.exist;
  });

  it('muestra errores de validación cuando faltan campos', async () => {
    renderWithRouter(
      <RegisterPage />
    );
    fireEvent.submit(screen.getAllByTestId('register-form')[0]);
    await waitFor(() => {
      expect(screen.getByText('Por favor, completa todos los campos')).to.exist;
    });
  });

  it('permite escribir en los inputs', async () => {
    renderWithRouter(
      <RegisterPage />
    );
    const emailInput = screen.getAllByPlaceholderText('Correo electrónico')[0] as HTMLInputElement;
    const nameInput = screen.getAllByPlaceholderText('Nombre completo')[0] as HTMLInputElement;
    const passwordInput = screen.getAllByPlaceholderText('Contraseña')[0] as HTMLInputElement;
    await userEvent.type(emailInput, 'juan@ejemplo.com');
    await userEvent.type(nameInput, 'Juan Pérez');
    await userEvent.type(passwordInput, 'password123');
    expect(emailInput.value).to.equal('juan@ejemplo.com');
    expect(nameInput.value).to.equal('Juan Pérez');
    expect(passwordInput.value).to.equal('password123');
  });
});
