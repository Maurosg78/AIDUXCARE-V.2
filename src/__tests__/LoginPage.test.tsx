import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// Mock del cliente de Supabase
vi.mock('../core/auth/supabaseClient', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn()
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
    // Crear un mock para el preventDefault
    const mockPreventDefault = vi.fn();
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Hacer clic en el botón de login sin llenar los campos
    const loginButton = screen.getByRole('button', { name: 'Iniciar sesión' });
    expect(loginButton).toBeInTheDocument();
 
    // Simular el envío del formulario directamente
    const form = screen.getByRole('form');
    fireEvent.submit(form, { preventDefault: mockPreventDefault });
    
    // Verificar que se muestre el mensaje de error (usar waitFor para dar tiempo a actualizar el estado)
    await waitFor(() => {
      const errorElement = screen.getByText(/Por favor, completa todos los campos/i);
      expect(errorElement).toBeInTheDocument();
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
    
    // Simular que el botón se ha clickeado y está cargando
    fireEvent.click(loginButton);
    
    // El botón debería cambiar su texto a "Iniciando sesión..."
    expect(screen.getByRole('button')).toHaveTextContent('Iniciando sesión...');
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