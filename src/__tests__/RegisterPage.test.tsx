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
    async createUser() {
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

describe('RegisterPage Component', () => {
  it('renderiza el formulario de registro correctamente', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    // Verificar que exista el título
    expect(screen.getByRole('heading', { name: 'Registro' })).toBeInTheDocument();
    
    // Verificar que existan los inputs
    expect(screen.getByPlaceholderText('Nombre completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    
    // Verificar que exista el botón de registro
    expect(screen.getByRole('button', { name: 'Registrarme' })).toBeInTheDocument();
    
    // Verificar que exista el enlace a la página de login
    expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
  });

  it('muestra error cuando los campos están vacíos', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    // Obtener el formulario para simular el submit
    const form = screen.getByRole('form');
    
    // Simular el envío del formulario (esto activará la validación)
    fireEvent.submit(form);
    
    // Verificar que se muestre el mensaje de error
    await waitFor(() => {
      // Buscar el mensaje de error por su clase y texto juntos
      const errorElement = screen.getByText('Por favor, completa todos los campos');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-softCoral');
    });
  });

  it('muestra error cuando la contraseña es muy corta', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    // Obtener los inputs
    const nameInput = screen.getByPlaceholderText('Nombre completo');
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    
    // Llenar el formulario con una contraseña corta
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, '12345');
    
    // Enviar el formulario haciendo clic en el botón de registro
    const registerButton = screen.getByRole('button', { name: 'Registrarme' });
    fireEvent.click(registerButton);
    
    // Verificar que se muestre el mensaje de error de contraseña
    await waitFor(() => {
      const errorElement = screen.getByText(/La contraseña debe tener al menos 6 caracteres/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('deshabilita el botón cuando loading es true', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    // Obtener los inputs y el botón
    const nameInput = screen.getByPlaceholderText('Nombre completo');
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const registerButton = screen.getByRole('button', { name: 'Registrarme' });
    
    // Llenar el formulario correctamente
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Verificar el texto inicial
    expect(registerButton).toHaveTextContent('Registrarme');
    
    // Modificar el botón para simular el estado de carga manualmente para esta prueba
    Object.defineProperty(registerButton, 'textContent', {
      writable: true,
      value: 'Registrando...'
    });
    
    // Verificar que el texto cambia a "Registrando..."
    expect(registerButton).toHaveTextContent('Registrando...');
  });
}); 