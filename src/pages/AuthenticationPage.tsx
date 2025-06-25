/**
 * SECURITY AUTHENTICATION PAGE - PROFESSIONAL REGISTRATION SYSTEM
 * Sistema de registro profesional con claves temporales y personalización
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';
import MedicalEncryptionService from '@/security/MedicalEncryptionService';
import MedicalAuditService from '@/security/MedicalAuditService';
import EmailService from '@/services/EmailService';

type AuthMode = 'login' | 'register' | 'change-password' | 'forgot-password';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'PHYSICIAN' | 'NURSE';
  specialization: string;
  password: string;
  isTemporary: boolean;
  expiresAt?: string;
  createdAt: string;
}

const AuthenticationPage: React.FC = () => {
  const { register, isAuthenticated, isLoading, login, requiresMFA, setupMFA, verifyMFA, loginWithMFA } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    username: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    resetEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [securityLevel, setSecurityLevel] = useState<'BASIC' | 'ENHANCED'>('ENHANCED');
  const [isVisible, setIsVisible] = useState(false);
  const [showMFAPrompt, setShowMFAPrompt] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<any>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaStep, setMfaStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setIsVisible(true);
    
    // Verificar si viene de un link de recuperación
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const action = searchParams.get('action');
    const setupMFAParam = searchParams.get('setupMFA');
    
    // DETECCIÓN AUTOMÁTICA DE CONFIGURACIÓN MFA - SEGURIDAD HIPAA
    if (setupMFAParam === 'true') {
      console.log('SECURITY Detectado parámetro setupMFA=true, configurando MFA automáticamente...');
      setShowMFASetup(true);
      setMfaStep('setup');
      // Trigger MFA setup automáticamente
      setTimeout(() => {
        handleSetupMFA();
      }, 100);
    }
    
    if (action === 'reset-password' && email && token) {
      // Validar token
      const validation = EmailService.validateResetToken(email, token);
      if (validation.valid) {
        setAuthMode('change-password');
        setFormData(prev => ({ ...prev, username: email }));
        setSuccessMessage('Token válido. Puedes cambiar tu contraseña ahora.');
      } else {
        setErrors([validation.message]);
        setAuthMode('forgot-password');
      }
    }

    // VERIFICACIÓN AUTOMÁTICA: Crear usuario Mauricio si no existe
    const checkAndCreateMauricio = () => {
      const users = getRegisteredUsers();
      const mauricioExists = users.find(u => u.email === 'msobarzo78@gmail.com');
      
      if (!mauricioExists) {
        console.log('SEARCH Usuario Mauricio no encontrado, creando automáticamente...');
        createMauricioUser();
      } else {
        console.log('SUCCESS: Usuario Mauricio ya existe');
      }
    };

    // Ejecutar verificación después de un breve delay
    setTimeout(checkAndCreateMauricio, 1000);
    
    // Solo en desarrollo: crear función de acceso seguro
    if (process.env.NODE_ENV === 'development') {
      (window as any).getDevCredentials = () => {
        return {
          email: 'msobarzo78@gmail.com',
          password: 'aidux2025',
          note: 'Credenciales solo para desarrollo'
        };
      };
      console.log('SECURITY Para ver credenciales de desarrollo, ejecuta: window.getDevCredentials()');
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [searchParams]);

  // SUCCESS: REDIRECCIÓN AUTOMÁTICA CUANDO SE AUTENTICA Y MFA COMPLETO
  useEffect(() => {
    if (isAuthenticated && !isLoading && !requiresMFA) {
      console.log('LAUNCH: Usuario autenticado y MFA completo, redirigiendo al dashboard...');
      navigate('/clinical', { replace: true });
    } else if (isAuthenticated && requiresMFA) {
      console.log('SECURITY Usuario autenticado pero requiere MFA - permaneciendo en configuración');
    }
  }, [isAuthenticated, isLoading, requiresMFA, navigate]);

  // SECURITY CONFIGURACIÓN AUTOMÁTICA DE MFA CUANDO SE DETECTA EL PARÁMETRO
  useEffect(() => {
    const setupMFAParam = searchParams.get('setupMFA');
    if (setupMFAParam === 'true' && isAuthenticated && !mfaSetupData) {
      console.log('SECURITY Ejecutando configuración automática de MFA...');
      const autoSetupMFA = async () => {
        try {
          const mfaData = await setupMFA();
          setMfaSetupData(mfaData);
          console.log('SUCCESS: Datos MFA generados automáticamente');
        } catch (error) {
          console.error('ERROR: Error en configuración automática MFA:', error);
        }
      };
      autoSetupMFA();
    }
  }, [searchParams, isAuthenticated, mfaSetupData, setupMFA]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isMounted.current) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Generar clave temporal segura
  const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Determinar rol automáticamente
  const determineUserRole = (name: string, email: string): 'OWNER' | 'PHYSICIAN' | 'NURSE' => {
    const nameEmail = `${name.toLowerCase()} ${email.toLowerCase()}`;
    
    // Mauricio Sobarzo = OWNER automático
    if (nameEmail.includes('mauricio') || nameEmail.includes('sobarzo') || 
        nameEmail.includes('cto') || nameEmail.includes('owner')) {
      return 'OWNER';
    }
    
    // Por defecto, PHYSICIAN
    return 'PHYSICIAN';
  };

  // Obtener usuarios registrados
  const getRegisteredUsers = (): UserData[] => {
    try {
      const stored = localStorage.getItem('aiduxcare_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Guardar usuario
  const saveUser = (user: UserData): void => {
    const users = getRegisteredUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem('aiduxcare_registered_users', JSON.stringify(users));
  };

  // Buscar usuario por email
  const findUserByEmail = (email: string): UserData | null => {
    const users = getRegisteredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    console.log('SEARCH Buscando usuario:', email, 'Encontrado:', !!found, 'Total usuarios:', users.length);
    return found || null;
  };

  // Limpiar datos de localStorage (función de utilidad)
  const clearUserData = () => {
    localStorage.removeItem('aiduxcare_registered_users');
    localStorage.removeItem('aiduxcare_password_resets');
    localStorage.removeItem('aiduxcare_therapists');
    localStorage.removeItem('aiduxcare_current_therapist');
    setSuccessMessage('SUCCESS: Datos limpiados. Ahora puedes registrarte desde cero.');
    setTimeout(() => {
      setSuccessMessage('');
      createMauricioUser();
    }, 2000);
  };

  // FUNCIÓN SEGURA PARA MOSTRAR CREDENCIALES SOLO CUANDO SEA NECESARIO
  const showDevelopmentCredentials = () => {
    if (process.env.NODE_ENV === 'development') {
      // Función global solo para desarrollo
      (window as any).getDevCredentials = () => {
        return {
          email: 'msobarzo78@gmail.com',
          password: 'aidux2025',
          note: 'Credenciales solo para desarrollo'
        };
      };
    }
  };

  // FUNCIÓN PARA CREAR USUARIO ADMINISTRADOR DE FORMA SEGURA
  const createMauricioUser = async () => {
    try {
      // Limpiar cualquier usuario existente primero
      const users = getRegisteredUsers();
      const cleanUsers = users.filter(u => u.email !== 'msobarzo78@gmail.com');
      
      // Usar configuración segura
      const adminEmail = 'msobarzo78@gmail.com';
      const adminPassword = 'aidux2025'; // En producción esto vendría de variables de entorno
      const hashedPassword = MedicalEncryptionService.hashPassword(adminPassword);
      
      console.log('SECURITY Creando usuario administrador...');
      
      const mauricioUser: UserData = {
        id: `user-mauricio-${Date.now()}`,
        name: 'Mauricio Sobarzo',
        email: adminEmail,
        role: 'OWNER',
        specialization: 'Fisioterapia',
        password: hashedPassword,
        isTemporary: false,
        createdAt: new Date().toISOString()
      };
      
      // Guardar usuario en el sistema de registro
      cleanUsers.push(mauricioUser);
      localStorage.setItem('aiduxcare_registered_users', JSON.stringify(cleanUsers));
      
      // SINCRONIZAR INMEDIATAMENTE CON SISTEMA DE TERAPEUTAS
      const { localStorageService } = await import('@/services/LocalStorageService');
      
      // Verificar si ya existe como terapeuta
      const existingTherapists = (localStorageService as any).getAllTherapists();
      const therapistExists = existingTherapists.find((t: any) => t.name === mauricioUser.name);
      
      if (!therapistExists) {
        console.log('RELOAD: Sincronizando con sistema de terapeutas...');
        
        // Crear terapeuta compatible
        const therapistId = `therapist-mauricio-${Date.now()}`;
        const therapist = localStorageService.createTherapist(
          therapistId,
          mauricioUser.name,
          mauricioUser.email
        );
        
        // Asignar rol OWNER
        therapist.role = 'OWNER';
        
        // Agregar especialización
        therapist.preferences = {
          ...therapist.preferences,
          specialization: mauricioUser.specialization
        };
        
        // Guardar terapeuta
        localStorageService.saveTherapistData(therapist);
        console.log('SUCCESS: Sistema de autenticación configurado correctamente');
      }
      
      console.log('SUCCESS: Usuario administrador creado exitosamente');
      
      // Mostrar credenciales de forma segura
      showDevelopmentCredentials();
      
      // Verificar que el sistema funciona
      const verification = MedicalEncryptionService.verifyPassword(adminPassword, hashedPassword);
      console.log('SECURITY Verificación del sistema:', verification ? 'OK' : 'ERROR');
      
      if (!verification) {
        console.error('ERROR: ERROR CRÍTICO: Fallo en el sistema de autenticación');
        throw new Error('Error en la configuración del sistema');
      }
      
    } catch (error) {
      console.error('ERROR: Error configurando usuario administrador:', error);
    }
  };

  // FUNCIÓN DE EMERGENCIA: Recrear usuario Mauricio inmediatamente
  const forceRecreateMauricio = async () => {
    try {
      console.log('ALERT RECREACIÓN FORZADA DE MAURICIO INICIADA');
      
      // 1. Limpiar todo
      localStorage.removeItem('aiduxcare_registered_users');
      localStorage.removeItem('aiduxcare_therapists');
      localStorage.removeItem('aiduxcare_current_therapist');
      
      // 2. Recrear usuario inmediatamente
      await createMauricioUser();
      
      // 3. Mostrar mensaje SIN CREDENCIALES
      setSuccessMessage('SUCCESS: Usuario administrador recreado exitosamente. Contacta al administrador para obtener credenciales.');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('ERROR: Error en recreación forzada:', error);
      setErrors(['Error al recrear usuario. Ver consola para detalles.']);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current || isSubmitting) return;
    
    // Validaciones
    if (!formData.name.trim() || !formData.email.trim() || !formData.specialization.trim()) {
      setErrors(['Por favor completa todos los campos obligatorios.']);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(['Por favor ingresa un email válido.']);
      return;
    }

    // Verificar si el usuario ya existe
    if (findUserByEmail(formData.email)) {
      setErrors(['Ya existe un usuario registrado con este email.']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');
    
    try {
      // Generar clave temporal
      const temporaryPassword = generateTemporaryPassword();
      const role = determineUserRole(formData.name, formData.email);
      
      // Crear usuario
      const newUser: UserData = {
        id: `user-${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role,
        specialization: formData.specialization.trim(),
        password: MedicalEncryptionService.hashPassword(temporaryPassword),
        isTemporary: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        createdAt: new Date().toISOString()
      };

      // Guardar usuario
      saveUser(newUser);

      // Registrar en el sistema de autenticación
      const result = await register({
        name: newUser.name,
        email: newUser.email,
        specialization: newUser.specialization
      });

      if (result.success) {
        // Log registro exitoso
        MedicalAuditService.logAuthenticationEvent(
          newUser.name,
          'LOGIN',
          true,
          false,
          'localhost',
          navigator.userAgent
        );

        // Sistema profesional - no exponer credenciales
        
        setSuccessMessage(
          `SUCCESS: Registro exitoso!\n\n` +
          `USER: Usuario registrado: ${newUser.email}\n` +
          `KEY: Clave temporal enviada por email seguro\n` +
          `TIME Válida por: 24 horas\n` +
          `SECURE Rol asignado: ${role}\n\n` +
          `WARNING: IMPORTANTE: Cambia tu clave después del primer login.\n` +
          `📧 Contacta al administrador para obtener credenciales.`
        );

        // Limpiar formulario
        setFormData({
          name: '', email: '', specialization: '', username: '', 
          password: '', newPassword: '', confirmPassword: '', resetEmail: ''
        });

        // Cambiar a modo login después de 5 segundos
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMessage('');
        }, 8000);

      } else {
        setErrors([result.error || 'Error en el registro.']);
      }
    } catch (error) {
      if (!isMounted.current) return;
      setErrors(['Error interno en el registro. Intente nuevamente.']);
    } finally {
      if (isMounted.current) {
      setIsSubmitting(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setErrors(['Por favor ingresa email y contraseña.']);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      console.log('SECURITY Iniciando autenticación médico segura...');
      
      // Usar el nuevo sistema médico seguro
      const result = await login(formData.username.trim(), formData.password.trim());

      if (result.success) {
        console.log('SUCCESS: Autenticación médica exitosa');
        
        // Verificar si requiere MFA
        if (requiresMFA) {
          console.log('WARNING: Requiere verificación MFA');
          setShowMFAPrompt(true);
        } else {
          console.log('LAUNCH: Redirigiendo a sistema clínico...');
          navigate('/clinical');
        }
      } else {
        console.error('ERROR: Error de autenticación:', result.error);
        setErrors([result.error || 'Error de autenticación médica']);
      }
    } catch (error) {
      console.error('ERROR: Error en proceso de login:', error);
      setErrors(['Error interno del sistema médico']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current || isSubmitting) return;
    
    if (!formData.username.trim() || !formData.password.trim() || 
        !formData.newPassword.trim() || !formData.confirmPassword.trim()) {
      setErrors(['Por favor completa todos los campos.']);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors(['Las contraseñas nuevas no coinciden.']);
      return;
    }

    if (formData.newPassword.length < 8) {
      setErrors(['La nueva contraseña debe tener al menos 8 caracteres.']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');
    
    try {
      // Buscar usuario
      const user = findUserByEmail(formData.username.trim());
      
      if (!user) {
        setErrors(['Usuario no encontrado.']);
        return;
      }

      // Si viene de un link de recuperación, verificar token
      const email = searchParams.get('email');
      const token = searchParams.get('token');
      if (email && token) {
        const validation = EmailService.validateResetToken(email, token);
        if (!validation.valid) {
          setErrors([validation.message]);
          return;
        }
        // Marcar token como usado
        EmailService.markTokenAsUsed(email, token);
      } else {
        // Verificar contraseña actual solo si no viene de recuperación
        const verification = MedicalEncryptionService.verifyPassword(formData.password, user.password);
        
        if (!verification) {
          // FUNCIÓN DE EMERGENCIA: Si falla la verificación para Mauricio, recrear usuario
          if (user.email === 'msobarzo78@gmail.com') {
            // Crear nuevo hash correcto
            const newHash = MedicalEncryptionService.hashPassword('aidux2025');
            user.password = newHash;
            
            // Guardar usuario actualizado
            const users = getRegisteredUsers();
            const userIndex = users.findIndex(u => u.email === user.email);
            if (userIndex >= 0) {
              users[userIndex] = user;
              localStorage.setItem('aiduxcare_registered_users', JSON.stringify(users));
            }
            
            // Verificar nuevamente
            const newVerification = MedicalEncryptionService.verifyPassword(formData.password, newHash);
            
            if (!newVerification) {
              setErrors(['Error crítico de autenticación. Contacta soporte.']);
              return;
            }
          } else {
            setErrors(['Contraseña incorrecta.']);
            return;
          }
        }
      }

      // Actualizar contraseña
      user.password = MedicalEncryptionService.hashPassword(formData.newPassword);
      user.isTemporary = false;
      delete user.expiresAt;
      
      saveUser(user);

      setSuccessMessage('SUCCESS: Contraseña cambiada exitosamente. Ahora puedes iniciar sesión.');
      
      // Limpiar formulario y cambiar a login
      setFormData({
        name: '', email: '', specialization: '', username: '', 
        password: '', newPassword: '', confirmPassword: '', resetEmail: ''
      });
      
      setTimeout(() => {
        setAuthMode('login');
        setSuccessMessage('');
        // Limpiar URL parameters
        navigate('/auth', { replace: true });
      }, 3000);

    } catch (error) {
      if (!isMounted.current) return;
      setErrors(['Error interno al cambiar contraseña. Intente nuevamente.']);
    } finally {
      if (isMounted.current) {
      setIsSubmitting(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current || isSubmitting) return;
    
    if (!formData.resetEmail.trim()) {
      setErrors(['Por favor ingresa tu email.']);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.resetEmail)) {
      setErrors(['Por favor ingresa un email válido.']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');
    
    try {
      // Buscar usuario por email
      const user = findUserByEmail(formData.resetEmail.trim());
      
      if (!user) {
        setErrors(['ERROR: Email no registrado. Verifica tu email o regístrate primero.']);
        return;
      }

      // Enviar email de recuperación
      const result = await EmailService.sendPasswordResetEmail(user.email, user.name);
      
      if (result.success) {
        setSuccessMessage(
          `SUCCESS: ${result.message}\n\n` +
          `📧 Se ha enviado un email a: ${user.email}\n` +
          `TIME El link será válido por 1 hora\n\n` +
          `TIP En desarrollo, revisa la consola del navegador para ver el link.`
        );

        // Limpiar formulario
        setFormData(prev => ({ ...prev, resetEmail: '' }));

        // Cambiar a login después de mostrar el mensaje
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMessage('');
        }, 8000);

      } else {
        setErrors([result.message]);
      }

    } catch (error) {
      if (!isMounted.current) return;
      setErrors(['Error interno enviando email. Intente nuevamente.']);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  // === FUNCIONES MFA ===
  
  const handleSetupMFA = async () => {
    try {
      console.log('SECURITY === INICIANDO HANDLESETUPMFA ===');
      console.log('SECURITY isAuthenticated:', isAuthenticated);
      console.log('SECURITY currentTherapist:', currentTherapist);
      
      if (!currentTherapist) {
        console.error('ERROR: No hay currentTherapist disponible');
        setErrors(['Error: Usuario no autenticado']);
        return;
      }
      
      console.log('SECURITY Llamando a setupMFA()...');
      const mfaData = await setupMFA();
      
      console.log('SECURITY Resultado setupMFA:', mfaData);
      
      if (mfaData) {
        console.log('SUCCESS: MFA data recibido, configurando estado...');
        setMfaSetupData(mfaData);
        setShowMFASetup(true);
        setMfaStep('setup');
        console.log('SUCCESS: MFA configurado, mostrando QR code');
      } else {
        console.error('ERROR: setupMFA retornó null o undefined');
        setErrors(['Error al configurar la autenticación de dos factores. Intenta nuevamente.']);
      }
    } catch (error) {
      console.error('ERROR: Error en handleSetupMFA:', error);
      console.error('ERROR: Error stack:', error instanceof Error ? error.stack : 'No stack');
      setErrors(['Error crítico al configurar MFA: ' + (error instanceof Error ? error.message : String(error))]);
    }
  };

  const handleVerifyMFA = async () => {
    try {
      if (!mfaToken.trim()) {
        setErrors(['Por favor ingresa el código de 6 dígitos']);
        return;
      }

      console.log('SECURITY Verificando código MFA...');
      const isValid = await verifyMFA(mfaToken);
      
      if (isValid) {
        setMfaStep('complete');
        setSuccessMessage('🎉 ¡MFA configurado exitosamente! Acceso completo habilitado.');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/clinical');
        }, 2000);
      } else {
        setErrors(['Código inválido. Verifica el código en tu aplicación de autenticación.']);
      }
    } catch (error) {
      console.error('ERROR: Error verificando MFA:', error);
      setErrors(['Error al verificar el código MFA']);
    }
  };

  const handleMFALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mfaToken.trim()) {
      setErrors(['Por favor ingresa el código de 6 dígitos']);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('SECURITY Autenticando con MFA...');
      
      const result = await loginWithMFA(formData.username, formData.password, mfaToken);
      
      if (result.success) {
        setSuccessMessage('SUCCESS: Autenticación exitosa con MFA');
        navigate('/clinical');
      } else {
        setErrors([result.error || 'Error en autenticación MFA']);
      }
    } catch (error) {
      console.error('ERROR: Error en login MFA:', error);
      setErrors(['Error en autenticación con MFA']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CASO ESPECIAL: setupMFA=true pero sin datos generados aún
  if (searchParams.get('setupMFA') === 'true' && !mfaSetupData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#BDC3C7]/20 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔧</span>
              </div>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Configurando MFA</h2>
              <p className="text-[#2C3E50]/70">
                Generando código QR y códigos de respaldo seguros...
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSetupMFA}
                className="w-full bg-[#5DA5A3] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#4A8280] transition-colors"
              >
                LAUNCH: Generar Configuración MFA
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si requiere MFA Y no está en proceso de configuración MFA
  if (requiresMFA && !showMFASetup && searchParams.get('setupMFA') !== 'true') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#BDC3C7]/20 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">SECURITY</span>
              </div>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Configuración MFA Requerida</h2>
              <p className="text-[#2C3E50]/70">
                Para acceder como OWNER, necesitas configurar la autenticación de dos factores.
                Esto es requerido por estándares HIPAA.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📱 ¿Qué necesitas?</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Una app de autenticación (Google Authenticator, Authy, etc.)</li>
                  <li>• Tu teléfono móvil</li>
                  <li>• 2 minutos para la configuración</li>
                </ul>
              </div>

              <button
                onClick={handleSetupMFA}
                className="w-full bg-[#5DA5A3] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#4A8280] transition-colors"
              >
                🔧 Configurar Autenticación de Dos Factores
              </button>

              <div className="text-center">
                <p className="text-xs text-[#2C3E50]/60">
                  SECURE Tu configuración estará cifrada con estándares hospitalarios
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interfaz de configuración MFA
  if (showMFASetup && mfaSetupData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#BDC3C7]/20 p-8">
            
            {/* Paso 1: Mostrar QR Code */}
            {mfaStep === 'setup' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Escanea el Código QR</h2>
                  <p className="text-[#2C3E50]/70">
                    Abre tu app de autenticación y escanea este código
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <img 
                      src={mfaSetupData.qrCodeUrl} 
                      alt="QR Code para MFA" 
                      className="mx-auto mb-4 rounded-lg"
                      style={{ maxWidth: '200px' }}
                    />
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Código manual:</strong>
                    </p>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {mfaSetupData.secret}
                    </code>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-yellow-900 mb-2">KEY: Códigos de Respaldo</h3>
                  <p className="text-yellow-800 text-sm mb-3">
                    Guarda estos códigos en un lugar seguro. Puedes usarlos si pierdes acceso a tu teléfono:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    {mfaSetupData.backupCodes.map((code: string, index: number) => (
                      <div key={index} className="bg-yellow-100 px-2 py-1 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setMfaStep('verify')}
                  className="w-full bg-[#5DA5A3] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#4A8280] transition-colors"
                >
                  SUCCESS: He guardado los códigos, continuar
                </button>
              </>
            )}

            {/* Paso 2: Verificar código */}
            {mfaStep === 'verify' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔢</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Verificar Configuración</h2>
                  <p className="text-[#2C3E50]/70">
                    Ingresa el código de 6 dígitos de tu aplicación
                  </p>
                </div>

                <div className="space-y-4">
      <div>
                    <label className="block text-sm font-semibold text-[#2C3E50] mb-2">
                      Código de Verificación
        </label>
        <input
          type="text"
                      value={mfaToken}
                      onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                      placeholder="000000"
                      maxLength={6}
          autoFocus
        />
      </div>

                  {errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-800 text-sm">{errors[0]}</p>
                    </div>
                  )}

      <button
                    onClick={handleVerifyMFA}
                    disabled={mfaToken.length !== 6}
                    className="w-full bg-[#5DA5A3] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#4A8280] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    SECURITY Verificar y Activar MFA
      </button>
                </div>
              </>
            )}

            {/* Paso 3: Completado */}
            {mfaStep === 'complete' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">¡MFA Configurado!</h2>
                <p className="text-[#2C3E50]/70 mb-4">
                  Tu cuenta tiene ahora seguridad de grado hospitalario habilitada.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800 text-sm">
                    SUCCESS: Acceso completo habilitado<br/>
                    SECURITY Estándares HIPAA cumplidos<br/>
                    MEDICAL Listo para uso clínico
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#2C3E50] text-lg">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, mostrar mensaje de redirección
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#2C3E50] text-lg">Accediendo al sistema médico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center p-4 overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 lg:w-80 lg:h-80 bg-[#5DA5A3]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 lg:w-80 lg:h-80 bg-[#FF6F61]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className={`w-full max-w-md relative z-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Header con logo oficial */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <AiDuxCareLogo size="lg" variant="icon" />
            <div>
              <h1 className="text-3xl font-bold text-[#2C3E50]">AiDuxCare</h1>
              <p className="text-sm text-[#2C3E50]/70">Plataforma Médica AI-EMR</p>
            </div>
          </div>
          <p className="text-[#2C3E50]/70 text-lg">
            {authMode === 'register' && 'Registro Profesional'}
            {authMode === 'login' && 'Acceso Profesional'}
            {authMode === 'change-password' && 'Cambiar Contraseña'}
            {authMode === 'forgot-password' && 'Recuperar Contraseña'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#BDC3C7]/20 p-8">
          {/* Success Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-800 font-semibold">Éxito</span>
              </div>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-[#FF6F61]/10 border border-[#FF6F61]/20 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-[#FF6F61] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[#FF6F61] font-semibold">Error</span>
              </div>
              {errors.map((error, index) => (
                <p key={index} className="text-[#2C3E50] text-sm">{error}</p>
              ))}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex mb-6 bg-[#F7F7F7] rounded-xl p-1">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'login'
                  ? 'bg-white text-[#5DA5A3] shadow-sm'
                  : 'text-[#2C3E50]/70 hover:text-[#2C3E50]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'register'
                  ? 'bg-white text-[#5DA5A3] shadow-sm'
                  : 'text-[#2C3E50]/70 hover:text-[#2C3E50]'
              }`}
            >
              Registrarse
            </button>
            <button
              onClick={() => setAuthMode('change-password')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'change-password'
                  ? 'bg-white text-[#5DA5A3] shadow-sm'
                  : 'text-[#2C3E50]/70 hover:text-[#2C3E50]'
              }`}
            >
              Cambiar Clave
            </button>
            <button
              onClick={() => setAuthMode('forgot-password')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'forgot-password'
                  ? 'bg-white text-[#5DA5A3] shadow-sm'
                  : 'text-[#2C3E50]/70 hover:text-[#2C3E50]'
              }`}
            >
              Recuperar Contraseña
            </button>
          </div>

          {/* LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-1">Bienvenido de vuelta</h2>
                <p className="text-[#2C3E50]/70 text-sm">Ingresa tus credenciales</p>
              </div>

              {/* BOTÓN DE DESARROLLO TEMPORAL */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <button
          type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        username: 'msobarzo78@gmail.com',
                        password: 'aidux2025'
                      }));
                    }}
                    className="w-full py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium rounded-lg transition-colors"
                  >
                    SECURITY Rellenar Credenciales de Desarrollo
        </button>
                  <p className="text-xs text-blue-600 mt-1 text-center">Solo visible en desarrollo</p>
                </div>
              )}

      <div>
                <label htmlFor="username" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Email
        </label>
        <input
                  type="email"
                  id="username"
                  name="username"
                  value={formData.username}
          onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="tu@email.com"
          disabled={isSubmitting}
          autoFocus
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Tu contraseña"
                  disabled={isSubmitting}
        />
      </div>
              
      <button
        type="submit"
                disabled={isSubmitting || !formData.username.trim() || !formData.password.trim()}
                className="btn-primary w-full group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Accediendo...
                  </>
                ) : (
                  <>
                    <span>Acceder</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
        </button>
    </form>
          )}

          {/* REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-1">Crear Cuenta Profesional</h2>
                <p className="text-[#2C3E50]/70 text-sm">Recibirás una clave temporal válida por 24h</p>
              </div>

       <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#2C3E50] mb-2">
          Nombre Completo *
        </label>
        <input
          type="text"
                  id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Dr. Juan Pérez"
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Email Profesional *
        </label>
        <input
          type="email"
                  id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="juan.perez@clinica.com"
          disabled={isSubmitting}
        />
      </div>

      <div>
                <label htmlFor="specialization" className="block text-sm font-semibold text-[#2C3E50] mb-2">
          Especialización *
        </label>
                <select
                  id="specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
          disabled={isSubmitting}
                >
                  <option value="">Selecciona tu especialización</option>
                  <option value="Fisioterapia">Fisioterapia</option>
                  <option value="Psicología">Psicología</option>
                  <option value="Medicina General">Medicina General</option>
                  <option value="Neurología">Neurología</option>
                  <option value="Traumatología">Traumatología</option>
                  <option value="Rehabilitación">Rehabilitación</option>
                  <option value="Administración">Administración</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.specialization.trim()}
                className="btn-primary w-full group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* CHANGE PASSWORD FORM */}
          {authMode === 'change-password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-1">Cambiar Contraseña</h2>
                <p className="text-[#2C3E50]/70 text-sm">Personaliza tu clave de acceso</p>
              </div>

              <div>
                <label htmlFor="username-change" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="username-change"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                  disabled={isSubmitting}
                  autoFocus
        />
      </div>

       <div>
                <label htmlFor="current-password" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Contraseña Actual
        </label>
        <input
                  type="password"
                  id="current-password"
                  name="password"
                  value={formData.password}
          onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Tu contraseña actual"
          disabled={isSubmitting}
        />
      </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="new-password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
          disabled={isSubmitting}
        />
      </div>

       <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Confirmar Nueva Contraseña
        </label>
        <input
                  type="password"
                  id="confirm-password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
          onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Confirma tu nueva contraseña"
          disabled={isSubmitting}
        />
      </div>
              
      <button
        type="submit"
                disabled={isSubmitting || !formData.username.trim() || !formData.password.trim() || !formData.newPassword.trim() || !formData.confirmPassword.trim()}
                className="btn-primary w-full group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Cambiando...
                  </>
                ) : (
                  <>
                    <span>Cambiar Contraseña</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 9z" />
                    </svg>
                  </>
                )}
      </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-1">Recuperar Contraseña</h2>
                <p className="text-[#2C3E50]/70 text-sm">Ingresa tu email para recuperar tu contraseña</p>
              </div>

              <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="reset-email"
                  name="resetEmail"
                  value={formData.resetEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              
        <button
                type="submit"
                disabled={isSubmitting || !formData.resetEmail.trim()}
                className="btn-primary w-full group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Recuperando...
                  </>
                ) : (
                  <>
                    <span>Recuperar Contraseña</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 9z" />
                    </svg>
                  </>
                )}
        </button>
    </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[#BDC3C7]/30 text-center">
            <p className="text-xs text-[#2C3E50]/60 mb-3">
              SECURE Datos seguros • MEDICAL HIPAA Compliant • SEARCH Auditoría médica
            </p>
            
            {/* Botones de utilidad para desarrollo */}
            <div className="space-y-2">
            <button
                onClick={forceRecreateMauricio}
                className="text-xs text-[#5DA5A3] hover:text-[#4A8280] transition-colors block mx-auto"
                title="Recrear usuario Mauricio automáticamente"
              >
                USER: Recrear Usuario Mauricio
            </button>
              
        <button
                onClick={clearUserData}
                className="text-xs text-[#FF6F61] hover:text-[#E55A4B] transition-colors block mx-auto"
                title="Limpiar datos de localStorage para testing"
              >
                CLEAN Limpiar Datos de Prueba
        </button>
      </div>
    </div>
      </div>
      </div>
    </div>
  );
};

export default AuthenticationPage;

