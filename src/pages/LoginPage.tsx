// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
// import { useProfessionalProfile } from '../hooks/useProfessionalProfile';
import { emailActivationService } from '../services/emailActivationService';

import logger from '@/shared/utils/logger';


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Hook para perfil profesional (preparado para futuras integraciones)
  // const { profile } = useProfessionalProfile();

  // Manejar mensajes de éxito desde navegación
  useEffect(() => {
    if (location.state?.message && location.state?.type === 'success') {
      setSuccessMessage(location.state.message);
      // Limpiar el estado de navegación para evitar mostrar el mensaje múltiples veces
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      logger.info('[DEBUG] Intentando login con email:', email);

      // Autenticar con Firebase usando el hook
      await login(email, password);

      // Verificar si el profesional existe y está activo
      const professional = await emailActivationService.getProfessional(email);
      
      if (!professional) {
        setError('Email no registrado. Completa el registro primero.');
        return;
      }

      if (!professional.isActive) {
        setError('Tu cuenta no está activada. Revisa tu email y activa tu cuenta antes de iniciar sesión.');
        return;
      }

      logger.info('[DEBUG] Profesional activo encontrado:', professional.displayName);

      // Actualizar último login
      await emailActivationService.updateLastLogin(email);


      
      // Redirigir al centro de comando
      navigate('/dashboard');
    } catch (err) {
      logger.error('[DEBUG] Error en login:', err);
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-12">
        {/* Header Apple-style */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">
            Bienvenido a{' '}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
              AiDuxCare
            </span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed font-light">
            Ficha médica electrónica asistida por AI.<br/>
            Menos papeleo, más seguridad, más tiempo.
          </p>
        </div>

        {/* Mensaje de éxito Apple-style */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Mensaje de error Apple-style */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Formulario de login Apple-style */}
        <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
          <div className="space-y-5">
            {/* Campo email Apple-style */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Campo contraseña Apple-style */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Botón de login Apple-style */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>

        {/* Enlaces adicionales Apple-style */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link 
              to="/register" 
              className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
            >
              Regístrate
            </Link>
          </p>
          
          <Link 
            to="/forgot-password" 
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 