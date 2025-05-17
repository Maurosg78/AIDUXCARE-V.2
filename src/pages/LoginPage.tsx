import { vi } from "vitest";
import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userDataSourceSupabase } from '../core/services/userDataSourceSupabase';
import { useUser } from '../core/auth/UserContext';
import { checkSupabaseConnection } from '../utils/checkSupabaseConnection';
import { SUPABASE_URL } from '../config/env';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  // Si el usuario ya está autenticado, redirigir a la página principal
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Comprobar la conexión a Supabase al cargar
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await checkSupabaseConnection();
        setConnectionStatus(result.isConnected ? 'ok' : 'error');
        if (!result.isConnected) {
          console.error('Error de conexión a Supabase:', result.error);
        }
      } catch (err) {
        setConnectionStatus('error');
        console.error('Error comprobando la conexión:', err);
      }
    };
    
    checkConnection();
  }, []);

  // Si viene de una ruta protegida, obtener la URL original
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    // Si ya sabemos que hay problema de conexión, mostrar mensaje específico
    if (connectionStatus === 'error') {
      setError(`Error de conexión con el servidor (${SUPABASE_URL}). Por favor, verifica tu conexión a internet o contacta al administrador.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Usar el servicio de usuarios para autenticar
      const data = await userDataSourceSupabase.signInWithPassword(email, password);

      if (data?.user) {
        // Redirigir a la página original o a la principal
        navigate(from, { replace: true });
      }
    } catch (error: unknown) {
      const err = error as Error;
      
      // Mostrar mensajes más amigables según el error
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError(`Error de conexión con el servidor. Por favor, verifica tu conexión a internet.`);
      } else if (err.message.includes('Invalid login')) {
        setError('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
      } else {
      setError(err.message || 'Error al iniciar sesión');
      }
      
      console.error('Error al iniciar sesión:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-boneWhite px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slateBlue">AiDuxCare</h1>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slateBlue">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-slateBlue/70">
            Accede a tu cuenta para gestionar pacientes y consultas
          </p>
        </div>
        
        {error && (
          <div className="bg-softCoral/10 border-l-4 border-softCoral p-4">
            <p className="text-softCoral">{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin} role="form">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue placeholder:text-neutralGray focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue placeholder:text-neutralGray focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full justify-center rounded-md bg-softCoral px-3 py-3 text-sm font-semibold text-white hover:bg-intersectionGreen focus:outline-none focus:ring-2 focus:ring-intersectionGreen focus:ring-offset-2 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slateBlue/70">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-softCoral hover:text-intersectionGreen transition-colors">
              Regístrate
            </Link>
          </p>
        </div>
        
        {/* Credenciales de demostración */}
        <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-sm font-medium text-slateBlue mb-2">Credenciales de demostración:</h3>
          <p className="text-xs text-slateBlue/70 mb-1">Profesional: demo@aiduxcare.com / password123</p>
          <p className="text-xs text-slateBlue/70 mb-1">Paciente: paciente@aiduxcare.com / password123</p>
          <p className="text-xs text-slateBlue/70">Admin: admin@aiduxcare.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 