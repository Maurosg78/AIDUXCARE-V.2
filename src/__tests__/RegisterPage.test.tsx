import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';

// Mock del cliente de Supabase
vi.mock('../core/auth/supabaseClient', () => ({
  default: {
    auth: {
      signUp: vi.fn()
    }
  }
}));

// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
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

    // Verificar que exista el título (usando role para evitar ambigüedad)
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
    
    // Verificar que existan los inputs para nombre, email y contraseña
    expect(screen.getByPlaceholderText('Nombre completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    
    // Verificar que exista el botón de registro
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument();
    
    // Verificar que exista el enlace a la página de login
    expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
  });

  it('muestra error cuando los campos están vacíos', async () => {
    // Crear un mock para el preventDefault
    const mockPreventDefault = vi.fn();
    
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    // Simular el envío del formulario directamente
    const form = screen.getByRole('form');
    fireEvent.submit(form, { preventDefault: mockPreventDefault });
    
    // Verificar que se muestre el mensaje de error (usar waitFor para dar tiempo a actualizar el estado)
    await waitFor(() => {
      const errorElement = screen.getByText(/Por favor, completa todos los campos/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('muestra error cuando la contraseña es muy corta', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    // Obtener los inputs y el botón
    const nameInput = screen.getByPlaceholderText('Nombre completo');
    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    
    // Llenar el formulario con una contraseña corta
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, '12345');
    
    // Hacer clic en el botón de registro
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
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
    const registerButton = screen.getByRole('button', { name: 'Crear cuenta' });
    
    // Llenar el formulario correctamente
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Simular que el botón se ha clickeado y está cargando
    fireEvent.click(registerButton);
    
    // El botón debería cambiar su texto a "Creando cuenta..."
    expect(screen.getByRole('button')).toHaveTextContent('Creando cuenta...');
  });

  it('permite la navegación a la página de login', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    // Verificar que el enlace a la página de login existe y tiene el href correcto
    const loginLink = screen.getByText('Inicia sesión');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });
}); 