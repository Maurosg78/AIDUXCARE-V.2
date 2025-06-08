/**
 * 🔐 Authentication Page - AiDuxCare V.2
 * Página unificada para login, registro y selección de terapeutas
 * Diseño moderno con UX optimizada
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData } from '@/services/LocalAuthService';
import { Navigate } from 'react-router-dom';

type AuthMode = 'login' | 'register' | 'select';

const AuthenticationPage: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    login, 
    register, 
    switchTherapist, 
    getAllTherapists 
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    licenseNumber: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTherapists, setAvailableTherapists] = useState<string[]>([]);

  // ========= EFECTOS =========

  useEffect(() => {
    // Cargar terapeutas disponibles para modo select
    const therapists = getAllTherapists();
    setAvailableTherapists(therapists);
    
    // Si hay terapeutas disponibles, mostrar selector
    if (therapists.length > 0 && authMode === 'login') {
      setAuthMode('select');
    }
  }, [getAllTherapists, authMode]);

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/patient-complete" replace />;
  }

  // ========= HANDLERS =========

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar errores al escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors(['Por favor ingresa tu nombre']);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await login(formData.name.trim());
      
      if (!result.success) {
        setErrors([result.error || 'Error en el login']);
      }
    } catch (error) {
      setErrors(['Error interno. Por favor intenta nuevamente.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrors(['Por favor ingresa tu nombre']);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const registerData: RegisterData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        specialization: formData.specialization.trim() || undefined,
        licenseNumber: formData.licenseNumber.trim() || undefined
      };

      const result = await register(registerData);
      
      if (!result.success) {
        setErrors([result.error || 'Error en el registro']);
      }
    } catch (error) {
      setErrors(['Error interno. Por favor intenta nuevamente.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTherapistSelect = async (therapistName: string) => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await switchTherapist(therapistName);
      
      if (!result.success) {
        setErrors([result.error || 'Error al seleccionar terapeuta']);
        setIsSubmitting(false);
      }
    } catch (error) {
      setErrors(['Error interno. Por favor intenta nuevamente.']);
      setIsSubmitting(false);
    }
  };

  // ========= COMPONENTES DE FORMULARIO =========

  const LoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Terapeuta
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ingresa tu nombre completo"
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !formData.name.trim()}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isSubmitting ? 'Accediendo...' : 'Acceder'}
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿Primera vez usando AiDuxCare?{' '}
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Registrarse
        </button>
      </p>
    </form>
  );

  const RegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-6">
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre Completo *
        </label>
        <input
          type="text"
          id="reg-name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tu nombre profesional"
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email (Opcional)
        </label>
        <input
          type="email"
          id="reg-email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="tu@email.com"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="reg-specialization" className="block text-sm font-medium text-gray-700 mb-2">
          Especialización (Opcional)
        </label>
        <input
          type="text"
          id="reg-specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Fisioterapia"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="reg-licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Número de Colegiado (Opcional)
        </label>
        <input
          type="text"
          id="reg-licenseNumber"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Número de colegiado"
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !formData.name.trim()}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isSubmitting ? 'Registrando...' : 'Registrarse'}
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{' '}
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Iniciar Sesión
        </button>
      </p>
    </form>
  );

  const TherapistSelector = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Selecciona tu perfil de terapeuta
        </h3>
        <div className="space-y-3">
          {availableTherapists.map((therapistName) => (
            <button
              key={therapistName}
              onClick={() => handleTherapistSelect(therapistName)}
              disabled={isSubmitting}
              className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{therapistName}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
        >
          + Crear nuevo perfil de terapeuta
        </button>
      </div>
    </div>
  );

  // ========= RENDER =========

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AiDuxCare V.2</h1>
          <p className="text-gray-600 mt-2">
            {authMode === 'login' && 'Inicia sesión para continuar'}
            {authMode === 'register' && 'Crea tu perfil profesional'}
            {authMode === 'select' && 'Bienvenido de vuelta'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              {errors.map((error, index) => (
                <p key={index} className="text-red-600 text-sm">{error}</p>
              ))}
            </div>
          )}

          {/* Forms */}
          {authMode === 'login' && <LoginForm />}
          {authMode === 'register' && <RegisterForm />}
          {authMode === 'select' && <TherapistSelector />}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>AiDuxCare V.2 - Herramienta profesional para fisioterapeutas</p>
          <p className="mt-2">Almacenamiento local seguro - Sin dependencias externas</p>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage; 