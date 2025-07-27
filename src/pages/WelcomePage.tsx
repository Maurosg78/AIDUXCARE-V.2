import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthService } from '../core/auth/firebaseAuthService';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

interface RegistrationForm {
  name: string;
  email: string;
  password: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface FieldValidation {
  isValid: boolean;
  message: string;
  severity: 'success' | 'warning' | 'error';
}

// 🏥 SISTEMA DE VALIDACIÓN MÉDICA EMPRESARIAL
class MedicalValidationService {
  
  static validateEmail(email: string): FieldValidation {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) {
      return { isValid: false, message: 'El email es obligatorio', severity: 'error' };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Formato de email inválido', severity: 'error' };
    }
    
    // Validación de dominios médicos comunes
    const medicalDomains = ['hospital', 'clinica', 'medico', 'salud', 'medicina', 'health'];
    const isMedicalDomain = medicalDomains.some(domain => 
      email.toLowerCase().includes(domain)
    );
    
    // Validación de dominios profesionales
    const professionalDomains = ['.edu', '.org', '.gov', 'universidad', 'university'];
    const isProfessionalDomain = professionalDomains.some(domain => 
      email.toLowerCase().includes(domain)
    );
    
    if (isMedicalDomain) {
      return { isValid: true, message: 'Email médico verificado ✓', severity: 'success' };
    } else if (isProfessionalDomain) {
      return { isValid: true, message: 'Email profesional verificado ✓', severity: 'success' };
    } else {
      return { isValid: true, message: 'Email válido', severity: 'warning' };
    }
  }
  
