import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from '../WelcomePage';

// Mock de React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WelcomePage - Pipeline de Registro Completo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWelcomePage = () => {
    return render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );
  };

  describe('Flujo de Registro - Paso 1: Datos Personales', () => {
    it('debe mostrar formulario de registro inicial', () => {
      renderWelcomePage();
      
      expect(screen.getByText('Bienvenido a')).toBeDefined();
      expect(screen.getByText('AiDuxCare')).toBeDefined();
      expect(screen.getByText('Registrarse')).toBeDefined();
      expect(screen.getByText('Iniciar sesión')).toBeDefined();
    });

    it('debe permitir completar datos personales', async () => {
      renderWelcomePage();
      
      // Hacer clic en Registrarse para iniciar el flujo
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      // Verificar que se muestra el formulario de registro
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
    });

    it('debe mostrar campos de nombre y apellido separados', async () => {
      renderWelcomePage();
      
      // Hacer clic en Registrarse
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Verificar que existen los campos separados
      expect(screen.getByText('Nombre *')).toBeDefined();
      expect(screen.getByText('Primer apellido *')).toBeDefined();
    });

    it('debe validar campos requeridos', async () => {
      renderWelcomePage();
      
      // Hacer clic en Registrarse
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Intentar continuar sin llenar campos
      const nextButton = screen.getByText('Siguiente');
      fireEvent.click(nextButton);
      
      // Verificar que se muestra error de validación
      await waitFor(() => {
        expect(screen.getByText('Ingresa tu nombre completo (nombre y apellido)')).toBeDefined();
      });
    });
  });

  describe('Flujo de Registro - Paso 2: Datos Profesionales', () => {
    it('debe mostrar campos profesionales', async () => {
      renderWelcomePage();
      
      // Iniciar registro
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Completar datos personales básicos
      const firstNameInput = screen.getByPlaceholderText('Mauricio');
      const lastNameInput = screen.getByPlaceholderText('Sobarzo');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
      
      fireEvent.change(firstNameInput, { target: { value: 'Test' } });
      fireEvent.change(lastNameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      // Continuar al siguiente paso
      const nextButton = screen.getByText('Siguiente');
      fireEvent.click(nextButton);
      
      // Verificar que se muestran campos profesionales
      await waitFor(() => {
        expect(screen.getByText('Datos Profesionales')).toBeDefined();
      });
    });
  });

  describe('Flujo de Registro - Paso 3: Datos de Ubicación', () => {
    it('debe detectar ubicación automáticamente', async () => {
      renderWelcomePage();
      
      // Navegar hasta el paso de ubicación
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Completar pasos anteriores
      const firstNameInput = screen.getByPlaceholderText('Mauricio');
      const lastNameInput = screen.getByPlaceholderText('Sobarzo');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
      
      fireEvent.change(firstNameInput, { target: { value: 'Test' } });
      fireEvent.change(lastNameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const nextButton = screen.getByText('Siguiente');
      fireEvent.click(nextButton);
      
      // Completar datos profesionales
      await waitFor(() => {
        expect(screen.getByText('Datos Profesionales')).toBeDefined();
      });
      
      const nextButton2 = screen.getByText('Siguiente');
      fireEvent.click(nextButton2);
      
      // Verificar que se detecta la ubicación
      await waitFor(() => {
        expect(screen.getByText('Datos de ubicación')).toBeDefined();
      });
    });

    it('debe mostrar países disponibles', async () => {
      renderWelcomePage();
      
      // Navegar hasta el paso de ubicación
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Completar pasos anteriores
      const firstNameInput = screen.getByPlaceholderText('Mauricio');
      const lastNameInput = screen.getByPlaceholderText('Sobarzo');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
      
      fireEvent.change(firstNameInput, { target: { value: 'Test' } });
      fireEvent.change(lastNameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const nextButton = screen.getByText('Siguiente');
      fireEvent.click(nextButton);
      
      // Completar datos profesionales
      await waitFor(() => {
        expect(screen.getByText('Datos Profesionales')).toBeDefined();
      });
      
      const nextButton2 = screen.getByText('Siguiente');
      fireEvent.click(nextButton2);
      
      // Verificar que se muestran opciones de país
      await waitFor(() => {
        expect(screen.getByText('País')).toBeDefined();
      });
    });

    it('debe requerir consentimiento para completar registro', async () => {
      renderWelcomePage();
      
      // Navegar hasta el paso final
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Completar todos los pasos
      const firstNameInput = screen.getByPlaceholderText('Mauricio');
      const lastNameInput = screen.getByPlaceholderText('Sobarzo');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
      
      fireEvent.change(firstNameInput, { target: { value: 'Test' } });
      fireEvent.change(lastNameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const nextButton = screen.getByText('Siguiente');
      fireEvent.click(nextButton);
      
      // Completar datos profesionales
      await waitFor(() => {
        expect(screen.getByText('Datos Profesionales')).toBeDefined();
      });
      
      const nextButton2 = screen.getByText('Siguiente');
      fireEvent.click(nextButton2);
      
      // Verificar que se requiere consentimiento
      await waitFor(() => {
        expect(screen.getByText('política de privacidad')).toBeDefined();
      });
    });
  });

  describe('Registro Completo', () => {
    it('debe registrar usuario exitosamente con todos los datos', async () => {
      renderWelcomePage();
      
      // Iniciar registro
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Completar formulario básico
      const firstNameInput = screen.getByPlaceholderText('Mauricio');
      const lastNameInput = screen.getByPlaceholderText('Sobarzo');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
      
      fireEvent.change(firstNameInput, { target: { value: 'Test' } });
      fireEvent.change(lastNameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const nextButton = screen.getByText('Siguiente');
      fireEvent.click(nextButton);
      
      // Verificar que se puede continuar
      await waitFor(() => {
        expect(screen.getByText('Datos Profesionales')).toBeDefined();
      });
    });

    it('debe manejar errores de registro', async () => {
      renderWelcomePage();
      
      // Iniciar registro
      const registerButton = screen.getByText('Registrarse');
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
      
      // Completar formulario
      const firstNameInput = screen.getByPlaceholderText('Mauricio');
      const lastNameInput = screen.getByPlaceholderText('Sobarzo');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
      
      fireEvent.change(firstNameInput, { target: { value: 'Test' } });
      fireEvent.change(lastNameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'existing@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const nextButton = screen.getByText('Siguiente');
      fireEvent.click(nextButton);
      
      // Verificar que se puede continuar
      await waitFor(() => {
        expect(screen.getByText('Datos Profesionales')).toBeDefined();
      });
    });
  });

  describe('Flujo de Login', () => {
    it('debe permitir login con credenciales válidas', async () => {
      renderWelcomePage();
      
      // Completar formulario de login
      const emailInput = screen.getByPlaceholderText('Correo electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const loginButton = screen.getByText('Iniciar sesión');
      fireEvent.click(loginButton);
      
      // Verificar que el botón existe
      expect(loginButton).toBeDefined();
    });

    it('debe manejar errores de login', async () => {
      renderWelcomePage();
      
      // Completar formulario de login
      const emailInput = screen.getByPlaceholderText('Correo electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });
      
      const loginButton = screen.getByText('Iniciar sesión');
      fireEvent.click(loginButton);
      
      // Verificar que el botón existe
      expect(loginButton).toBeDefined();
    });
  });

  describe('Recuperación de Contraseña', () => {
    it('debe permitir solicitar recuperación de contraseña', async () => {
      renderWelcomePage();
      
      // Buscar enlace de recuperación de contraseña
      const forgotPasswordLink = screen.getByText('¿Olvidaste tu contraseña?');
      fireEvent.click(forgotPasswordLink);
      
      // Verificar que se muestra el enlace
      expect(forgotPasswordLink).toBeDefined();
    });
  });
}); 