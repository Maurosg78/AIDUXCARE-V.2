import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';

// 🏥 MOCKS MÉDICOS EMPRESARIALES
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock del servicio Firebase Auth
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSendVerificationEmail = vi.fn();

vi.mock('../core/auth/firebaseAuthService', () => ({
  FirebaseAuthService: vi.fn().mockImplementation(() => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    sendVerificationEmail: mockSendVerificationEmail,
  })),
}));

// Mock del logo
vi.mock('../components/branding/AiDuxCareLogo', () => ({
  AiDuxCareLogo: ({ size }: { size: string }) => <div data-testid="aidux-logo" data-size={size}>AiDuxCare Logo</div>,
}));

// Utility para renderizar con router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('🏥 WelcomePage - Tests de Integración Médica', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      
      // Verificar formularios
      expect(screen.getByLabelText('Email Profesional')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre Completo *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Profesional *')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña Segura *')).toBeInTheDocument();
      
      // Verificar botones
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crear Cuenta Profesional' })).toBeInTheDocument();
      
      // Verificar mensaje de compliance
      expect(screen.getByText(/Cumplimos con estándares HIPAA\/GDPR/)).toBeInTheDocument();
    });
    
    it('debe mostrar placeholders médicos apropiados', () => {
      renderWithRouter(<WelcomePage />);
      
      expect(screen.getByPlaceholderText('tu.email@hospital.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tu contraseña segura')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Dr. Juan Pérez o María González')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mínimo 8 caracteres con mayús, minus, números y símbolos')).toBeInTheDocument();
    });
  });

  describe('🔐 Flujo de Login Médico', () => {
    
    it('debe manejar login exitoso con email verificado', async () => {
      const user = userEvent.setup();
      
      mocksignIn.mockResolvedValue({
        emailVerified: true,
        uid: 'test-uid',
        email: 'dr.test@hospital.com'
      });
      
      renderWithRouter(<WelcomePage />);
      
      // Llenar formulario de login
      await user.type(screen.getByLabelText('Email Profesional'), 'dr.test@hospital.com');
      await user.type(screen.getByLabelText('Contraseña'), 'SecurePass123!');
      
      // Enviar formulario
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
      
      await waitFor(() => {
        expect(mocksignIn).toHaveBeenCalledWith('dr.test@hospital.com', 'SecurePass123!');
        expect(mockNavigate).toHaveBeenCalledWith('/professional-workflow');
      });
    });
    
    it('debe manejar login con email no verificado', async () => {
      const user = userEvent.setup();
      
      mocksignIn.mockResolvedValue({
        emailVerified: false,
        uid: 'test-uid',
        email: 'dr.test@hospital.com'
      });
      
      renderWithRouter(<WelcomePage />);
      
      await user.type(screen.getByLabelText('Email Profesional'), 'dr.test@hospital.com');
      await user.type(screen.getByLabelText('Contraseña'), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
      
      await waitFor(() => {
        expect(screen.getByText('Verificación de email requerida para acceso médico')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reenviar verificación' })).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/verify-email', { state: { email: 'dr.test@hospital.com' } });
      });
    });
    
    it('debe mostrar errores médicos específicos en login', async () => {
      const user = userEvent.setup();
      
      const errorCases = [
        { error: 'user-not-found', expectedMessage: 'No existe una cuenta profesional con este email' },
        { error: 'wrong-password', expectedMessage: 'Contraseña incorrecta. Verifica tus credenciales' },
        { error: 'too-many-requests', expectedMessage: 'Demasiados intentos fallidos. Espera 5 minutos e intenta nuevamente' },
        { error: 'invalid-email', expectedMessage: 'El formato del email es inválido' },
        { error: 'user-disabled', expectedMessage: 'Esta cuenta ha sido deshabilitada. Contacta al administrador' }
      ];
      
      for (const { error, expectedMessage } of errorCases) {
        mocksignIn.mockRejectedValue(new Error(error));
        
        renderWithRouter(<WelcomePage />);
        
        await user.type(screen.getByLabelText('Email Profesional'), 'test@test.com');
        await user.type(screen.getByLabelText('Contraseña'), 'password');
        await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
        
        await waitFor(() => {
          expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        });
        
        // Limpiar para siguiente test
        vi.clearAllMocks();
      }
    });
    
    it('debe validar formulario antes del envío', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<WelcomePage />);
      
      // Intentar enviar sin llenar campos
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
      
      // El formulario no debería enviarse por validación HTML5
      expect(mocksignIn).not.toHaveBeenCalled();
    });
  });

  describe('📝 Flujo de Registro Médico', () => {
    
    it('debe manejar registro exitoso', async () => {
      const user = userEvent.setup();
      
      mocksignUp.mockResolvedValue({
        uid: 'new-user-uid',
        email: 'dr.nuevo@hospital.com'
      });
      
      renderWithRouter(<WelcomePage />);
      
      // Llenar formulario de registro
      await user.type(screen.getByLabelText('Nombre Completo *'), 'Dr. Juan Pérez');
      await user.type(screen.getByLabelText('Email Profesional *'), 'dr.nuevo@hospital.com');
      await user.type(screen.getByLabelText('Contraseña Segura *'), 'SecurePass123!');
      
      // Enviar formulario
      await user.click(screen.getByRole('button', { name: 'Crear Cuenta Profesional' }));
      
      await waitFor(() => {
        expect(mocksignUp).toHaveBeenCalledWith(
          'dr.nuevo@hospital.com',
          'SecurePass123!',
          'Dr. Juan Pérez'
        );
        
        // Verificar mensaje de éxito
        expect(screen.getByText('¡Registro exitoso!')).toBeInTheDocument();
        expect(screen.getByText(/Hemos enviado un correo de verificación/)).toBeInTheDocument();
        expect(screen.getByText('dr.nuevo@hospital.com')).toBeInTheDocument();
      });
    });
    
    it('debe mostrar errores médicos específicos en registro', async () => {
      const user = userEvent.setup();
      
      const errorCases = [
        { error: 'email-already-in-use', expectedMessage: 'Ya existe una cuenta profesional con este email. ¿Deseas iniciar sesión?' },
        { error: 'weak-password', expectedMessage: 'La contraseña es demasiado débil para una cuenta médica' },
        { error: 'invalid-email', expectedMessage: 'El formato del email es inválido' },
        { error: 'operation-not-allowed', expectedMessage: 'El registro está temporalmente deshabilitado' }
      ];
      
      for (const { error, expectedMessage } of errorCases) {
        mocksignUp.mockRejectedValue(new Error(error));
        
        renderWithRouter(<WelcomePage />);
        
        await user.type(screen.getByLabelText('Nombre Completo *'), 'Dr. Test');
        await user.type(screen.getByLabelText('Email Profesional *'), 'test@test.com');
        await user.type(screen.getByLabelText('Contraseña Segura *'), 'password');
        await user.click(screen.getByRole('button', { name: 'Crear Cuenta Profesional' }));
        
        await waitFor(() => {
          expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        });
        
        vi.clearAllMocks();
      }
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
      
      // Limpiar y probar email general
      await user.clear(emailInput);
      await user.type(emailInput, 'usuario@gmail.com');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Email válido')).toBeInTheDocument();
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
        expect(screen.getByText('Contraseña segura ✓')).toBeInTheDocument();
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
      
      // Limpiar y probar nombre simple
      await user.clear(nameInput);
      await user.type(nameInput, 'María González');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Nombre válido ✓')).toBeInTheDocument();
      });
    });
  });

  describe('💌 Funcionalidad de Verificación de Email', () => {
    
    it('debe reenviar email de verificación exitosamente', async () => {
      const user = userEvent.setup();
      
      // Configurar estado de email no verificado
      mocksignIn.mockResolvedValue({
        emailVerified: false,
        uid: 'test-uid',
        email: 'dr.test@hospital.com'
      });
      
      mocksendVerificationEmail.mockResolvedValue({});
      
      renderWithRouter(<WelcomePage />);
      
      // Login que activará el prompt de verificación
      await user.type(screen.getByLabelText('Email Profesional'), 'dr.test@hospital.com');
      await user.type(screen.getByLabelText('Contraseña'), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
      
      await waitFor(() => {
        expect(screen.getByText('Verificación de email requerida para acceso médico')).toBeInTheDocument();
      });
      
      // Reenviar verificación
      await user.click(screen.getByRole('button', { name: 'Reenviar verificación' }));
      
      await waitFor(() => {
        expect(mocksendVerificationEmail).toHaveBeenCalledWith('dr.test@hospital.com');
        expect(screen.getByText(/Correo de verificación reenviado exitosamente/)).toBeInTheDocument();
      });
    });
    
    it('debe manejar errores al reenviar verificación', async () => {
      const user = userEvent.setup();
      
      mocksignIn.mockResolvedValue({
        emailVerified: false,
        uid: 'test-uid',
        email: 'dr.test@hospital.com'
      });
      
      mocksendVerificationEmail.mockRejectedValue(new Error('too-many-requests'));
      
      renderWithRouter(<WelcomePage />);
      
      // Activar prompt de verificación
      await user.type(screen.getByLabelText('Email Profesional'), 'dr.test@hospital.com');
      await user.type(screen.getByLabelText('Contraseña'), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Reenviar verificación' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: 'Reenviar verificación' }));
      
      await waitFor(() => {
        expect(screen.getByText('Demasiados intentos. Espera unos minutos antes de solicitar otro email')).toBeInTheDocument();
      });
    });
  });

  describe('🎨 Estados de Carga y Botones', () => {
    
    it('debe mostrar estado de carga en login', async () => {
      const user = userEvent.setup();
      
      // Simular respuesta lenta
      mocksignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithRouter(<WelcomePage />);
      
      await user.type(screen.getByLabelText('Email Profesional'), 'dr.test@hospital.com');
      await user.type(screen.getByLabelText('Contraseña'), 'SecurePass123!');
      
      // Enviar formulario
      await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
      
      // Verificar estado de carga
      expect(screen.getByText('Accediendo...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accediendo/ })).toBeDisabled();
    });
    
    it('debe mostrar estado de carga en registro', async () => {
      const user = userEvent.setup();
      
      mocksignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithRouter(<WelcomePage />);
      
      await user.type(screen.getByLabelText('Nombre Completo *'), 'Dr. Test');
      await user.type(screen.getByLabelText('Email Profesional *'), 'dr.test@hospital.com');
      await user.type(screen.getByLabelText('Contraseña Segura *'), 'SecurePass123!');
      
      await user.click(screen.getByRole('button', { name: 'Crear Cuenta Profesional' }));
      
      expect(screen.getByText('Registrando...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Registrando/ })).toBeDisabled();
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
  });
});