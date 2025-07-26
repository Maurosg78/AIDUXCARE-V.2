import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';

// Mock simple del navegador
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

// Mock simple del logo
vi.mock('../components/branding/AiDuxCareLogo', () => ({
  AiDuxCareLogo: ({ size }: { size: string }) => (
    <div data-testid="aidux-logo" data-size={size}>AiDuxCare Logo</div>
  ),
}));

// Mock simple del servicio Firebase
vi.mock('../core/auth/firebaseAuthService', () => ({
  FirebaseAuthService: vi.fn().mockImplementation(() => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    sendVerificationEmail: vi.fn(),
  })),
}));

// Utility para renderizar con router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('🏥 WelcomePage - Tests Básicos de Integración', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('🎨 Renderizado de Interfaz Médica', () => {
    
    it('debe renderizar la interfaz médica completa', () => {
      renderWithRouter(<WelcomePage />);
      
      // Verificar elementos principales
      expect(screen.getByTestId('aidux-logo')).toBeInTheDocument();
      expect(screen.getByText('Acceso Profesional')).toBeInTheDocument();
      expect(screen.getByText('Registro Profesional')).toBeInTheDocument();
      expect(screen.getByText('Ingresa a tu cuenta médica')).toBeInTheDocument();
      expect(screen.getByText('Crea tu cuenta médica segura')).toBeInTheDocument();
    });
    
    it('debe mostrar formularios de login y registro', () => {
      renderWithRouter(<WelcomePage />);
      
      // Verificar formularios
      expect(screen.getByLabelText('Email Profesional')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre Completo *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Profesional *')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña Segura *')).toBeInTheDocument();
    });
    
    it('debe mostrar botones de acción médica', () => {
      renderWithRouter(<WelcomePage />);
      
      // Verificar botones
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Cuenta Profesional' })).toBeInTheDocument();
    });
    
    it('debe mostrar mensaje de compliance HIPAA/GDPR', () => {
      renderWithRouter(<WelcomePage />);
      
      // Verificar mensaje de compliance
      expect(screen.getByText(/Cumplimos con estándares HIPAA\/GDPR/)).toBeInTheDocument();
      expect(screen.getByText(/Software de nivel hospitalario/)).toBeInTheDocument();
    });
    
    it('debe mostrar placeholders médicos apropiados', () => {
      renderWithRouter(<WelcomePage />);
      
      expect(screen.getByPlaceholderText('tu.email@hospital.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tu contraseña segura')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Dr. Juan Pérez o María González')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mínimo 8 caracteres con mayús, minus, números y símbolos')).toBeInTheDocument();
    });
  });

  describe('🔍 Validación en Tiempo Real', () => {
    
    it('debe validar email médico en tiempo real', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      const emailInput = screen.getByLabelText('Email Profesional');
      
      // Probar email médico
      await user.type(emailInput, 'dr.cardiologo@hospital.com');
      await user.tab(); // Trigger onBlur
      
      await waitFor(() => {
        expect(screen.getByText('Email médico verificado ✓')).toBeInTheDocument();
      });
    });
    
    it('debe validar contraseña en tiempo real', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      const passwordInput = screen.getByLabelText('Contraseña Segura *');
      
      // Probar contraseña débil
      await user.type(passwordInput, 'weak');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Mínimo 8 caracteres requeridos')).toBeInTheDocument();
      });
      
      // Limpiar y probar contraseña fuerte
      await user.clear(passwordInput);
      await user.type(passwordInput, 'SecurePass123!');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Contraseña muy segura ✓')).toBeInTheDocument();
      });
    });
    
    it('debe validar nombre médico en tiempo real', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      const nameInput = screen.getByLabelText('Nombre Completo *');
      
      // Probar nombre con título médico
      await user.type(nameInput, 'Dr. Juan Pérez');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Título médico/profesional detectado ✓')).toBeInTheDocument();
      });
    });
  });

  describe('🎨 Estados de UI y Estilos Médicos', () => {
    
    it('debe mostrar indicadores visuales de validación', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      const emailInput = screen.getByLabelText('Email Profesional *');
      
      // Probar email médico válido
      await user.type(emailInput, 'dr.test@hospital.com');
      await user.tab();
      
      await waitFor(() => {
        // El input debería tener clases de éxito (verde)
        expect(emailInput).toHaveClass('border-green-500');
        expect(emailInput).toHaveClass('bg-green-50');
      });
    });
    
    it('debe mostrar indicadores de error', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      const emailInput = screen.getByLabelText('Email Profesional *');
      
      // Probar email inválido
      await user.type(emailInput, 'email-invalido');
      await user.tab();
      
      await waitFor(() => {
        // El input debería tener clases de error (rojo)
        expect(emailInput).toHaveClass('border-red-500');
        expect(emailInput).toHaveClass('bg-red-50');
      });
    });
  });

  describe('🔗 Navegación y Enlaces', () => {
    
    it('debe navegar a páginas auxiliares', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      // Verificar botón de contraseña olvidada
      await user.click(screen.getByText('¿Olvidaste tu contraseña?'));
      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
      
      // Verificar botón de MFA
      await user.click(screen.getByText('Configurar Autenticación Multifactor'));
      expect(mockNavigate).toHaveBeenCalledWith('/mfa-guide');
    });
  });

  describe('🛡️ Accesibilidad y UX Médica', () => {
    
    it('debe tener labels correctos para formularios médicos', () => {
      renderWithRouter(<WelcomePage />);
      
      // Verificar que todos los inputs tienen labels apropiados
      expect(screen.getByLabelText('Email Profesional')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre Completo *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Profesional *')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña Segura *')).toBeInTheDocument();
    });
    
    it('debe mantener el foco y navegación por teclado', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      // Verificar que se puede navegar por tab
      await user.tab();
      expect(screen.getByLabelText('Email Profesional')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Contraseña')).toHaveFocus();
    });
  });

  describe('📱 Responsividad y Layout', () => {
    
    it('debe tener layout responsivo apropiado', () => {
      renderWithRouter(<WelcomePage />);
      
      const mainContainer = screen.getByRole('main');
      
      // Verificar clases responsivas
      expect(mainContainer).toHaveClass('flex-col');
      expect(mainContainer).toHaveClass('lg:flex-row');
      expect(mainContainer).toHaveClass('max-w-6xl');
    });
    
    it('debe usar clases de Tailwind CSS médicas', () => {
      renderWithRouter(<WelcomePage />);
      
      // Verificar gradientes médicos
      const container = screen.getByRole('main').parentElement;
      expect(container).toHaveClass('bg-gradient-to-br');
      expect(container).toHaveClass('from-blue-50');
      expect(container).toHaveClass('to-green-50');
    });
  });

  describe('🔬 Tests de Performance Básicos', () => {
    
    it('debe renderizar en menos de 100ms', () => {
      const startTime = performance.now();
      
      renderWithRouter(<WelcomePage />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(100);
    });
    
    it('debe manejar múltiples validaciones sin bloqueo', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      const startTime = performance.now();
      
      // Ejecutar múltiples validaciones
      const emailInput = screen.getByLabelText('Email Profesional');
      const passwordInput = screen.getByLabelText('Contraseña Segura *');
      const nameInput = screen.getByLabelText('Nombre Completo *');
      
      await user.type(emailInput, 'dr.test@hospital.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(nameInput, 'Dr. Juan Pérez');
      
      await user.tab();
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;
      
      // Debe completarse en menos de 500ms
      expect(validationTime).toBeLessThan(500);
    });
  });
});