  static validatePassword(password: string): FieldValidation {
    if (!password) {
      return { isValid: false, message: 'La contraseña es obligatoria', severity: 'error' };
    }
    
    if (password.length < 8) {
      return { isValid: false, message: 'Mínimo 8 caracteres requeridos', severity: 'error' };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const requirements = [
      { met: hasUpperCase, text: 'Una mayúscula' },
      { met: hasLowerCase, text: 'Una minúscula' },
      { met: hasNumbers, text: 'Un número' },
      { met: hasSpecialChar, text: 'Un carácter especial' }
    ];
    
    const unmetRequirements = requirements.filter(req => !req.met);
    
    if (unmetRequirements.length > 0) {
      return { 
        isValid: false, 
        message: `Falta: ${unmetRequirements.map(req => req.text).join(', ')}`,
        severity: 'error'
      };
    }
    
    // Validación de patrones comunes inseguros
    const commonPatterns = ['123456', 'password', 'qwerty', 'admin', 'test', 'user'];
    const hasCommonPattern = commonPatterns.some(pattern => 
      password.toLowerCase().includes(pattern)
    );
    
    if (hasCommonPattern) {
      return { 
        isValid: false, 
        message: 'Contraseña demasiado común, elige otra más segura', 
        severity: 'error' 
      };
    }
    
    // Validación de fortaleza avanzada
    if (password.length >= 12 && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) {
      return { isValid: true, message: 'Contraseña muy segura ✓', severity: 'success' };
    } else {
      return { isValid: true, message: 'Contraseña segura ✓', severity: 'success' };
    }
  }
  
  static validateName(name: string): FieldValidation {
    if (!name) {
      return { isValid: false, message: 'El nombre es obligatorio', severity: 'error' };
    }
    
    if (name.length < 2) {
      return { isValid: false, message: 'Nombre demasiado corto', severity: 'error' };
    }
    
    if (name.length > 100) {
      return { isValid: false, message: 'Nombre demasiado largo (máx. 100 caracteres)', severity: 'error' };
    }
    
    const nameRegex = /^[a-zA-ZÀ-ÿñÑ\s'-\.]+$/;
    if (!nameRegex.test(name)) {
      return { 
        isValid: false, 
        message: 'Solo letras, espacios, guiones, apostrofes y puntos', 
        severity: 'error' 
      };
    }
    
    // Validación de títulos médicos comunes
    const medicalTitles = ['Dr.', 'Dra.', 'Prof.', 'Mg.', 'PhD', 'MD', 'DO', 'DDS', 'PharmD'];
    const hasMedicalTitle = medicalTitles.some(title => name.includes(title));
    
    // Validación de nombres profesionales
    const professionalSuffixes = ['MD', 'DDS', 'PhD', 'MSc', 'BSc'];
    const hasProfessionalSuffix = professionalSuffixes.some(suffix => 
      name.toUpperCase().includes(suffix)
    );
    
    if (hasMedicalTitle || hasProfessionalSuffix) {
      return { 
        isValid: true, 
        message: 'Título médico/profesional detectado ✓', 
        severity: 'success' 
      };
    } else {
      return { isValid: true, message: 'Nombre válido ✓', severity: 'success' };
    }
  }
}

// 🎨 SISTEMA DE ESTILOS DINÁMICOS MÉDICOS
class MedicalUIService {
  
  static getFieldStyles(validation?: FieldValidation, hasError?: string): string {
    let baseClasses = "w-full p-3 border-2 rounded-xl transition-all duration-300 text-base ";
    
    if (hasError) {
      return baseClasses + "border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200 text-red-900 placeholder-red-400";
    } else if (validation?.isValid && validation.severity === 'success') {
      return baseClasses + "border-green-500 bg-green-50 focus:border-green-600 focus:ring-2 focus:ring-green-200 text-green-900";
    } else if (validation?.isValid && validation.severity === 'warning') {
      return baseClasses + "border-yellow-500 bg-yellow-50 focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200 text-yellow-900";
    } else if (validation && !validation.isValid) {
      return baseClasses + "border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200 text-red-900";
    } else {
      return baseClasses + "border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400";
    }
  }
  
  static getValidationMessageStyles(validation?: FieldValidation): string {
    if (!validation) return '';
    
    const baseClasses = "text-sm mt-1 font-medium ";
    
    switch (validation.severity) {
      case 'success':
        return baseClasses + "text-green-600";
      case 'warning':
        return baseClasses + "text-yellow-600";
      case 'error':
        return baseClasses + "text-red-600";
      default:
        return baseClasses + "text-gray-600";
    }
  }
}

const authService = new FirebaseAuthService();

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados de formularios
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [regForm, setRegForm] = useState<RegistrationForm>({ name: '', email: '', password: '' });
  
  // Estados de errores y validación
  const [loginErrors, setLoginErrors] = useState<ValidationErrors>({});
  const [regErrors, setRegErrors] = useState<ValidationErrors>({});
  const [fieldValidations, setFieldValidations] = useState<{[key: string]: FieldValidation}>({});
  
  // Estados de carga y UI
  const [loginLoading, setLoginLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const [verifyEmailLoading, setVerifyEmailLoading] = useState(false);
  const [verifyEmailSuccess, setVerifyEmailSuccess] = useState<string | null>(null);
  const [verifyEmailError, setVerifyEmailError] = useState<string | null>(null);

  // 🔍 VALIDACIÓN EN TIEMPO REAL CON DEBOUNCE
  const validateField = (formType: 'login' | 'register', fieldName: string, value: string) => {
    let validation: FieldValidation;
    
    switch (fieldName) {
      case 'email':
        validation = MedicalValidationService.validateEmail(value);
        break;
      case 'password':
        validation = MedicalValidationService.validatePassword(value);
        break;
      case 'name':
        validation = MedicalValidationService.validateName(value);
        break;
      default:
        validation = { isValid: true, message: '', severity: 'success' };
    }
    
    const fieldKey = `${formType}_${fieldName}`;
    setFieldValidations(prev => ({
      ...prev,
      [fieldKey]: validation
    }));
    
    // Limpiar errores de formulario si el campo es válido
    if (validation.isValid) {
      if (formType === 'login') {
        setLoginErrors(prev => ({ ...prev, [fieldName]: '' }));
      } else {
        setRegErrors(prev => ({ ...prev, [fieldName]: '' }));
      }
    }
  };

  // 🔐 LÓGICA DE LOGIN CON MANEJO DE ERRORES MÉDICO
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación pre-envío
    const emailValidation = MedicalValidationService.validateEmail(loginForm.email);
    const passwordValidation = MedicalValidationService.validatePassword(loginForm.password);
    
    const errors: ValidationErrors = {};
    if (!emailValidation.isValid) errors.email = emailValidation.message;
    if (!passwordValidation.isValid) errors.password = passwordValidation.message;
    
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    
    setLoginErrors({});
    setLoginLoading(true);
    
    try {
      const userProfile = await authService.signIn(loginForm.email, loginForm.password);
      
      if (userProfile?.emailVerified) {
        // Login exitoso - redirigir al workflow profesional
        navigate('/professional-workflow');
      } else if (userProfile && !userProfile.emailVerified) {
        // Email no verificado - mostrar prompt específico
        setShowVerifyPrompt(true);
        navigate('/verify-email', { state: { email: loginForm.email } });
      }
    } catch (err: unknown) {
      const error = err as Error;
      let userFriendlyMessage = 'Error al iniciar sesión';
      
      // Mapeo de errores Firebase a mensajes médicos específicos
      if (error.message.includes('user-not-found')) {
        userFriendlyMessage = 'No existe una cuenta profesional con este email';
      } else if (error.message.includes('wrong-password')) {
        userFriendlyMessage = 'Contraseña incorrecta. Verifica tus credenciales';
      } else if (error.message.includes('too-many-requests')) {
        userFriendlyMessage = 'Demasiados intentos fallidos. Espera 5 minutos e intenta nuevamente';
      } else if (error.message.includes('network')) {
        userFriendlyMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar';
      } else if (error.message.includes('invalid-email')) {
        userFriendlyMessage = 'El formato del email es inválido';
      } else if (error.message.includes('user-disabled')) {
        userFriendlyMessage = 'Esta cuenta ha sido deshabilitada. Contacta al administrador';
      }
      
      setLoginErrors({ general: userFriendlyMessage });
    } finally {
      setLoginLoading(false);
    }
  };

  // 📝 LÓGICA DE REGISTRO CON VALIDACIÓN MÉDICA COMPLETA
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación exhaustiva pre-envío
    const nameValidation = MedicalValidationService.validateName(regForm.name);
    const emailValidation = MedicalValidationService.validateEmail(regForm.email);
    const passwordValidation = MedicalValidationService.validatePassword(regForm.password);
    
    const errors: ValidationErrors = {};
    if (!nameValidation.isValid) errors.name = nameValidation.message;
    if (!emailValidation.isValid) errors.email = emailValidation.message;
    if (!passwordValidation.isValid) errors.password = passwordValidation.message;
    
    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }
    
