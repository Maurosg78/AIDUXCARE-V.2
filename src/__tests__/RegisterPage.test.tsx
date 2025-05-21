// src/__tests__/RegisterPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
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
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Regístrate' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument();
  });

  it('muestra errores de validación cuando faltan campos', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Por favor, completa todos los campos')).toBeInTheDocument();
    });
  });

  it('permite escribir en los inputs', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    await userEvent.type(screen.getByPlaceholderText('Correo electrónico'), 'juan@ejemplo.com');
    await userEvent.type(screen.getByPlaceholderText('Nombre completo'), 'Juan Pérez');
    await userEvent.type(screen.getByPlaceholderText('Contraseña'), 'password123');

    expect(screen.getByPlaceholderText('Correo electrónico')).toHaveValue('juan@ejemplo.com');
    expect(screen.getByPlaceholderText('Nombre completo')).toHaveValue('Juan Pérez');
    expect(screen.getByPlaceholderText('Contraseña')).toHaveValue('password123');
  });
});
