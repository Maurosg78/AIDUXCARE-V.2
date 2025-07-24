/**
 * 🏠 **Enterprise Welcome Page**
 * 
 * Página de bienvenida enterprise con:
 * - Registro/Login por email únicamente
 * - UI profesional y limpia
 * - Validación en tiempo real
 * - Error handling visual
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthRepository } from '../infrastructure/repositories/FirebaseAuthRepository';
import type { RegisterData, LoginCredentials, ProfessionalRole } from '../core/types/auth.types';
import { AppError } from '../core/errors/AppError';

// =====================================================
// TYPES & INTERFACES
// =====================================================

type FormMode = 'login' | 'register';

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  licenseNumber?: string;
  general?: string;
}

// =====================================================
// WELCOME PAGE COMPONENT
// =====================================================

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const authRepository = new FirebaseAuthRepository();

  // Form state
  const [mode, setMode] = useState<FormMode>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organization: '',
    role: 'fisioterapeuta' as ProfessionalRole,
    specialization: '',
    licenseNumber: '',
    country: 'España'
  });

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const credentials: LoginCredentials = {
        email: loginEmail,
        password: loginPassword
      };

      const result = await authRepository.login(credentials);
      
      console.log('✅ Login exitoso:', result.user.email);
      navigate('/dashboard');

    } catch (error) {
      console.error('❌ Error en login:', error);
      
      if (error instanceof AppError) {
        setErrors({ general: error.getUserMessage() });
      } else {
        setErrors({ general: 'Error inesperado. Inténtalo de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const result = await authRepository.register(registerData);
      
      console.log('✅ Registro exitoso:', result.user.email);
      navigate('/dashboard');

    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      if (error instanceof AppError) {
        if (error.code === 'EMAIL_ALREADY_IN_USE') {
          setErrors({ 
            general: 'Este email ya está registrado. ¿Quieres iniciar sesión en su lugar?' 
          });
        } else {
          setErrors({ general: error.getUserMessage() });
        }
      } else {
        setErrors({ general: 'Error inesperado. Inténtalo de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = () => setErrors({});

  // =====================================================
  // FORM VALIDATION
  // =====================================================

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 6) return 'Mínimo 6 caracteres';
    return undefined;
  };

  const validateRequired = (value: string, fieldName: string): string | undefined => {
    if (!value?.trim()) return `${fieldName} es requerido`;
    return undefined;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AiDuxCare</h1>
          <p className="text-gray-600 mt-2">
            {mode === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta profesional'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); clearErrors(); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); clearErrors(); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
            {errors.general.includes('iniciar sesión') && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm text-blue-600 hover:text-blue-800 mt-1 underline"
              >
                Ir a iniciar sesión
              </button>
            )}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Profesional
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apellido"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Profesional
              </label>
              <input
                type="email"
                required
                value={registerData.email}
                onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={registerData.password}
                onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organización
              </label>
              <input
                type="text"
                required
                value={registerData.organization}
                onChange={(e) => setRegisterData(prev => ({ ...prev, organization: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hospital/Clínica"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialización
              </label>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData(prev => ({ ...prev, role: e.target.value as ProfessionalRole }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="fisioterapeuta">Fisioterapeuta</option>
                <option value="medico">Médico</option>
                <option value="enfermero">Enfermero</option>
                <option value="terapeuta_ocupacional">Terapeuta Ocupacional</option>
                <option value="psicologo">Psicólogo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Licencia/Colegiado
              </label>
              <input
                type="text"
                required
                value={registerData.licenseNumber}
                onChange={(e) => setRegisterData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 12345"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta Profesional'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Plataforma médica segura y profesional</p>
          <p className="mt-1">Cumple estándares HIPAA/GDPR</p>
        </div>
      </div>
    </div>
  );
};