    setRegErrors({});
    setRegLoading(true);
    
    try {
      await authService.signUp(regForm.email, regForm.password, regForm.name);
      setVerificationSent(true);
    } catch (err: unknown) {
      const error = err as Error;
      let userFriendlyMessage = 'Error al registrar cuenta profesional';
      
      // Mapeo de errores Firebase a mensajes médicos específicos
      if (error.message.includes('email-already-in-use')) {
        userFriendlyMessage = 'Ya existe una cuenta profesional con este email. ¿Deseas iniciar sesión?';
      } else if (error.message.includes('weak-password')) {
        userFriendlyMessage = 'La contraseña es demasiado débil para una cuenta médica';
      } else if (error.message.includes('invalid-email')) {
        userFriendlyMessage = 'El formato del email es inválido';
      } else if (error.message.includes('operation-not-allowed')) {
        userFriendlyMessage = 'El registro está temporalmente deshabilitado';
      } else if (error.message.includes('network')) {
        userFriendlyMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar';
      }
      
      setRegErrors({ general: userFriendlyMessage });
    } finally {
      setRegLoading(false);
    }
  };

  // 🔄 HANDLERS DE INPUT CON VALIDACIÓN EN TIEMPO REAL
  const handleLoginInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    
    // Validar solo si el campo tiene contenido o perdió el foco
    if (value.length > 0) {
      validateField('login', name, value);
    }
  };

  const handleRegInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegForm(prev => ({ ...prev, [name]: value }));
    
    // Validar solo si el campo tiene contenido o perdió el foco
    if (value.length > 0) {
      validateField('register', name, value);
    }
  };

  const handleResendVerification = async () => {
    setVerifyEmailLoading(true);
    setVerifyEmailSuccess(null);
    setVerifyEmailError(null);
    
    try {
      await authService.sendVerificationEmail(loginForm.email);
      setVerifyEmailSuccess('Correo de verificación reenviado exitosamente. Revisa tu bandeja de entrada y spam.');
    } catch (err: unknown) {
      const error = err as Error;
      let errorMessage = 'Error al reenviar verificación';
      
      if (error.message.includes('too-many-requests')) {
        errorMessage = 'Demasiados intentos. Espera unos minutos antes de solicitar otro email';
      } else if (error.message.includes('user-not-found')) {
        errorMessage = 'Usuario no encontrado. Verifica el email';
      }
      
      setVerifyEmailError(errorMessage);
    } finally {
      setVerifyEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
      <header className="w-full flex justify-center py-6">
        <AiDuxCareLogo size="md" />
      </header>
      
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        {/* Panel Login */}
        <section className="flex-1 lg:border-r lg:border-gray-200 lg:pr-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Acceso Profesional</h2>
            <p className="text-gray-600">Ingresa a tu cuenta médica</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Profesional
              </label>
              <input 
                id="login-email"
                type="email" 
                name="email" 
                value={loginForm.email} 
                onChange={handleLoginInput}
                onBlur={() => validateField('login', 'email', loginForm.email)}
                required 
                placeholder="tu.email@hospital.com" 
                className={MedicalUIService.getFieldStyles(
                  fieldValidations.login_email, 
                  loginErrors.email
                )}
              />
              {fieldValidations.login_email && (
                <p className={MedicalUIService.getValidationMessageStyles(fieldValidations.login_email)}>
                  {fieldValidations.login_email.message}
                </p>
              )}
              {loginErrors.email && (
                <p className="text-red-600 text-sm mt-1 font-medium">{loginErrors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <input 
                id="login-password"
                type="password" 
                name="password" 
                value={loginForm.password} 
                onChange={handleLoginInput}
                onBlur={() => validateField('login', 'password', loginForm.password)}
                required 
                placeholder="Tu contraseña segura" 
                className={MedicalUIService.getFieldStyles(
                  fieldValidations.login_password, 
                  loginErrors.password
                )}
              />
              {fieldValidations.login_password && (
                <p className={MedicalUIService.getValidationMessageStyles(fieldValidations.login_password)}>
                  {fieldValidations.login_password.message}
                </p>
              )}
              {loginErrors.password && (
                <p className="text-red-600 text-sm mt-1 font-medium">{loginErrors.password}</p>
              )}
            </div>
            
            {loginErrors.general && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700 font-medium">{loginErrors.general}</p>
                  </div>
                </div>
              </div>
            )}
            
            {showVerifyPrompt && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-amber-800 font-medium mb-2">
                      Verificación de email requerida para acceso médico
                    </p>
                    <button 
                      type="button" 
                      className="bg-amber-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-amber-600 transition-colors"
                      onClick={handleResendVerification} 
                      disabled={verifyEmailLoading}
                    >
                      {verifyEmailLoading ? 'Enviando...' : 'Reenviar verificación'}
                    </button>
                    {verifyEmailSuccess && (
                      <div className="text-green-700 text-sm mt-2 font-medium">{verifyEmailSuccess}</div>
                    )}
                    {verifyEmailError && (
                      <div className="text-red-600 text-sm mt-2 font-medium">{verifyEmailError}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loginLoading} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loginLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accediendo...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
          
          <div className="mt-6 space-y-3">
            <button 
              type="button" 
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              onClick={() => navigate('/forgot-password')}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <button 
              type="button" 
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              onClick={() => navigate('/mfa-guide')}
            >
              Configurar Autenticación Multifactor
            </button>
          </div>
        </section>
        
        {/* Panel Registro */}
        <section className="flex-1 lg:pl-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Registro Profesional</h2>
            <p className="text-gray-600">Crea tu cuenta médica segura</p>
          </div>
          
          {verificationSent ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-xl">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-green-800 font-semibold mb-2">¡Registro exitoso!</h3>
                  <p className="text-green-700 mb-4">
                    Hemos enviado un correo de verificación a <strong>{regForm.email}</strong>
                  </p>
                  <div className="bg-green-100 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      <strong>Próximos pasos:</strong><br />
                      1. Revisa tu bandeja de entrada y carpeta de spam<br />
                      2. Haz clic en el enlace de verificación<br />
                      3. Regresa aquí para iniciar sesión
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input 
                  id="register-name"
                  type="text" 
                  name="name" 
                  value={regForm.name} 
                  onChange={handleRegInput}
                  onBlur={() => validateField('register', 'name', regForm.name)}
                  required 
                  placeholder="Dr. Juan Pérez o María González" 
                  className={MedicalUIService.getFieldStyles(
                    fieldValidations.register_name, 
                    regErrors.name
                  )}
                />
                {fieldValidations.register_name && (
                  <p className={MedicalUIService.getValidationMessageStyles(fieldValidations.register_name)}>
                    {fieldValidations.register_name.message}
                  </p>
                )}
                {regErrors.name && (
                  <p className="text-red-600 text-sm mt-1 font-medium">{regErrors.name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="register-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Profesional *
                </label>
                <input 
                  id="register-email"
                  type="email" 
                  name="email" 
                  value={regForm.email} 
                  onChange={handleRegInput}
                  onBlur={() => validateField('register', 'email', regForm.email)}
                  required 
                  placeholder="tu.email@hospital.com" 
                  className={MedicalUIService.getFieldStyles(
                    fieldValidations.register_email, 
                    regErrors.email
                  )}
                />
                {fieldValidations.register_email && (
                  <p className={MedicalUIService.getValidationMessageStyles(fieldValidations.register_email)}>
                    {fieldValidations.register_email.message}
                  </p>
                )}
                {regErrors.email && (
                  <p className="text-red-600 text-sm mt-1 font-medium">{regErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña Segura *
                </label>
                <input 
                  id="register-password"
                  type="password" 
                  name="password" 
                  value={regForm.password} 
                  onChange={handleRegInput}
                  onBlur={() => validateField('register', 'password', regForm.password)}
                  required 
                  placeholder="Mínimo 8 caracteres con mayús, minus, números y símbolos" 
                  className={MedicalUIService.getFieldStyles(
                    fieldValidations.register_password, 
                    regErrors.password
                  )}
                />
                {fieldValidations.register_password && (
                  <p className={MedicalUIService.getValidationMessageStyles(fieldValidations.register_password)}>
                    {fieldValidations.register_password.message}
                  </p>
                )}
                {regErrors.password && (
                  <p className="text-red-600 text-sm mt-1 font-medium">{regErrors.password}</p>
                )}
              </div>
              
              {regErrors.general && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-red-700 font-medium">{regErrors.general}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-blue-800 text-sm">
                      <strong>Cuenta médica segura:</strong> Cumplimos con estándares HIPAA/GDPR para proteger información de pacientes.
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={regLoading} 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {regLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </div>
                ) : (
                  'Crear Cuenta Profesional'
                )}
              </button>
            </form>
          )}
        </section>
      </main>
      
      <footer className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          © 2025 AiDuxCare. Plataforma médica certificada HIPAA/GDPR. 
          <br />Software de nivel hospitalario para profesionales de la salud.
        </p>
      </footer>
    </div>
  );
};

export default WelcomePage; 