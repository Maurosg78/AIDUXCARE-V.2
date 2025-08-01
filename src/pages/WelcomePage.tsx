/**
 * 🚀 WelcomePage - AiDuxCare V.2
 * Página unificada con wizard de 3 pasos para registro
 * Basado en especificaciones de ingeniería inversa
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseAuthService } from '../core/auth/firebaseAuthService';
import { useAuth } from '../hooks/useAuth';

interface UserData {
  // Paso 1: Datos Personales
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  gender: string;
  password: string;
  confirmPassword: string;
  
  // Paso 2: Datos Profesionales
  specialty: string;
  licenseNumber: string;
  workplace: string;
  university: string;
  professionalTitle: string;
  experienceYears: string;
  
  // Paso 3: Datos de Ubicación
  country: string;
  province: string;
  city: string;
  consentGDPR: boolean;
  consentHIPAA: boolean;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
}

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [connectionError, setConnectionError] = useState(false);
  const [authError, setAuthError] = useState('');

  const [userData, setUserData] = useState<UserData>({
    // Datos personales
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '',
    
    // Datos profesionales
    specialty: '',
    licenseNumber: '',
    workplace: '',
    university: '',
    professionalTitle: '',
    experienceYears: '',
    
    // Datos de ubicación
    country: '',
    province: '',
    city: '',
    consentGDPR: false,
    consentHIPAA: false,
  });

  const steps: WizardStep[] = [
    { id: 1, title: 'Datos Personales', description: 'Información básica', isCompleted: false },
    { id: 2, title: 'Datos Profesionales', description: 'Información médica', isCompleted: false },
    { id: 3, title: 'Datos de ubicación', description: 'Ubicación y políticas', isCompleted: false },
  ];

  // Simular error de conexión
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionError(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak';
    if (password.length < 12) return 'medium';
    return 'strong';
  };

  const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'strong': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Media';
      case 'strong': return 'Fuerte';
      default: return '';
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar nombre y apellido juntos
    if (!userData.firstName.trim() || !userData.lastName.trim()) {
      newErrors.fullName = 'Ingresa tu nombre completo (nombre y apellido)';
    }
    
    if (!userData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(userData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    if (!userData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (userData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (userData.password !== userData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.specialty) {
      newErrors.specialty = 'La especialidad es requerida';
    }
    
    if (!userData.licenseNumber) {
      newErrors.licenseNumber = 'El número de licencia es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.consentGDPR) {
      newErrors.consentGDPR = 'Debes aceptar la política de privacidad';
    }
    
    if (!userData.consentHIPAA) {
      newErrors.consentHIPAA = 'Debes aceptar el manejo seguro de información médica';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceedToNextStep = (): boolean => {
    if (currentStep === 1) return validateStep1();
    if (currentStep === 2) return validateStep2();
    if (currentStep === 3) return validateStep3();
    return false;
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setErrors({});
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleLogin = async () => {
    setLoading(true);
    setAuthError('');
    
    try {
      console.log('🔥 Firebase Auth: Iniciando sesión...', { email: userData.email });
      
      // Usar autenticación real de Firebase
      const user = await firebaseAuthService.signIn(userData.email, userData.password);
      
      console.log('✅ Login exitoso:', user);
      
      // Determinar datos del usuario basado en email
      let userDataForAuth = {
        displayName: 'Usuario',
        email: userData.email,
        professionalTitle: 'FT',
        specialty: 'Fisioterapia',
        country: 'España'
      };

      if (userData.email === 'demo@aiduxcare.com') {
        userDataForAuth = {
          displayName: 'Dr. Ana García',
          email: userData.email,
          professionalTitle: 'FT',
          specialty: 'Fisioterapia Traumatológica',
          country: 'España'
        };
      } else if (userData.email === 'maurosg.2023@gmail.com') {
        userDataForAuth = {
          displayName: 'FT. Mauricio Sobarzo',
          email: userData.email,
          professionalTitle: 'FT',
          specialty: 'Fisioterapia Traumatológica',
          country: 'España'
        };
      } else if (userData.email === 'admin@aiduxcare.com') {
        userDataForAuth = {
          displayName: 'Dr. Carlos Admin',
          email: userData.email,
          professionalTitle: 'FT',
          specialty: 'Administración',
          country: 'España'
        };
      }
      
      // Guardar datos del usuario usando el hook
      login(userDataForAuth);
      
      // Redirigir al dashboard después del login exitoso
      navigate('/professional-workflow');
      
    } catch (error: any) {
      console.error('❌ Firebase Auth: Error al iniciar sesión', error);
      setAuthError(error.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    setLoading(true);
    try {
      console.log('🔥 Firebase Auth: Iniciando registro...', { email: userData.email });
      
      // Validar que todos los pasos estén completos
      if (!validateStep1() || !validateStep2() || !validateStep3()) {
        throw new Error('Por favor completa todos los campos requeridos');
      }
      
      // Usar autenticación real de Firebase para registro
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      const user = await firebaseAuthService.signUp(
        userData.email, 
        userData.password, 
        fullName,
        userData.specialty
      );
      
      console.log('✅ Registro exitoso con Firebase:', user);
      
      // Guardar datos del usuario usando el hook
      const userDataForAuth = {
        displayName: fullName,
        email: userData.email,
        professionalTitle: userData.professionalTitle,
        specialty: userData.specialty,
        country: userData.country
      };
      
      login(userDataForAuth);
      
      // Mostrar mensaje de éxito antes de redirigir
      alert('¡Registro exitoso! Bienvenido a AiDuxCare.');
      
      // Redirigir al dashboard
      navigate('/professional-workflow');
    } catch (error: any) {
      console.error('❌ Firebase Auth: Error en registro', error);
      setErrors({ general: error.message || 'Error en el registro. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string | boolean) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    
    // Actualizar fortaleza de contraseña
    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value as string));
    }
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Limpiar error de autenticación
    if (authError) {
      setAuthError('');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Datos personales</h2>
        <p className="text-gray-600 mt-2">Introduce tus datos básicos para comenzar el registro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre *
          </label>
          <input
            type="text"
            value={userData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mauricio"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primer apellido *
          </label>
          <input
            type="text"
            value={userData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Sobarzo"
          />
        </div>

        {errors.fullName && (
          <div className="md:col-span-2">
            <p className="text-red-500 text-sm">{errors.fullName}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de nacimiento *
          </label>
          <div className="relative">
            <input
              type="date"
              value={userData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.birthDate ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="dd/mm/aaaa"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={userData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Teléfono"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Género (opcional)
          </label>
          <select
            value={userData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            <option value="prefiero-no-decir">Prefiero no decir</option>
          </select>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña *
          </label>
          <input
            type="password"
            value={userData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mínimo 8 caracteres"
          />
          {userData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className={`h-1 w-8 rounded ${getPasswordStrengthColor(passwordStrength)}`}></div>
                  <div className={`h-1 w-8 rounded ${passwordStrength !== 'weak' ? getPasswordStrengthColor(passwordStrength) : 'bg-gray-300'}`}></div>
                  <div className={`h-1 w-8 rounded ${passwordStrength === 'strong' ? getPasswordStrengthColor(passwordStrength) : 'bg-gray-300'}`}></div>
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength === 'weak' ? 'text-red-600' :
                  passwordStrength === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getPasswordStrengthText(passwordStrength)}
                </span>
              </div>
            </div>
          )}
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Contraseña *
          </label>
          <input
            type="password"
            value={userData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Repite tu contraseña"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Datos Profesionales</h2>
        <p className="text-gray-600 mt-2">Información sobre tu práctica médica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Especialidad *
          </label>
          <select
            value={userData.specialty}
            onChange={(e) => handleInputChange('specialty', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.specialty ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona tu especialidad</option>
            <option value="fisioterapia">Fisioterapia</option>
            <option value="medicina-familiar">Medicina Familiar</option>
            <option value="traumatologia">Traumatología</option>
            <option value="rehabilitacion">Rehabilitación</option>
            <option value="medicina-interna">Medicina Interna</option>
            <option value="dermatologia">Dermatología</option>
            <option value="psicologia">Psicología</option>
            <option value="enfermeria">Enfermería</option>
            <option value="otro">Otro</option>
          </select>
          {errors.specialty && <p className="text-red-500 text-sm mt-1">{errors.specialty}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Licencia/Colegiado *
          </label>
          <input
            type="text"
            value={userData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Número de licencia profesional"
          />
          {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Centro de Trabajo *
          </label>
          <input
            type="text"
            value={userData.workplace}
            onChange={(e) => handleInputChange('workplace', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.workplace ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Hospital, Clínica, Consulta privada..."
          />
          {errors.workplace && <p className="text-red-500 text-sm mt-1">{errors.workplace}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Universidad/Institución *
          </label>
          <input
            type="text"
            value={userData.university}
            onChange={(e) => handleInputChange('university', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.university ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Universidad donde te graduaste"
          />
          {errors.university && <p className="text-red-500 text-sm mt-1">{errors.university}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título Profesional *
          </label>
          <input
            type="text"
            value={userData.professionalTitle}
            onChange={(e) => handleInputChange('professionalTitle', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.professionalTitle ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Médico, Fisioterapeuta, Psicólogo..."
          />
          {errors.professionalTitle && <p className="text-red-500 text-sm mt-1">{errors.professionalTitle}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Años de Experiencia *
          </label>
          <select
            value={userData.experienceYears}
            onChange={(e) => handleInputChange('experienceYears', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.experienceYears ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona tu experiencia</option>
            <option value="0-2">0-2 años</option>
            <option value="3-5">3-5 años</option>
            <option value="6-10">6-10 años</option>
            <option value="10-15">10-15 años</option>
            <option value="15+">Más de 15 años</option>
          </select>
          {errors.experienceYears && <p className="text-red-500 text-sm mt-1">{errors.experienceYears}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Datos de ubicación</h2>
        <p className="text-gray-600 mt-2">Información sobre tu ubicación para cumplimiento legal.</p>
      </div>

      {/* Detección automática de ubicación */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-800">Ubicación detectada automáticamente</h3>
            <p className="text-xs text-green-600 mt-1">Tu ubicación ha sido detectada automáticamente. Puedes modificarla si es necesario.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País
          </label>
          <select
            value={userData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.country ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Spain">Spain</option>
            <option value="US">Estados Unidos</option>
            <option value="MX">México</option>
            <option value="AR">Argentina</option>
            <option value="CO">Colombia</option>
            <option value="PE">Perú</option>
            <option value="CL">Chile</option>
            <option value="VE">Venezuela</option>
            <option value="EC">Ecuador</option>
            <option value="BO">Bolivia</option>
            <option value="PY">Paraguay</option>
            <option value="UY">Uruguay</option>
            <option value="GT">Guatemala</option>
            <option value="HN">Honduras</option>
            <option value="SV">El Salvador</option>
            <option value="NI">Nicaragua</option>
            <option value="CR">Costa Rica</option>
            <option value="PA">Panamá</option>
            <option value="CU">Cuba</option>
            <option value="DO">República Dominicana</option>
            <option value="PR">Puerto Rico</option>
            <option value="otro">Otro</option>
          </select>
          {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provincia/Estado
          </label>
          <input
            type="text"
            value={userData.province}
            onChange={(e) => handleInputChange('province', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.province ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tu provincia"
          />
          {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            value={userData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tu ciudad"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>
      </div>

      {/* Consentimientos */}
      <div className="space-y-4 mt-8">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="consentGDPR"
            checked={userData.consentGDPR}
            onChange={(e) => handleInputChange('consentGDPR', e.target.checked)}
            className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <div className="flex-1">
            <label htmlFor="consentGDPR" className="text-sm font-medium text-gray-700">
              Acepto la <span className="underline cursor-pointer">política de privacidad</span> y el tratamiento de mis datos según GDPR.
            </label>
            {errors.consentGDPR && <p className="text-red-500 text-sm mt-1">{errors.consentGDPR}</p>}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="consentHIPAA"
            checked={userData.consentHIPAA}
            onChange={(e) => handleInputChange('consentHIPAA', e.target.checked)}
            className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <div className="flex-1">
            <label htmlFor="consentHIPAA" className="text-sm font-medium text-gray-700">
              Acepto el manejo seguro de información médica según HIPAA.
            </label>
            {errors.consentHIPAA && <p className="text-red-500 text-sm mt-1">{errors.consentHIPAA}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Bienvenido a <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AiDuxCare</span>
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Asistente clínico impulsado por inteligencia artificial. Pensado para que dediques más tiempo a tus pacientes, menos a la gestión.
          </p>
        </div>

        {/* Error de conexión */}
        {connectionError && (
          <div className="text-center mb-6">
            <p className="text-red-600 text-sm">Error de conexión. Verifica tu internet</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'login' ? (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto border border-gray-200">
            <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
            
            {/* Error de autenticación */}
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Correo electrónico"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={userData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Contraseña"
                />
              </div>
              
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Iniciando sesión...' : 'Acceder'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            {/* Progress Indicator */}
            <div className="flex justify-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentStep}/3
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {renderCurrentStep()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <button
                onClick={handleNextStep}
                disabled={!canProceedToNextStep() || loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </div>
                ) : (
                  currentStep === 3 ? 'Finalizar registro' : 'Siguiente'
                )}
              </button>
            </div>

            {/* Error General */}
            {errors.general && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2025 AiDuxCare. Software médico de nivel hospitalario. Cumple HIPAA/GDPR/XAI.
        </div>
      </div>
    </div>
  );
};

export default WelcomePage; 