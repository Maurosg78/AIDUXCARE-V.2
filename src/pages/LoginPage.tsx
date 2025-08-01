import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulación de login exitoso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Determinar tipo de usuario basado en email
      let userData = {
        displayName: 'Usuario',
        email: email,
        professionalTitle: 'FT',
        specialty: 'Fisioterapia',
        country: 'España'
      };

      if (email === 'demo@aiduxcare.com') {
        userData = {
          displayName: 'Dr. Ana García',
          email: email,
          professionalTitle: 'FT',
          specialty: 'Fisioterapia Traumatológica',
          country: 'España'
        };
      } else if (email === 'maurosg.2023@gmail.com') {
        userData = {
          displayName: 'FT. Mauricio Sobarzo',
          email: email,
          professionalTitle: 'FT',
          specialty: 'Fisioterapia Traumatológica',
          country: 'España'
        };
      } else if (email === 'admin@aiduxcare.com') {
        userData = {
          displayName: 'Dr. Carlos Admin',
          email: email,
          professionalTitle: 'FT',
          specialty: 'Administración',
          country: 'España'
        };
      }
      
      // Guardar datos del usuario usando el hook
      login(userData);
      
      // Redirigir al workflow profesional
      navigate('/professional-workflow');
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Fondo con degradé sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/60 to-indigo-100/40"></div>
      
      <div className="relative w-full max-w-md space-y-8 z-10">
        {/* Logo y branding */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <AiDuxCareLogo size="lg" variant="full" className="transform hover:scale-105 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Iniciar Sesión
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Accede a tu cuenta para gestionar pacientes y consultas
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de login */}
        <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
          <div className="space-y-4">
            {/* Campo email */}
            <div>
              <label htmlFor="email-address" className="sr-only">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Botón de login con efectos premium */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
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

        {/* Enlaces adicionales */}
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-600">
            ¿No tienes cuenta?{' '}
            <Link 
              to="/register" 
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline"
            >
              Regístrate
            </Link>
          </p>
          
          <Link 
            to="/forgot-password" 
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Credenciales de demostración */}
        <div className="mt-8 p-6 border border-slate-200 rounded-lg bg-white/60 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Credenciales de demostración:</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <p><span className="font-medium">Profesional:</span> demo@aiduxcare.com / password123</p>
            <p><span className="font-medium">Paciente:</span> paciente@aiduxcare.com / password123</p>
            <p><span className="font-medium">Admin:</span> admin@aiduxcare.com / password123</p>
            <p><span className="font-medium">Mauricio:</span> maurosg.2023@gmail.com / Mauro7812#</p>
          </div>
        </div>

        {/* Botón para volver al acceso directo */}
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al acceso directo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 