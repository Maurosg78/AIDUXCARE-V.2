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

describe('WelcomePage - Tests Simples', () => {
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

  describe('Renderizado Básico', () => {
    it('debe mostrar el título principal', () => {
      renderWelcomePage();
      
      expect(screen.getByText('Bienvenido a')).toBeDefined();
      expect(screen.getByText('AiDuxCare')).toBeDefined();
    });

    it('debe mostrar los botones de login y registro', () => {
      renderWelcomePage();
      
      expect(screen.getByText('Registrarse')).toBeDefined();
      expect(screen.getByText('Iniciar sesión')).toBeDefined();
    });

    it('debe mostrar la descripción', () => {
      renderWelcomePage();
      
      expect(screen.getByText(/Asistente clínico impulsado por inteligencia artificial/)).toBeDefined();
    });
  });

  describe('Navegación entre Tabs', () => {
    it('debe cambiar entre login y registro', async () => {
      renderWelcomePage();
      
      // Por defecto debe estar en login
      const loginTab = screen.getByText('Iniciar sesión');
      const registerTab = screen.getByText('Registrarse');
      
      expect(loginTab).toBeDefined();
      expect(registerTab).toBeDefined();
      
      // Hacer clic en registro
      fireEvent.click(registerTab);
      
      // Verificar que se muestra el wizard
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
      });
    });
  });

  describe('Formulario de Login', () => {
    it('debe mostrar campos de email y contraseña', () => {
      renderWelcomePage();
      
      expect(screen.getByPlaceholderText('Correo electrónico')).toBeDefined();
      expect(screen.getByPlaceholderText('Contraseña')).toBeDefined();
    });

    it('debe mostrar enlace de recuperación de contraseña', () => {
      renderWelcomePage();
      
      expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeDefined();
    });
  });

  describe('Wizard de Registro', () => {
    it('debe mostrar el paso 1 al iniciar registro', async () => {
      renderWelcomePage();
      
      // Hacer clic en registro
      const registerTab = screen.getByText('Registrarse');
      fireEvent.click(registerTab);
      
      await waitFor(() => {
        expect(screen.getByText('Datos personales')).toBeDefined();
        expect(screen.getByText('Introduce tus datos básicos para comenzar el registro.')).toBeDefined();
      });
    });

    it('debe mostrar campos de nombre y apellido separados', async () => {
      renderWelcomePage();
      
      // Hacer clic en registro
      const registerTab = screen.getByText('Registrarse');
      fireEvent.click(registerTab);
      
      await waitFor(() => {
        expect(screen.getByText('Nombre *')).toBeDefined();
        expect(screen.getByText('Primer apellido *')).toBeDefined();
      });
    });

    it('debe mostrar indicador de progreso', async () => {
      renderWelcomePage();
      
      // Hacer clic en registro
      const registerTab = screen.getByText('Registrarse');
      fireEvent.click(registerTab);
      
      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeDefined();
      });
    });
  });

  describe('Validación de Campos', () => {
    it('debe validar campos requeridos', async () => {
      renderWelcomePage();
      
      // Hacer clic en registro
      const registerTab = screen.getByText('Registrarse');
      fireEvent.click(registerTab);
      
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

  describe('Footer', () => {
    it('debe mostrar copyright', () => {
      renderWelcomePage();
      
      expect(screen.getByText(/© 2025 AiDuxCare/)).toBeDefined();
      expect(screen.getByText(/Software médico de nivel hospitalario/)).toBeDefined();
      expect(screen.getByText(/Cumple HIPAA\/GDPR\/XAI/)).toBeDefined();
    });
  });
}); 